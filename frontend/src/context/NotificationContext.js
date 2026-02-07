
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Bell, X, AlertTriangle, Flag } from 'lucide-react-native';

const NotificationContext = createContext();
const AdminNotificationContext = createContext();
const AuthorityNotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);
export const useAdminNotification = () => useContext(AdminNotificationContext);
export const useAuthorityNotification = () => useContext(AuthorityNotificationContext);

export const NotificationProvider = ({ children }) => {
    // Citizen notification state
    const [notification, setNotification] = useState(null);
    const [lastStatuses, setLastStatuses] = useState({});
    const [history, setHistory] = useState([]); // Notification history
    const [currentUid, setCurrentUid] = useState(null); // Track current user
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    // Admin notification state
    const [adminNotification, setAdminNotification] = useState(null);
    const [adminHistory, setAdminHistory] = useState([]); // Admin notification history
    const [lastCounts, setLastCounts] = useState({ reports: 0, appeals: 0 });
    const [unreadReportsCount, setUnreadReportsCount] = useState(0);
    const [unreadAppealsCount, setUnreadAppealsCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const adminFadeAnim = useRef(new Animated.Value(0)).current;
    
    // Authority notification state
    const [authorityNotification, setAuthorityNotification] = useState(null);
    const [authorityHistory, setAuthorityHistory] = useState([]);
    const [lastAssignmentCount, setLastAssignmentCount] = useState(0);
    const [isAuthority, setIsAuthority] = useState(false);
    const [authorityCompanyId, setAuthorityCompanyId] = useState(null);
    const authorityFadeAnim = useRef(new Animated.Value(0)).current;
    const lastAssignmentCountRef = useRef(0);
    
    // Shared state
    const navigation = useRef(null);
    const [userRole, setUserRole] = useState(null); // Track user role
    const lastStatusesRef = useRef({}); // Ref to avoid stale closure
    const lastCountsRef = useRef({ reports: 0, appeals: 0 });

    const setNavigation = (nav) => {
        navigation.current = nav;
    };

    // Get user-specific storage key
    const getStorageKey = (baseKey, uid) => {
        return uid ? `${baseKey}_${uid}` : baseKey;
    };

    const loadHistory = async (uid) => {
        try {
            const key = getStorageKey('notificationHistory', uid);
            const historyStr = await AsyncStorage.getItem(key);
            if (historyStr) setHistory(JSON.parse(historyStr));
            else setHistory([]); // Clear if no history for this user
        } catch (e) {
            console.error("Failed to load notification history", e);
        }
    };

    const loadAdminHistory = async (isUserAdmin) => {
        // CRITICAL: Only load admin history if user is actually an admin
        if (!isUserAdmin) {
            //console.log('NotificationContext: Skipping admin history load - user is not admin');
            setAdminHistory([]);
            return;
        }
        try {
            const historyStr = await AsyncStorage.getItem('adminNotificationHistory');
            if (historyStr) setAdminHistory(JSON.parse(historyStr));
            else setAdminHistory([]);
        } catch (e) {
            console.error('Failed to load admin notification history', e);
        }
    };

    const loadLastStatuses = async (uid) => {
        try {
            const key = getStorageKey('lastComplaintStatuses', uid);
            const statusesStr = await AsyncStorage.getItem(key);
            if (statusesStr) {
                const loaded = JSON.parse(statusesStr);
                console.log("NotificationContext: Loaded lastStatuses from storage:", loaded);
                setLastStatuses(loaded);
                lastStatusesRef.current = loaded; // Update ref
            } else {
                setLastStatuses({});
                lastStatusesRef.current = {};
            }
        } catch (e) {
            console.error("Failed to load last statuses", e);
        }
    };

    // Load admin last counts from storage
    const loadLastCounts = async () => {
        try {
            const countsStr = await AsyncStorage.getItem('adminLastCounts');
            if (countsStr) {
                const loaded = JSON.parse(countsStr);
                setLastCounts(loaded);
                lastCountsRef.current = loaded; // CRITICAL: Update ref immediately
                //console.log('NotificationContext: Loaded admin last counts:', loaded);
            } else {
                //console.log('NotificationContext: No previous admin counts found');
            }
        } catch (e) {
            console.error('Failed to load admin last counts', e);
        }
    };

    // Save admin counts to storage
    const saveLastCounts = async (counts) => {
        try {
            await AsyncStorage.setItem('adminLastCounts', JSON.stringify(counts));
        } catch (e) {
            console.error('Failed to save admin last counts', e);
        }
    };

    const saveLastStatuses = async (statuses, uid) => {
        try {
            const key = getStorageKey('lastComplaintStatuses', uid);
            await AsyncStorage.setItem(key, JSON.stringify(statuses));
        } catch (e) {
            console.error("Failed to save last statuses", e);
        }
    };

    const addToHistory = async (newNotification, uid) => {
        const updatedHistory = [newNotification, ...history].slice(0, 50); // Keep last 50
        setHistory(updatedHistory);
        const key = getStorageKey('notificationHistory', uid);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const addToAdminHistory = async (newNotification) => {
        const updatedHistory = [newNotification, ...adminHistory].slice(0, 50); // Keep last 50
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    // Authority history functions
    const loadAuthorityHistory = async (companyId) => {
        try {
            const key = `authorityNotificationHistory_${companyId}`;
            const historyStr = await AsyncStorage.getItem(key);
            if (historyStr) setAuthorityHistory(JSON.parse(historyStr));
            else setAuthorityHistory([]);
        } catch (e) {
            console.error('Failed to load authority notification history', e);
        }
    };

    const addToAuthorityHistory = async (newNotification, companyId) => {
        const updatedHistory = [newNotification, ...authorityHistory].slice(0, 50);
        setAuthorityHistory(updatedHistory);
        const key = `authorityNotificationHistory_${companyId}`;
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const loadLastAssignmentCount = async (companyId) => {
        try {
            const key = companyId ? `authorityLastAssignmentCount_${companyId}` : 'authorityLastAssignmentCount';
            const countStr = await AsyncStorage.getItem(key);
            if (countStr) {
                const count = parseInt(countStr);
                setLastAssignmentCount(count);
                lastAssignmentCountRef.current = count;
                //console.log('NotificationContext: Loaded last assignment count:', count, 'for company:', companyId);
            } else {
                console.log('NotificationContext: No previous assignment count found for company:', companyId);
                setLastAssignmentCount(0);
                lastAssignmentCountRef.current = 0;
            }
        } catch (e) {
            console.error('Failed to load last assignment count', e);
        }
    };

    const saveLastAssignmentCount = async (count, companyId) => {
        try {
            const key = companyId ? `authorityLastAssignmentCount_${companyId}` : 'authorityLastAssignmentCount';
            await AsyncStorage.setItem(key, count.toString());
            console.log('NotificationContext: Saved assignment count:', count, 'for company:', companyId);
        } catch (e) {
            console.error('Failed to save last assignment count', e);
        }
    };

    // Load user data and initialize
    useEffect(() => {
        const initUser = async () => {
            try {
                const userDataStr = await AsyncStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    let uid = userData.firebaseUid;
                    if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
                    if (!uid) uid = userData.id || userData.uid;

                    if (uid) {
                        setCurrentUid(uid);
                        await loadHistory(uid);
                        await loadLastStatuses(uid);
                    }
                    
                    // Store user role for filtering
                    const role = userData.role || 'citizen';
                    setUserRole(role);
                    
                    // Check if user is admin - CRITICAL: Always update this state
                    const adminStatus = role === 'admin';
                    //console.log('NotificationContext: Setting admin status - role:', role, 'adminStatus:', adminStatus);
                    setIsAdmin(adminStatus);
                    
                    // Check if user is authority
                    const authorityStatus = role === 'authority';
                    setIsAuthority(authorityStatus);
                    //console.log('NotificationContext: Authority check - role:', role, 'authorityStatus:', authorityStatus, 'userData.id:', userData.id);
                    
                    if (authorityStatus && userData.id) {
                        //console.log('NotificationContext: Setting up authority with ID:', userData.id);
                        setAuthorityCompanyId(userData.id);
                        await loadAuthorityHistory(userData.id);
                        await loadLastAssignmentCount(userData.id);
                    } else {
                        // Clear authority data for non-authority users
                        //console.log('NotificationContext: Clearing authority data');
                        setAuthorityHistory([]);
                        setLastAssignmentCount(0);
                        setAuthorityCompanyId(null);
                    }
                    
                    console.log('NotificationContext: User role:', role, 'isAdmin:', adminStatus, 'isAuthority:', authorityStatus);
                    
                    if (adminStatus) {
                        await loadLastCounts();
                        await loadAdminHistory(true);
                    } else {
                        // Clear admin data for non-admin users
                        setAdminHistory([]);
                        setLastCounts({ reports: 0, appeals: 0 });
                    }
                }
            } catch (e) {
                console.error("Failed to initialize user", e);
            }
        };
        initUser();
    }, []);

    const fetchComplaints = async () => {
        try {
            // Don't poll on unauthenticated screens
            const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
            const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];
            
            if (unauthenticatedScreens.includes(currentRoute)) {
                //console.log("NotificationContext: Skipping polling on", currentRoute, "screen");
                return;
            }

            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) {
                //console.log("NotificationContext: No userData in storage");
                return;
            }

            const userData = JSON.parse(userDataStr);
            
            // CRITICAL: Only poll complaints for citizens
            const role = userData.role || 'citizen';
            if (role !== 'citizen') {
                //console.log("NotificationContext: Skipping complaint polling - user is", role);
                return;
            }

            // CRITICAL FIX: Match HomeScreen logic. Prioritize firebaseUid.
            let uid = userData.firebaseUid;
            if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
            if (!uid) uid = userData.id || userData.uid;

            if (!uid) {
                //console.log("NotificationContext: No UID found in userData");
                return;
            }

            // console.log("NotificationContext: Polling for user:", uid);

            const response = await api.get(`/api/complaints/citizen/${uid}`);
            const complaints = response.data.complaints || [];
            //console.log("NotificationContext: Fetched", complaints.length, "complaints");

            // Check for status changes using ref to avoid stale closure
            const newStatuses = {};
            let changedComplaint = null;

            complaints.forEach(c => {
                newStatuses[c.id] = c.currentStatus;

                // If we have a previous status and it's different
                if (lastStatusesRef.current[c.id] && lastStatusesRef.current[c.id] !== c.currentStatus) {
                    //console.log(`NotificationContext: Status changed for complaint ${c.id}: ${lastStatusesRef.current[c.id]} -> ${c.currentStatus}`);
                    changedComplaint = c;
                }
            });

            // Update stored statuses
            const updated = { ...lastStatusesRef.current, ...newStatuses };
            console.log("NotificationContext: Updated lastStatuses:", updated);
            setLastStatuses(updated);
            lastStatusesRef.current = updated; // Update ref
            saveLastStatuses(updated, uid); // Persist to storage with user-specific key

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
                    read: false,
                    type: 'status_update'
                };

                showNotification(notifData);
                addToHistory(notifData, uid);
            } else {
                console.log("NotificationContext: No status changes detected");
            }

        } catch (error) {
            // Only log errors for citizens (authorities/admins shouldn't poll complaints)
            if (userRole === 'citizen') {
                console.error("Failed to fetch complaints", error);
            }
        }
    };

    useEffect(() => {
        if (!currentUid) return; // Don't start polling until user is loaded

        //console.log("NotificationContext: Starting polling for user:", currentUid);
        // Initial fetch
        fetchComplaints();

        // Poll every 10 seconds (reduced from 30 for faster notifications)
        const interval = setInterval(fetchComplaints, 10000);
        return () => {
            //console.log("NotificationContext: Stopping polling");
            clearInterval(interval);
        };
    }, [currentUid]); // Re-run when user changes

    // Poll for admin data (reports and appeals)
    const pollAdminData = async () => {
        try {
            // CRITICAL: Double-check user role before polling
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                const role = userData.role || 'citizen';
                if (role !== 'admin') {
                    //console.log('AdminPolling: Skipping - user role is', role, 'not admin');
                    return;
                }
            } else {
                //console.log('AdminPolling: Skipping - no user data');
                return;
            }
            
            // Check current route - don't poll on unauthenticated screens
            const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
            const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];
            
            if (unauthenticatedScreens.includes(currentRoute)) {
                //console.log('AdminPolling: Skipping - on unauthenticated screen:', currentRoute);
                return;
            }

            console.log('AdminPolling: Fetching reports and appeals...');
            
            // Fetch reports
            const reportsResponse = await api.get('/complaints/reports?status=pending');
            const pendingReports = reportsResponse.data?.reports || [];
            const newReportsCount = pendingReports.length;

            // Fetch appeals
            const appealsResponse = await api.get('/complaints/appeals?status=pending');
            const pendingAppeals = appealsResponse.data?.appeals || [];
            const newAppealsCount = pendingAppeals.length;

            console.log('AdminPolling: Current counts - Reports:', newReportsCount, 'Appeals:', newAppealsCount);
            console.log('AdminPolling: Previous counts - Reports:', lastCountsRef.current.reports, 'Appeals:', lastCountsRef.current.appeals);

            // Update unread counts
            setUnreadReportsCount(newReportsCount);
            setUnreadAppealsCount(newAppealsCount);

            // Check if there are new items
            const prevCounts = lastCountsRef.current;
            const newReports = newReportsCount > prevCounts.reports;
            const newAppeals = newAppealsCount > prevCounts.appeals;

            console.log('AdminPolling: New reports?', newReports, 'New appeals?', newAppeals);

            // Show notification for new items
            if (newReports) {
                const diff = newReportsCount - prevCounts.reports;
                console.log('AdminPolling: Showing notification for', diff, 'new report(s)');
                
                // Get the latest reports to include complaint IDs
                const latestReports = pendingReports.slice(0, diff);
                
                latestReports.forEach((report, index) => {
                    console.log('Creating notification for report:', report.id, 'complaintId:', report.complaintId);
                    const notifData = {
                        uniqId: Date.now().toString() + '_' + index,
                        type: 'report',
                        title: 'New Complaint Report',
                        message: report.Complaint?.title || `Complaint #${report.complaintId} has been reported`,
                        icon: Flag,
                        color: '#EF4444',
                        timestamp: new Date(report.createdAt).toISOString(),
                        read: false,
                        complaintId: report.complaintId,
                        reportId: report.id,
                        reason: report.reason
                    };
                    console.log('Notification data:', notifData);
                    showAdminNotification(notifData);
                    addToAdminHistory(notifData);
                });
            } else if (newAppeals) {
                const diff = newAppealsCount - prevCounts.appeals;
                console.log('AdminPolling: Showing notification for', diff, 'new appeal(s)');
                
                // Get the latest appeals to include complaint IDs
                const latestAppeals = pendingAppeals.slice(0, diff);
                
                latestAppeals.forEach((appeal, index) => {
                    console.log('Creating notification for appeal:', appeal.id, 'title:', appeal.title);
                    const notifData = {
                        uniqId: Date.now().toString() + '_' + index,
                        type: 'appeal',
                        title: 'New Complaint Appeal',
                        message: appeal.title || `Complaint #${appeal.id} has been appealed`,
                        icon: AlertTriangle,
                        color: '#F59E0B',
                        timestamp: new Date(appeal.updatedAt).toISOString(),
                        read: false,
                        complaintId: appeal.id,
                        appealReason: appeal.reason
                    };
                    console.log('Notification data:', notifData);
                    showAdminNotification(notifData);
                    addToAdminHistory(notifData);
                });
            }

            // Update stored counts
            const newCounts = { reports: newReportsCount, appeals: newAppealsCount };
            setLastCounts(newCounts);
            lastCountsRef.current = newCounts;
            await saveLastCounts(newCounts);
            console.log('AdminPolling: Updated counts to:', newCounts);

        } catch (error) {
            console.error('Admin polling error:', error.message, error);
        }
    };

    // Poll for authority assignments
    const pollAuthorityAssignments = async () => {
        try {
            // Double-check user role before polling
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                const role = userData.role || 'citizen';
                if (role !== 'authority') {
                    console.log('AuthorityPolling: Skipping - user role is', role, 'not authority');
                    return;
                }
                
                const companyId = userData.id;
                if (!companyId) {
                    console.log('AuthorityPolling: No company ID found');
                    return;
                }

                // Check current route - don't poll on unauthenticated screens
                const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
                const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];
                
                if (unauthenticatedScreens.includes(currentRoute)) {
                    console.log('AuthorityPolling: Skipping - on unauthenticated screen:', currentRoute);
                    return;
                }

                console.log('AuthorityPolling: Fetching assignments for company:', companyId);
                
                // Fetch complaints assigned to this authority
                const response = await api.get(`/complaints/authority/${companyId}`);
                const complaints = response.data?.complaints || [];
                const currentCount = complaints.length;
                
                console.log('AuthorityPolling: Current assignment count:', currentCount);
                console.log('AuthorityPolling: Previous assignment count:', lastAssignmentCountRef.current);
                
                // Check if there are new assignments
                const hasNewAssignments = currentCount > lastAssignmentCountRef.current;
                console.log('AuthorityPolling: New assignments?', hasNewAssignments);
                
                if (hasNewAssignments) {
                    const newCount = currentCount - lastAssignmentCountRef.current;
                    console.log('AuthorityPolling: New assignments detected:', newCount);
                    
                    // Get the newest complaints
                    const newestComplaints = complaints
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, newCount);
                    
                    // Create notifications for each new assignment
                    newestComplaints.forEach(complaint => {
                        const notifData = {
                            uniqId: `authority_${complaint.id}_${Date.now()}`,
                            title: 'New Assignment',
                            message: `New complaint: ${complaint.title}`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'assignment',
                            complaintId: complaint.id,
                            complaint: complaint
                        };
                        console.log('AuthorityPolling: Creating notification:', notifData);
                        showAuthorityNotification(notifData);
                        addToAuthorityHistory(notifData, companyId);
                    });
                }
                
                // Update stored count
                setLastAssignmentCount(currentCount);
                lastAssignmentCountRef.current = currentCount;
                await saveLastAssignmentCount(currentCount, companyId);
                console.log('AuthorityPolling: Updated assignment count to:', currentCount, 'for company:', companyId);
                
            } else {
                console.log('AuthorityPolling: No user data found');
            }
        } catch (error) {
            console.error('Authority polling error:', error.message, error);
        }
    };


    // Start admin polling ONLY when user is admin
    useEffect(() => {
        // CRITICAL: Must be admin role, not just isAdmin flag
        const shouldPoll = isAdmin && userRole === 'admin';
        
        if (!shouldPoll) {
            console.log('AdminPolling: Not starting - isAdmin:', isAdmin, 'userRole:', userRole);
            return;
        }

        console.log('AdminPolling: Starting admin notifications polling');
        pollAdminData(); // Initial fetch

        // Poll every 15 seconds
        const interval = setInterval(pollAdminData, 15000);
        return () => {
            console.log('AdminPolling: Stopping admin notifications polling');
            clearInterval(interval);
        };
    }, [isAdmin, userRole]); // Re-run when admin status or role changes

    // Start authority polling ONLY when user is authority
    useEffect(() => {
        const shouldPoll = isAuthority && userRole === 'authority' && authorityCompanyId;
        
        if (!shouldPoll) {
            console.log('AuthorityPolling: Not starting - isAuthority:', isAuthority, 'userRole:', userRole, 'companyId:', authorityCompanyId);
            return;
        }

        console.log('AuthorityPolling: Starting authority notifications polling');
        pollAuthorityAssignments(); // Initial fetch

        // Poll every 15 seconds
        const interval = setInterval(pollAuthorityAssignments, 15000);
        return () => {
            console.log('AuthorityPolling: Stopping authority notifications polling');
            clearInterval(interval);
        };
    }, [isAuthority, userRole, authorityCompanyId]); // Re-run when authority status changes

    const showNotification = (notifData) => {
        // CRITICAL: Only show citizen notifications for citizens (not admins or authorities)
        if (userRole !== 'citizen') {
            console.log("NotificationContext: Skipping citizen notification - user is", userRole);
            return;
        }
        
        // Check if user is on an authenticated screen before showing notification
        const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
        const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];
        
        if (unauthenticatedScreens.includes(currentRoute)) {
            console.log("NotificationContext: Skipping notification on", currentRoute, "screen");
            return; // Don't show notifications on login/signup/landing screens
        }

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
        const key = getStorageKey('notificationHistory', currentUid);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const markAsUnread = async (notifId) => {
        const updatedHistory = history.map(n =>
            n.uniqId === notifId ? { ...n, read: false, timestamp: new Date().toISOString() } : n
        );
        // Sort to move unread notification to top
        const sorted = updatedHistory.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        setHistory(sorted);
        const key = getStorageKey('notificationHistory', currentUid);
        await AsyncStorage.setItem(key, JSON.stringify(sorted));
    };

    const markAllAsRead = async () => {
        const updatedHistory = history.map(n => ({ ...n, read: true }));
        setHistory(updatedHistory);
        const key = getStorageKey('notificationHistory', currentUid);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const showAdminNotification = (notifData) => {
        console.log('showAdminNotification called with:', notifData.title);
        console.log('showAdminNotification checks - isAdmin:', isAdmin, 'userRole:', userRole);
        
        // CRITICAL: Only show notifications for admins (double check with both isAdmin and userRole)
        if (!isAdmin || userRole !== 'admin') {
            console.log("AdminNotificationContext: Skipping notification - user is not admin. isAdmin:", isAdmin, "userRole:", userRole);
            return;
        }

        // Check if on authenticated screen
        const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
        const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];
        
        if (unauthenticatedScreens.includes(currentRoute)) {
            console.log("AdminNotificationContext: Skipping notification on", currentRoute, "screen");
            return;
        }

        console.log('showAdminNotification: Displaying notification!');
        setAdminNotification(notifData);

        // Animate in
        Animated.timing(adminFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Auto dismiss after 5 seconds
        setTimeout(dismissAdminNotification, 5000);
    };

    const dismissAdminNotification = () => {
        Animated.timing(adminFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start(() => setAdminNotification(null));
    };

    const handleAdminPress = () => {
        if (adminNotification && navigation.current) {
            // Navigate to admin dashboard flags tab
            if (adminNotification.type === 'report' || adminNotification.type === 'appeal') {
                navigation.current.navigate('AdminDashboard', { 
                    initialTab: 'flags',
                    flagTab: adminNotification.type === 'report' ? 'reported' : 'appealed'
                });
            }
            dismissAdminNotification();
        }
    };

    const getTotalUnreadCount = () => {
        return adminHistory.filter(n => !n.read).length;
    };

    const markAdminAsRead = async (notifId) => {
        const updatedHistory = adminHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: true } : n
        );
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    const markAdminAsUnread = async (notifId) => {
        const updatedHistory = adminHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: false, timestamp: new Date().toISOString() } : n
        );
        // Sort to move unread notification to top
        const sorted = updatedHistory.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        setAdminHistory(sorted);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(sorted));
    };

    const markAllAdminAsRead = async () => {
        const updatedHistory = adminHistory.map(n => ({ ...n, read: true }));
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    // Test function to manually trigger admin notification
    const testAdminNotification = () => {
        console.log('TEST: Manually triggering admin notification');
        const testNotif = {
            uniqId: Date.now().toString(),
            type: 'report',
            title: 'Test Notification',
            message: 'This is a test notification to verify the system works',
            icon: Flag,
            color: '#EF4444',
            timestamp: new Date().toISOString(),
            read: false,
            complaintId: 1, // Test complaint ID
            count: 1
        };
        showAdminNotification(testNotif);
        addToAdminHistory(testNotif);
    };

    const testAuthorityNotification = () => {
        console.log('TEST: Manually triggering authority notification');
        const testNotif = {
            uniqId: `authority_test_${Date.now()}`,
            title: 'Test Assignment',
            message: 'This is a test notification for authority assignment',
            timestamp: new Date().toISOString(),
            read: false,
            type: 'assignment',
            complaintId: 1, // Test complaint ID
        };
        console.log('TEST: Calling showAuthorityNotification with:', testNotif);
        showAuthorityNotification(testNotif);
        if (authorityCompanyId) {
            addToAuthorityHistory(testNotif, authorityCompanyId);
        }
    };

    // ========== AUTHORITY NOTIFICATION FUNCTIONS ==========
    const showAuthorityNotification = (notifData) => {
        console.log('showAuthorityNotification called with:', notifData.title);
        console.log('showAuthorityNotification checks - isAuthority:', isAuthority, 'userRole:', userRole);
        
        // Only show notifications for authorities
        if (!isAuthority || userRole !== 'authority') {
            console.log("AuthorityNotificationContext: Skipping notification - user is not authority. isAuthority:", isAuthority, "userRole:", userRole);
            return;
        }

        // Check if on authenticated screen
        const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
        const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];
        
        if (unauthenticatedScreens.includes(currentRoute)) {
            console.log("AuthorityNotificationContext: Skipping notification on", currentRoute, "screen");
            return;
        }

        console.log('showAuthorityNotification: Displaying notification!');
        setAuthorityNotification(notifData);

        // Animate in
        Animated.timing(authorityFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();

        // Auto dismiss after 5 seconds
        setTimeout(dismissAuthorityNotification, 5000);
    };

    const dismissAuthorityNotification = () => {
        Animated.timing(authorityFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start(() => setAuthorityNotification(null));
    };

    const handleAuthorityPress = () => {
        if (authorityNotification && navigation.current && authorityNotification.complaintId) {
            navigation.current.navigate('ComplaintDetails', { 
                id: authorityNotification.complaintId 
            });
            dismissAuthorityNotification();
        }
    };

    const getAuthorityUnreadCount = () => {
        return authorityHistory.filter(n => !n.read).length;
    };

    const markAuthorityAsRead = async (notifId) => {
        const updatedHistory = authorityHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: true } : n
        );
        setAuthorityHistory(updatedHistory);
        if (authorityCompanyId) {
            const key = `authorityNotificationHistory_${authorityCompanyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
        }
    };

    const markAuthorityAsUnread = async (notifId) => {
        const updatedHistory = authorityHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: false, timestamp: new Date().toISOString() } : n
        );
        // Re-sort to bring unread to top
        const sortedHistory = updatedHistory.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        setAuthorityHistory(sortedHistory);
        if (authorityCompanyId) {
            const key = `authorityNotificationHistory_${authorityCompanyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(sortedHistory));
        }
    };

    const markAllAuthorityAsRead = async () => {
        const updatedHistory = authorityHistory.map(n => ({ ...n, read: true }));
        setAuthorityHistory(updatedHistory);
        if (authorityCompanyId) {
            const key = `authorityNotificationHistory_${authorityCompanyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
        }
    };

    return (
        <NotificationContext.Provider value={{ setNavigation, history, notification, markAsRead, markAsUnread, markAllAsRead }}>
            <AdminNotificationContext.Provider value={{ 
                setNavigation, 
                adminHistory,
                unreadReportsCount, 
                unreadAppealsCount,
                getTotalUnreadCount,
                markAdminAsRead,
                markAdminAsUnread,
                markAllAdminAsRead,
                testAdminNotification,
                isAdmin
            }}>
                <AuthorityNotificationContext.Provider value={{
                    setNavigation,
                    authorityHistory,
                    getAuthorityUnreadCount,
                    markAuthorityAsRead,
                    markAuthorityAsUnread,
                    markAllAuthorityAsRead,
                    testAuthorityNotification,
                    isAuthority
                }}>
                    {children}
                {/* Citizen notification toast - ONLY for citizens */}
                {userRole === 'citizen' && notification && (
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
                {/* Admin notification toast - ONLY for admins */}
                {isAdmin && userRole === 'admin' && adminNotification && (
                    <Animated.View style={[styles.toastContainer, { opacity: adminFadeAnim }]}>
                        <TouchableOpacity style={styles.content} onPress={handleAdminPress}>
                            <View style={[styles.iconBox, { backgroundColor: adminNotification.color }]}>
                                {adminNotification.icon && <adminNotification.icon size={20} color="white" />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{adminNotification.title}</Text>
                                <Text style={styles.message} numberOfLines={2}>{adminNotification.message}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={dismissAdminNotification} style={styles.closeBtn}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </Animated.View>
                )}
                
                {/* Authority notification toast - ONLY for authorities */}
                {userRole === 'authority' && authorityNotification && (
                    <Animated.View style={[styles.toastContainer, { opacity: authorityFadeAnim }]}>
                        <TouchableOpacity style={styles.content} onPress={handleAuthorityPress}>
                            <View style={styles.iconBox}>
                                <Bell size={20} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{authorityNotification.title}</Text>
                                <Text style={styles.message} numberOfLines={2}>{authorityNotification.message}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={dismissAuthorityNotification} style={styles.closeBtn}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </Animated.View>
                )}
                </AuthorityNotificationContext.Provider>
            </AdminNotificationContext.Provider>
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
