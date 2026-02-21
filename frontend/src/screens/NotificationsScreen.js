import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotification } from '../context/NotificationContext';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { Bell, CheckCircle, Clock, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

export default function NotificationsScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
    const { history, markAsRead, markAllAsRead } = useNotification();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (history) {
            setNotifications(history);
        }
    }, [history]);

    const handleNotificationPress = (item) => {
        // Mark as read when clicked
        if (!item.read && markAsRead) {
            markAsRead(item.uniqId);
        }

        // Navigate to complaint details
        if (item.type === 'strike_warning') {
            navigation.navigate('Profile');
        } else if (item.complaint && item.complaint.id) {
            navigation.navigate('ComplaintDetails', { complaintId: item.complaint.id });
        }
    };

    const renderItem = ({ item }) => {
        const isStatusUpdate = item.type === 'status_update' || item.title === 'Status Update';
        const isStrikeWarning = item.type === 'strike_warning';
        const isUnread = !item.read;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    darkMode && styles.cardDark,
                    isUnread && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.iconBox, { backgroundColor: isStrikeWarning ? '#FEE2E2' : (isStatusUpdate ? '#EFF6FF' : '#F3F4F6') }]}>
                    {isStrikeWarning ? <AlertTriangle size={24} color="#EF4444" /> : (isStatusUpdate ? <Info size={24} color="#1E88E5" /> : <Bell size={24} color="#6B7280" />)}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.title, darkMode && styles.textWhite]}>{item.title}</Text>
                        {isUnread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, darkMode && styles.darkContainer]}>
            <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
            <View style={styles.header}>
                <Text style={[styles.heading, darkMode && styles.textWhite]}>Notifications</Text>
                {notifications.some(n => !n.read) && markAllAsRead && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.uniqId || item.id.toString() + Math.random()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Bell size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
            <BottomNav navigation={navigation} darkMode={darkMode} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    darkContainer: { backgroundColor: '#111827' },
    header: { padding: 16, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    textWhite: { color: 'white' },
    markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#EFF6FF', borderRadius: 8 },
    markAllText: { color: '#1E88E5', fontWeight: '600', fontSize: 14 },
    card: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: '#1E88E5', backgroundColor: '#F0F9FF' },
    iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    title: { fontWeight: 'bold', fontSize: 16, color: '#1F2937', marginBottom: 4 },
    message: { color: '#6B7280', fontSize: 14, marginBottom: 4 },
    time: { color: '#9CA3AF', fontSize: 12 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E88E5', marginLeft: 8 },
    empty: { alignItems: 'center', marginTop: 60, gap: 16 },
    emptyText: { color: '#9CA3AF', fontSize: 16 }
});
