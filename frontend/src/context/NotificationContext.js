
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Bell, X } from 'lucide-react-native';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [lastStatuses, setLastStatuses] = useState({});
    const [history, setHistory] = useState([]); // Notification history
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const navigation = useRef(null);

    const setNavigation = (nav) => {
        navigation.current = nav;
    };

    const loadHistory = async () => {
        try {
            const historyStr = await AsyncStorage.getItem('notificationHistory');
            if (historyStr) setHistory(JSON.parse(historyStr));
        } catch (e) {
            console.error("Failed to load notification history", e);
        }
    };

    const loadLastStatuses = async () => {
        try {
            const statusesStr = await AsyncStorage.getItem('lastComplaintStatuses');
            if (statusesStr) {
                const loaded = JSON.parse(statusesStr);
                console.log("NotificationContext: Loaded lastStatuses from storage:", loaded);
                setLastStatuses(loaded);
            }
        } catch (e) {
            console.error("Failed to load last statuses", e);
        }
    };

    const saveLastStatuses = async (statuses) => {
        try {
            await AsyncStorage.setItem('lastComplaintStatuses', JSON.stringify(statuses));
        } catch (e) {
            console.error("Failed to save last statuses", e);
        }
    };

    const addToHistory = async (newNotification) => {
        const updatedHistory = [newNotification, ...history].slice(0, 50); // Keep last 50
        setHistory(updatedHistory);
        await AsyncStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
    };

    useEffect(() => {
        loadHistory();
        loadLastStatuses();
    }, []);

    const fetchComplaints = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) {
                console.log("NotificationContext: No userData in storage");
                return;
            }

            const userData = JSON.parse(userDataStr);

            // CRITICAL FIX: Match HomeScreen logic. Prioritize firebaseUid.
            let uid = userData.firebaseUid;
            if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
            if (!uid) uid = userData.id || userData.uid;

            if (!uid) {
                console.log("NotificationContext: No UID found in userData");
                return;
            }

            console.log("NotificationContext: Polling for user:", uid);

            const response = await api.get(`/complaints/citizen/${uid}`);
            const complaints = response.data.complaints || [];
            console.log("NotificationContext: Fetched", complaints.length, "complaints");

            // Check for status changes
            const newStatuses = {};
            let changedComplaint = null;

            complaints.forEach(c => {
                newStatuses[c.id] = c.currentStatus;

                // If we have a previous status and it's different
                if (lastStatuses[c.id] && lastStatuses[c.id] !== c.currentStatus) {
                    console.log(`NotificationContext: Status changed for complaint ${c.id}: ${lastStatuses[c.id]} -> ${c.currentStatus}`);
                    changedComplaint = c;
                }
            });

            // Update stored statuses
            setLastStatuses(prev => {
                const updated = { ...prev, ...newStatuses };
                console.log("NotificationContext: Updated lastStatuses:", updated);
                saveLastStatuses(updated); // Persist to storage
                return updated;
            });

            // Trigger notification if changed
            if (changedComplaint) {
                console.log("NotificationContext: Triggering notification for complaint", changedComplaint.id);
                const statusMap = {
                    'pending': 'Pending',
                    'accepted': 'Accepted',
                    'in_progress': 'In Progress',
                    'resolved': 'Resolved',
                    'rejected': 'Rejected'
                };
                const readableStatus = statusMap[changedComplaint.currentStatus] || changedComplaint.currentStatus;

                const notifData = {
                    id: changedComplaint.id, // Complaint ID
                    uniqId: Date.now().toString(), // Unique ID for list
                    title: 'Status Update',
                    message: `Complaint #${changedComplaint.id} is now ${readableStatus}`,
                    timestamp: new Date().toISOString(),
                    complaint: changedComplaint,
                    read: false
                };

                showNotification(notifData);
                addToHistory(notifData);
            } else {
                console.log("NotificationContext: No status changes detected");
            }

        } catch (error) {
            // Silent fail on polling error
            console.log("NotificationContext: Polling error:", error.message);
        }
    };

    useEffect(() => {
        console.log("NotificationContext: Starting polling");
        // Initial fetch
        fetchComplaints();

        // Poll every 30 seconds
        const interval = setInterval(fetchComplaints, 30000);
        return () => {
            console.log("NotificationContext: Stopping polling");
            clearInterval(interval);
        };
    }, []);

    const showNotification = (notifData) => {
        setNotification(notifData);

        // Animate in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Auto dismiss after 5 seconds
        setTimeout(dismissNotification, 5000);
    };

    const dismissNotification = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start(() => setNotification(null));
    };

    const handlePress = () => {
        if (notification && navigation.current) {
            navigation.current.navigate('ComplaintDetails', { complaintId: notification.id });
            dismissNotification();
        }
    };

    const markAsRead = async (notifId) => {
        const updatedHistory = history.map(n =>
            n.uniqId === notifId ? { ...n, read: true } : n
        );
        setHistory(updatedHistory);
        await AsyncStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
    };

    const markAllAsRead = async () => {
        const updatedHistory = history.map(n => ({ ...n, read: true }));
        setHistory(updatedHistory);
        await AsyncStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
    };

    return (
        <NotificationContext.Provider value={{ setNavigation, history, notification, markAsRead, markAllAsRead }}>
            {children}
            {notification && (
                <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.content} onPress={handlePress}>
                        <View style={styles.iconBox}>
                            <Bell size={20} color="white" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{notification.title}</Text>
                            <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={dismissNotification} style={styles.closeBtn}>
                        <X size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </NotificationContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 9999,
        borderLeftWidth: 4,
        borderLeftColor: '#1E88E5',
        padding: 4 // inner padding handled by children
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    iconBox: {
        backgroundColor: '#1E88E5',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    title: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#1F2937'
    },
    message: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    closeBtn: {
        padding: 12,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6'
    }
});
