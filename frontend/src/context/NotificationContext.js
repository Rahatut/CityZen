
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const [lastStrikeCount, setLastStrikeCount] = useState(null);
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
    const lastStrikeCountRef = useRef(null);
    const lastCountsRef = useRef({ reports: 0, appeals: 0 });
    const citizenPollInFlightRef = useRef(false);
    const adminPollInFlightRef = useRef(false);
    const authorityPollInFlightRef = useRef(false);
    const userRoleRef = useRef(null);
    const currentUidRef = useRef(null);
    const authorityCompanyIdRef = useRef(null);
    const historyRef = useRef([]);
    const adminHistoryRef = useRef([]);
    const authorityHistoryRef = useRef([]);
    const [citizenBootstrapReady, setCitizenBootstrapReady] = useState(false);
    const citizenBootstrapReadyRef = useRef(false);

    const setNavigation = useCallback((nav) => {
        navigation.current = nav;
    }, []);

    useEffect(() => {
        userRoleRef.current = userRole;
    }, [userRole]);

    useEffect(() => {
        currentUidRef.current = currentUid;
    }, [currentUid]);

    useEffect(() => {
        authorityCompanyIdRef.current = authorityCompanyId;
    }, [authorityCompanyId]);

    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    useEffect(() => {
        adminHistoryRef.current = adminHistory;
    }, [adminHistory]);

    useEffect(() => {
        authorityHistoryRef.current = authorityHistory;
    }, [authorityHistory]);

    useEffect(() => {
        lastStrikeCountRef.current = lastStrikeCount;
    }, [lastStrikeCount]);

    useEffect(() => {
        citizenBootstrapReadyRef.current = citizenBootstrapReady;
    }, [citizenBootstrapReady]);

    const getAuthorityCompanyId = (userData, fallback = null) => {
        if (!userData || typeof userData !== 'object') return fallback;
        const direct =
            userData.authorityCompanyId ??
            userData.companyId ??
            userData?.Authority?.authorityCompanyId ??
            userData?.authority?.authorityCompanyId;

        if (direct === null || direct === undefined || direct === '') {
            return fallback;
        }
        return String(direct);
    };

    // Get user-specific storage key
    const getStorageKey = (baseKey, uid) => {
        return uid ? `${baseKey}_${uid}` : baseKey;
    };

    const loadHistory = async (uid) => {
        try {
            const key = getStorageKey('notificationHistory', uid);
            const historyStr = await AsyncStorage.getItem(key);
            return historyStr ? JSON.parse(historyStr) : [];
        } catch (e) {
            console.error("Failed to load notification history", e);
            return [];
        }
    };

    const loadAdminHistory = async (isUserAdmin) => {
        // CRITICAL: Only load admin history if user is actually an admin
        if (!isUserAdmin) {
            return [];
        }
        try {
            const historyStr = await AsyncStorage.getItem('adminNotificationHistory');
            return historyStr ? JSON.parse(historyStr) : [];
        } catch (e) {
            console.error('Failed to load admin notification history', e);
            return [];
        }
    };

    const loadLastStatuses = async (uid) => {
        try {
            const key = getStorageKey('lastComplaintStatuses', uid);
            const statusesStr = await AsyncStorage.getItem(key);
            if (statusesStr) {
                const loaded = JSON.parse(statusesStr);
                console.log("NotificationContext: Loaded lastStatuses from storage:", loaded);
                return loaded;
            }
            return {};
        } catch (e) {
            console.error("Failed to load last statuses", e);
            return {};
        }
    };

    const loadLastStrikeCount = async (uid) => {
        try {
            const key = getStorageKey('lastStrikeCount', uid);
            const stored = await AsyncStorage.getItem(key);
            if (stored === null || stored === undefined) {
                return null;
            }
            const parsed = parseInt(stored, 10);
            return Number.isFinite(parsed) ? parsed : null;
        } catch (e) {
            console.error("Failed to load last strike count", e);
            return null;
        }
    };

    // Load admin last counts from storage
    const loadLastCounts = async () => {
        try {
            const countsStr = await AsyncStorage.getItem('adminLastCounts');
            if (countsStr) {
                const loaded = JSON.parse(countsStr);
                return loaded;
            }
            return { reports: 0, appeals: 0 };
        } catch (e) {
            console.error('Failed to load admin last counts', e);
            return { reports: 0, appeals: 0 };
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

    const saveLastStrikeCount = async (count, uid) => {
        try {
            const key = getStorageKey('lastStrikeCount', uid);
            await AsyncStorage.setItem(key, String(count));
        } catch (e) {
            console.error("Failed to save last strike count", e);
        }
    };

    const addToHistory = async (newNotification, uid) => {
        const updatedHistory = [newNotification, ...(historyRef.current || [])].slice(0, 50); // Keep last 50
        historyRef.current = updatedHistory;
        setHistory(updatedHistory);
        const key = getStorageKey('notificationHistory', uid);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const addToAdminHistory = async (newNotification) => {
        const updatedHistory = [newNotification, ...(adminHistoryRef.current || [])].slice(0, 50); // Keep last 50
        adminHistoryRef.current = updatedHistory;
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    // Authority history functions
    const loadAuthorityHistory = async (companyId) => {
        try {
            const key = `authorityNotificationHistory_${companyId}`;
            const historyStr = await AsyncStorage.getItem(key);
            return historyStr ? JSON.parse(historyStr) : [];
        } catch (e) {
            console.error('Failed to load authority notification history', e);
            return [];
        }
    };

    const addToAuthorityHistory = async (newNotification, companyId) => {
        const updatedHistory = [newNotification, ...(authorityHistoryRef.current || [])].slice(0, 50);
        authorityHistoryRef.current = updatedHistory;
        setAuthorityHistory(updatedHistory);
        const key = `authorityNotificationHistory_${companyId}`;
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const loadLastAssignmentCount = async (companyId) => {
        try {
            const key = companyId ? `authorityLastAssignmentCount_${companyId}` : 'authorityLastAssignmentCount';
            const countStr = await AsyncStorage.getItem(key);
            if (countStr) {
                const count = parseInt(countStr, 10);
                return Number.isFinite(count) ? count : 0;
            }
            console.log('NotificationContext: No previous assignment count found for company:', companyId);
            return 0;
        } catch (e) {
            console.error('Failed to load last assignment count', e);
            return 0;
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

    // Logout function to clear all state and storage
    const logout = async () => {
        try {
            console.log('NotificationProvider: Logging out...');

            // 1. Clear Context State
            setNotification(null);
            setAdminNotification(null);
            setAuthorityNotification(null);

            setHistory([]);
            setAdminHistory([]);
            setAuthorityHistory([]);
            historyRef.current = [];
            adminHistoryRef.current = [];
            authorityHistoryRef.current = [];
            setCitizenBootstrapReady(false);
            citizenBootstrapReadyRef.current = false;

            setLastStatuses({});
            lastStatusesRef.current = {};
            setLastStrikeCount(null);
            lastStrikeCountRef.current = null;

            setLastCounts({ reports: 0, appeals: 0 });
            lastCountsRef.current = { reports: 0, appeals: 0 };

            setLastAssignmentCount(0);
            lastAssignmentCountRef.current = 0;

            setCurrentUid(null);
            setUserRole(null); // Setting to null stops all polling effects
            currentUidRef.current = null;
            userRoleRef.current = null;
            setIsAdmin(false);
            setIsAuthority(false);
            setAuthorityCompanyId(null);
            authorityCompanyIdRef.current = null;
            citizenPollInFlightRef.current = false;
            adminPollInFlightRef.current = false;
            authorityPollInFlightRef.current = false;

            // 2. Clear relevant AsyncStorage keys
            const keysToRemove = [
                'userData',
                'userToken',
                'authorityCompanyId',
                // We might want to keep history for next login if we want persistence, 
                // but for security/privacy on shared devices, clearing or relying on user-specific keys is better.
                // Our load functions use UID-specific keys, so we don't strictly need to delete *those* keys,
                // just the keys that identify the CURRENT user.
                'adminLastCounts', // Admin counts can be reset
                'authorityLastAssignmentCount'
            ];

            await AsyncStorage.multiRemove(keysToRemove);
            console.log('NotificationProvider: Logout complete, state and core storage cleared.');

        } catch (e) {
            console.error('NotificationProvider: Logout failed', e);
        }
    };

    // Use a function that can be called to refresh user state from storage
    const refreshUser = useCallback(async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            const authCompanyIdFromStorage = await AsyncStorage.getItem('authorityCompanyId');
            const previousRole = userRoleRef.current;
            const previousUid = currentUidRef.current;

            console.log('NotificationProvider: Refreshing user state. metadata:', {
                hasUserData: !!userDataStr,
                hasAuthCompanyId: !!authCompanyIdFromStorage,
                prevRole: previousRole,
                prevUid: previousUid
            });

            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                // Matches HomeScreen logic.
                let uid = userData.firebaseUid;
                if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
                if (!uid) uid = userData.id || userData.uid;

                const role = userData.role || 'citizen';
                const compId = role === 'authority'
                    ? getAuthorityCompanyId(userData, authCompanyIdFromStorage)
                    : null;

                console.log('NotificationProvider: New state targets:', { role, uid, compId });

                // Always set these to ensure context is in sync with latest storage
                setCurrentUid(uid);
                setUserRole(role);
                currentUidRef.current = uid;
                userRoleRef.current = role;
                setIsAdmin(role === 'admin');
                setIsAuthority(role === 'authority');

                if (role !== 'citizen' || uid !== previousUid) {
                    setCitizenBootstrapReady(false);
                    citizenBootstrapReadyRef.current = false;
                }

                const previousCompanyId = authorityCompanyIdRef.current;
                if (role === 'authority' && compId) {
                    if (previousCompanyId !== compId) {
                        console.log('NotificationProvider: Setting authority company ID:', compId);
                        setAuthorityCompanyId(compId);
                        authorityCompanyIdRef.current = compId;
                    }
                    await AsyncStorage.setItem('authorityCompanyId', String(compId));
                } else {
                    if (previousCompanyId !== null) {
                        setAuthorityCompanyId(null);
                        authorityCompanyIdRef.current = null;
                    }
                }

                if (previousRole && previousRole !== role) {
                    // Prevent stale toasts from previous role sessions.
                    setNotification(null);
                    setAdminNotification(null);
                    setAuthorityNotification(null);
                }

                // Reset histories if user ID changed
                if (uid && uid !== previousUid) {
                    console.log('NotificationProvider: UID changed, clearing citizen/authority histories only (preserving admin)');
                    setHistory([]);
                    historyRef.current = [];
                    // DO NOT CLEAR adminHistory - it should persist across logout/login
                    setAuthorityHistory([]);
                    authorityHistoryRef.current = [];
                    setLastStatuses({});
                    lastStatusesRef.current = {};
                    setLastStrikeCount(null);
                    lastStrikeCountRef.current = null;
                    // DO NOT CLEAR lastCounts - admin counts should persist
                    setLastAssignmentCount(0);
                    lastAssignmentCountRef.current = 0;
                }
            } else {
                // No user logged in in storage
                console.log('NotificationProvider: No user data in storage, resetting to guest/citizen (preserving admin history)');
                setCurrentUid(null);
                setUserRole(null);
                setIsAdmin(false);
                setIsAuthority(false);
                setAuthorityCompanyId(null);
                currentUidRef.current = null;
                userRoleRef.current = null;
                authorityCompanyIdRef.current = null;
                setCitizenBootstrapReady(false);
                citizenBootstrapReadyRef.current = false;
                // Clear citizen and authority states only
                setHistory([]);
                historyRef.current = [];
                // DO NOT CLEAR adminHistory - it should persist even when logged out
                setAuthorityHistory([]);
                authorityHistoryRef.current = [];
                setLastStatuses({});
                lastStatusesRef.current = {};
                setLastStrikeCount(null);
                lastStrikeCountRef.current = null;
                // Keep admin counts for when admin logs back in
                setLastAssignmentCount(0);
                lastAssignmentCountRef.current = 0;
                setNotification(null);
                setAuthorityNotification(null);
                setAdminNotification(null);
            }
        } catch (error) {
            console.error('NotificationProvider: Error refreshing user:', error);
        }
    }, []);

    // Initial load and refresh on mount
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Load citizen-specific data when currentUid changes
    useEffect(() => {
        let cancelled = false;
        const bootstrapCitizenState = async () => {
            if (currentUid && userRole === 'citizen') {
                setCitizenBootstrapReady(false);
                citizenBootstrapReadyRef.current = false;
                const [loadedHistory, loadedStatuses, loadedStrikeCount] = await Promise.all([
                    loadHistory(currentUid),
                    loadLastStatuses(currentUid),
                    loadLastStrikeCount(currentUid),
                ]);

                let baselineStrikeCount = loadedStrikeCount;
                if (baselineStrikeCount === null) {
                    try {
                        const moderationRes = await api.get(`/moderation/my-strikes/${currentUid}`);
                        const parsed = parseInt(moderationRes?.data?.strikes, 10);
                        baselineStrikeCount = Number.isFinite(parsed) ? parsed : null;
                        if (baselineStrikeCount !== null) {
                            await saveLastStrikeCount(baselineStrikeCount, currentUid);
                        }
                    } catch (e) {
                        baselineStrikeCount = null;
                    }
                }

                if (!cancelled && currentUidRef.current === currentUid && userRoleRef.current === 'citizen') {
                    setHistory(loadedHistory);
                    historyRef.current = loadedHistory;
                    setLastStatuses(loadedStatuses);
                    lastStatusesRef.current = loadedStatuses;
                    setLastStrikeCount(baselineStrikeCount);
                    lastStrikeCountRef.current = baselineStrikeCount;
                    setCitizenBootstrapReady(true);
                    citizenBootstrapReadyRef.current = true;
                }
            } else {
                setCitizenBootstrapReady(false);
                citizenBootstrapReadyRef.current = false;
                setHistory([]);
                historyRef.current = [];
                setLastStatuses({});
                lastStatusesRef.current = {};
                setLastStrikeCount(null);
                lastStrikeCountRef.current = null;
            }

            if (userRole !== 'citizen') {
                setNotification(null);
            }
        };

        bootstrapCitizenState();
        return () => {
            cancelled = true;
        };
    }, [currentUid, userRole]);

    // Load admin-specific data when isAdmin or userRole changes
    useEffect(() => {
        let cancelled = false;
        const bootstrapAdminState = async () => {
            if (isAdmin && userRole === 'admin') {
                const [loadedCounts, loadedHistory] = await Promise.all([
                    loadLastCounts(),
                    loadAdminHistory(true),
                ]);

                if (!cancelled && userRoleRef.current === 'admin') {
                    setLastCounts(loadedCounts);
                    lastCountsRef.current = loadedCounts;
                    setAdminHistory(loadedHistory);
                    adminHistoryRef.current = loadedHistory;
                }
            } else {
                setAdminHistory([]);
                adminHistoryRef.current = [];
                setLastCounts({ reports: 0, appeals: 0 });
                lastCountsRef.current = { reports: 0, appeals: 0 };
                setAdminNotification(null);
            }
        };

        bootstrapAdminState();
        return () => {
            cancelled = true;
        };
    }, [isAdmin, userRole]);

    // Load authority-specific data when isAuthority, userRole, or authorityCompanyId changes
    useEffect(() => {
        let cancelled = false;
        const bootstrapAuthorityState = async () => {
            if (isAuthority && userRole === 'authority' && authorityCompanyId) {
                const [loadedHistory, loadedAssignmentCount] = await Promise.all([
                    loadAuthorityHistory(authorityCompanyId),
                    loadLastAssignmentCount(authorityCompanyId),
                ]);

                if (!cancelled && userRoleRef.current === 'authority' && authorityCompanyIdRef.current === authorityCompanyId) {
                    setAuthorityHistory(loadedHistory);
                    authorityHistoryRef.current = loadedHistory;
                    setLastAssignmentCount(loadedAssignmentCount);
                    lastAssignmentCountRef.current = loadedAssignmentCount;
                }
            } else {
                setAuthorityHistory([]);
                authorityHistoryRef.current = [];
                setLastAssignmentCount(0);
                lastAssignmentCountRef.current = 0;
                setAuthorityNotification(null);
            }
        };

        bootstrapAuthorityState();
        return () => {
            cancelled = true;
        };
    }, [isAuthority, userRole, authorityCompanyId]);


    const fetchComplaints = async () => {
        // Don't poll on unauthenticated screens
        const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
        const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];

        if (unauthenticatedScreens.includes(currentRoute)) {
            //console.log("NotificationContext: Skipping polling on", currentRoute, "screen");
            return;
        }

        // CRITICAL: Only poll complaints for citizens
        const role = userRoleRef.current;
        const uid = currentUidRef.current;
        if (role !== 'citizen' || !uid) {
            //console.log("NotificationContext: Skipping complaint polling - user is", userRole, "or no UID");
            return;
        }
        if (!citizenBootstrapReadyRef.current) {
            return;
        }

        if (citizenPollInFlightRef.current) {
            return;
        }
        citizenPollInFlightRef.current = true;

        // console.log("NotificationContext: Polling for user:", currentUid);

        try {
            const [response, moderationResponse] = await Promise.all([
                api.get(`/complaints/citizen/${uid}?page=1&limit=100`),
                api.get(`/moderation/my-strikes/${uid}`).catch((err) => {
                    console.error("NotificationContext: Failed to fetch strike info", err?.message || err);
                    return null;
                }),
            ]);
            const complaints = response.data.complaints || [];
            const parsedStrikes = parseInt(moderationResponse?.data?.strikes, 10);
            const currentStrikeCount = Number.isFinite(parsedStrikes) ? parsedStrikes : null;
            //console.log("NotificationContext: Fetched", complaints.length, "complaints");

            // Guard against role switching while request is in flight.
            if (userRoleRef.current !== 'citizen' || currentUidRef.current !== uid) {
                return;
            }

            // Check for status changes using ref to avoid stale closure
            const newStatuses = {};
            const changedComplaints = [];
            const previousStatuses = lastStatusesRef.current || {};

            complaints.forEach(c => {
                newStatuses[c.id] = c.currentStatus;

                // If we have a previous status and it's different
                if (previousStatuses[c.id] && previousStatuses[c.id] !== c.currentStatus) {
                    //console.log(`NotificationContext: Status changed for complaint ${c.id}: ${previousStatuses[c.id]} -> ${c.currentStatus}`);
                    changedComplaints.push(c);
                }
            });

            // Detect appealed complaints that disappeared (deleted by admin moderation).
            const currentComplaintIds = new Set(complaints.map(c => String(c.id)));
            const deletedAppealedComplaintIds = Object.entries(previousStatuses)
                .filter(([complaintId, status]) => status === 'appealed' && !currentComplaintIds.has(String(complaintId)))
                .map(([complaintId]) => complaintId);

            // Update stored statuses
            const updated = { ...newStatuses };
            console.log("NotificationContext: Updated lastStatuses:", updated);
            setLastStatuses(updated);
            lastStatusesRef.current = updated; // Update ref
            saveLastStatuses(updated, uid); // Persist to storage with user-specific key

            // Trigger notification if changed
            if (changedComplaints.length > 0) {
                const statusMap = {
                    'pending': 'Pending',
                    'accepted': 'Accepted',
                    'in_progress': 'In Progress',
                    'resolved': 'Resolved',
                    'rejected': 'Rejected'
                };
                for (const changedComplaint of changedComplaints) {
                    console.log("NotificationContext: Triggering notification for complaint", changedComplaint.id);
                    const readableStatus = statusMap[changedComplaint.currentStatus] || changedComplaint.currentStatus;

                    const notifData = {
                        id: changedComplaint.id, // Complaint ID
                        uniqId: `${changedComplaint.id}_${Date.now()}`, // Unique ID for list
                        title: 'Status Update',
                        message: `Complaint #${changedComplaint.id} is now ${readableStatus}`,
                        timestamp: new Date().toISOString(),
                        complaint: changedComplaint,
                        read: false,
                        type: 'status_update'
                    };

                    showNotification(notifData);
                    await addToHistory(notifData, uid);
                }
            } else {
                console.log("NotificationContext: No status changes detected");
            }

            if (currentStrikeCount !== null) {
                const previousStrikeCount = lastStrikeCountRef.current;

                // First valid read becomes baseline; no retroactive notification.
                if (previousStrikeCount === null) {
                    if (deletedAppealedComplaintIds.length > 0 && currentStrikeCount > 0) {
                        const previewIds = deletedAppealedComplaintIds.slice(0, 2).join(', #');
                        const extraCount = deletedAppealedComplaintIds.length - Math.min(deletedAppealedComplaintIds.length, 2);
                        const moreText = extraCount > 0 ? ` and ${extraCount} more` : '';
                        const warningSuffix = currentStrikeCount >= 4
                            ? ' Warning: one more strike may lead to permanent suspension.'
                            : ' Please follow community guidelines to avoid further action.';

                        const strikeNotif = {
                            uniqId: `strike_warning_${uid}_${Date.now()}`,
                            title: 'Strike Warning',
                            message: `Your appealed complaint${deletedAppealedComplaintIds.length > 1 ? 's' : ''} #${previewIds}${moreText} ${deletedAppealedComplaintIds.length > 1 ? 'were' : 'was'} removed by admin moderation. You now have ${currentStrikeCount}/5 strikes.${warningSuffix}`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'strike_warning',
                        };
                        showNotification(strikeNotif);
                        await addToHistory(strikeNotif, uid);
                    }

                    setLastStrikeCount(currentStrikeCount);
                    lastStrikeCountRef.current = currentStrikeCount;
                    await saveLastStrikeCount(currentStrikeCount, uid);
                } else if (currentStrikeCount > previousStrikeCount) {
                    const delta = currentStrikeCount - previousStrikeCount;
                    const warningSuffix = currentStrikeCount >= 4
                        ? ' Warning: one more strike may lead to permanent suspension.'
                        : ' Please follow community guidelines to avoid further action.';

                    let message = `You received ${delta} moderation strike${delta > 1 ? 's' : ''}. Total strikes: ${currentStrikeCount}/5.${warningSuffix}`;
                    if (deletedAppealedComplaintIds.length > 0) {
                        const previewIds = deletedAppealedComplaintIds.slice(0, 2).join(', #');
                        const extraCount = deletedAppealedComplaintIds.length - Math.min(deletedAppealedComplaintIds.length, 2);
                        const moreText = extraCount > 0 ? ` and ${extraCount} more` : '';
                        message = `Your appealed complaint${deletedAppealedComplaintIds.length > 1 ? 's' : ''} #${previewIds}${moreText} ${deletedAppealedComplaintIds.length > 1 ? 'were' : 'was'} removed by admin moderation. You now have ${currentStrikeCount}/5 strikes.${warningSuffix}`;
                    }

                    const strikeNotif = {
                        uniqId: `strike_warning_${uid}_${Date.now()}`,
                        title: 'Strike Warning',
                        message,
                        timestamp: new Date().toISOString(),
                        read: false,
                        type: 'strike_warning',
                    };
                    showNotification(strikeNotif);
                    await addToHistory(strikeNotif, uid);

                    setLastStrikeCount(currentStrikeCount);
                    lastStrikeCountRef.current = currentStrikeCount;
                    await saveLastStrikeCount(currentStrikeCount, uid);
                } else if (currentStrikeCount !== previousStrikeCount) {
                    setLastStrikeCount(currentStrikeCount);
                    lastStrikeCountRef.current = currentStrikeCount;
                    await saveLastStrikeCount(currentStrikeCount, uid);
                }
            }

        } catch (error) {
            // Only log errors for citizens (authorities/admins shouldn't poll complaints)
            if (userRoleRef.current === 'citizen') {
                console.error("Failed to fetch complaints", error);
            }
        } finally {
            citizenPollInFlightRef.current = false;
        }
    };

    useEffect(() => {
        if (userRole !== 'citizen' || !currentUid || !citizenBootstrapReady) {
            //console.log("NotificationContext: Skipping citizen polling - user is", userRole, "or no UID");
            return;
        }

        //console.log("NotificationContext: Starting polling for user:", currentUid);
        // Initial fetch
        fetchComplaints();

        // Poll every 10 seconds (reduced from 30 for faster notifications)
        const interval = setInterval(fetchComplaints, 10000);
        return () => {
            //console.log("NotificationContext: Stopping polling");
            clearInterval(interval);
        };
    }, [currentUid, userRole, citizenBootstrapReady]); // Re-run when user changes

    // Poll for admin data (reports and appeals)
    const pollAdminData = async () => {
        // CRITICAL: Double-check user role before polling
        if (userRoleRef.current !== 'admin') {
            //console.log('AdminPolling: Skipping - user role is', userRole, 'not admin');
            return;
        }

        // Check current route - don't poll on unauthenticated screens
        const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
        const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];

        if (unauthenticatedScreens.includes(currentRoute)) {
            //console.log('AdminPolling: Skipping - on unauthenticated screen:', currentRoute);
            return;
        }

        if (adminPollInFlightRef.current) {
            return;
        }
        adminPollInFlightRef.current = true;

        console.log('AdminPolling: Fetching reports and appeals...');

        try {
            // Fetch reports
            const reportsResponse = await api.get('/complaints/reports?status=pending');
            const pendingReports = reportsResponse.data?.reports || [];
            const currentReportIds = pendingReports.map(r => r.id);

            // Fetch appeals
            const appealsResponse = await api.get('/complaints/appeals?status=pending');
            const pendingAppeals = appealsResponse.data?.appeals || [];
            const currentAppealIds = pendingAppeals.map(a => a.id);

            // Update unread counts
            setUnreadReportsCount(pendingReports.length);
            setUnreadAppealsCount(pendingAppeals.length);

            // --- TRACK NEW REPORTS BY ID ---
            const lastReportIdsStr = await AsyncStorage.getItem('adminKnownReportIds');
            let lastReportIds = lastReportIdsStr ? JSON.parse(lastReportIdsStr) : [];

            const newReportEntries = pendingReports.filter(r => !lastReportIds.includes(r.id));
            if (newReportEntries.length > 0) {
                console.log('AdminPolling: Detected', newReportEntries.length, 'new reports');
                newReportEntries.forEach((report, index) => {
                    if (userRoleRef.current !== 'admin') return;
                    const notifData = {
                        uniqId: `admin_report_${report.id}_${Date.now()}`,
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
                    showAdminNotification(notifData);
                    addToAdminHistory(notifData);
                });
            }
            await AsyncStorage.setItem('adminKnownReportIds', JSON.stringify(currentReportIds));

            // --- TRACK NEW APPEALS BY ID ---
            const lastAppealIdsStr = await AsyncStorage.getItem('adminKnownAppealIds');
            let lastAppealIds = lastAppealIdsStr ? JSON.parse(lastAppealIdsStr) : [];

            const newAppealEntries = pendingAppeals.filter(a => !lastAppealIds.includes(a.id));
            if (newAppealEntries.length > 0) {
                console.log('AdminPolling: Detected', newAppealEntries.length, 'new appeals');
                newAppealEntries.forEach((appeal, index) => {
                    if (userRoleRef.current !== 'admin') return;
                    const notifData = {
                        uniqId: `admin_appeal_${appeal.id}_${Date.now()}`,
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
                    showAdminNotification(notifData);
                    addToAdminHistory(notifData);
                });
            }
            await AsyncStorage.setItem('adminKnownAppealIds', JSON.stringify(currentAppealIds));

            // Maintenance: Update stored counts for any UI that might still need them
            const newCounts = { reports: pendingReports.length, appeals: pendingAppeals.length };
            setLastCounts(newCounts);
            lastCountsRef.current = newCounts;
            await saveLastCounts(newCounts);
            console.log('AdminPolling: Updated status with current IDs and counts');

        } catch (error) {
            console.error('Admin polling error:', error.message, error);
        } finally {
            adminPollInFlightRef.current = false;
        }
    };

    // Poll for authority assignments
    const pollAuthorityAssignments = async () => {
        // Double-check user role before polling
        const role = userRoleRef.current;
        const companyId = authorityCompanyIdRef.current;
        if (role !== 'authority' || !companyId) {
            console.log('AuthorityPolling: Skipping - user role is', userRole, 'not authority or no company ID');
            return;
        }

        // Check current route - don't poll on unauthenticated screens
        const currentRoute = navigation.current?.getCurrentRoute?.()?.name;
        const unauthenticatedScreens = ['Landing', 'Login', 'Signup'];

        if (unauthenticatedScreens.includes(currentRoute)) {
            console.log('AuthorityPolling: Skipping - on unauthenticated screen:', currentRoute);
            return;
        }

        if (authorityPollInFlightRef.current) {
            return;
        }
        authorityPollInFlightRef.current = true;

        console.log('AuthorityPolling: Fetching assignments for company:', companyId);

        try {
            // Fetch complaints assigned to this authority
            const response = await api.get(`/complaints/authority/${companyId}?page=1&limit=200`);
            const complaints = response.data?.complaints || [];
            const currentIds = complaints.map(c => c.id);

            // Guard against role/company changes while request is in flight.
            if (userRoleRef.current !== 'authority' || authorityCompanyIdRef.current !== companyId) {
                return;
            }

            // --- CHECK FOR DELETED COMPLAINTS ---
            // We compare current assigned IDs with what we previously knew
            const assignedIdsKey = `authorityAssignedIds_${companyId}`;
            const lastKnownIdsStr = await AsyncStorage.getItem(assignedIdsKey);
            let lastKnownIds = lastKnownIdsStr ? JSON.parse(lastKnownIdsStr) : [];

            if (lastKnownIds.length > 0) {
                const deletedIds = lastKnownIds.filter(id => !currentIds.includes(id));
                if (deletedIds.length > 0) {
                    console.log('AuthorityPolling: Detected deleted complaints:', deletedIds);
                    deletedIds.forEach(id => {
                        const notifData = {
                            uniqId: `deleted_${id}_${Date.now()}`,
                            title: 'Complaint Removed',
                            message: `Complaint #${id} was removed by Admin moderation.`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'deletion',
                            complaintId: id
                        };
                        showAuthorityNotification(notifData);
                        addToAuthorityHistory(notifData, companyId);
                    });
                }
            }

            // Detect newly assigned complaints by ID diff (count-only checks miss replace-in-place cases).
            const newEntries = complaints.filter(c => !lastKnownIds.includes(c.id));
            if (newEntries.length > 0) {
                newEntries.forEach(complaint => {
                    if (userRoleRef.current !== 'authority') return;
                    if (!(complaint.forwardedByAdmin === true && complaint.appealStatus === 'approved')) {
                        const notifData = {
                            uniqId: `authority_${complaint.id}_${Date.now()}`,
                            title: 'New Assignment',
                            message: `New complaint assigned: ${complaint.title}`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'assignment',
                            complaintId: complaint.id,
                            complaint: complaint
                        };
                        showAuthorityNotification(notifData);
                        addToAuthorityHistory(notifData, companyId);
                    }
                });
            }

            // Update last known IDs for next poll
            await AsyncStorage.setItem(assignedIdsKey, JSON.stringify(currentIds));

            // --- CHECK FOR NEW ASSIGNMENTS OR FORWARDED APPEALS ---
            for (const complaint of complaints) {
                const isForwarded = complaint.forwardedByAdmin === true && complaint.appealStatus === 'approved';

                // Track status per complaint to detect updates
                const statusKey = `authorityLastStatus_${companyId}_${complaint.id}`;
                const lastStatus = await AsyncStorage.getItem(statusKey);
                const currentStatusStr = `${complaint.currentStatus}_${complaint.forwardedByAdmin}_${complaint.appealStatus}`;

                if (lastStatus !== currentStatusStr) {
                    // Status changed OR first time seeing this complaint
                    if (isForwarded && (!lastStatus || !lastStatus.includes('approved'))) {
                        console.log('AuthorityPolling: Forwarded appeal detected (first sighting or update) for complaint:', complaint.id);
                        const notifData = {
                            uniqId: `forwarded_${complaint.id}_${Date.now()}`,
                            title: 'Appeal Forwarded',
                            message: `Admin forwarded appeal for re-investigation: ${complaint.title}`,
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'forwarded_appeal',
                            complaintId: complaint.id,
                            complaint: complaint
                        };
                        showAuthorityNotification(notifData);
                        addToAuthorityHistory(notifData, companyId);
                    }
                }
                await AsyncStorage.setItem(statusKey, currentStatusStr);
            }

            const currentCount = complaints.length;
            console.log('AuthorityPolling: Current assignment count:', currentCount);

            // Update stored count for simple threshold checks
            setLastAssignmentCount(currentCount);
            lastAssignmentCountRef.current = currentCount;
            await saveLastAssignmentCount(currentCount, companyId);
            console.log('AuthorityPolling: Updated assignment count to:', currentCount, 'for company:', companyId);

        } catch (error) {
            console.error('Authority polling error:', error.message, error);
        } finally {
            authorityPollInFlightRef.current = false;
        }
    };


    // Start admin polling ONLY when user is admin
    useEffect(() => {
        // Start polling only if user is admin
        const shouldPoll = userRole === 'admin';

        if (!shouldPoll) {
            console.log('AdminPollingEffect: Skipping - role is:', userRole);
            return;
        }

        console.log('AdminPollingEffect: ACTIVE (Role: admin)');
        pollAdminData(); // Initial fetch

        const interval = setInterval(pollAdminData, 15000);
        return () => {
            console.log('AdminPollingEffect: STOPPED');
            clearInterval(interval);
        };
    }, [userRole, currentUid]); // Depend on userRole and UID to start/stop polling dynamically

    // Start authority polling ONLY when user is authority
    useEffect(() => {
        const shouldPoll = userRole === 'authority' && authorityCompanyId;

        if (!shouldPoll) {
            console.log('AuthorityPollingEffect: Skipping - role is:', userRole, 'compId:', authorityCompanyId);
            return;
        }

        console.log('AuthorityPollingEffect: ACTIVE (Role: authority, CompId:', authorityCompanyId, ')');
        pollAuthorityAssignments(); // Initial fetch

        // Poll every 20 seconds
        const interval = setInterval(pollAuthorityAssignments, 20000);
        return () => {
            console.log('AuthorityPollingEffect: STOPPED');
            clearInterval(interval);
        };
    }, [userRole, authorityCompanyId, currentUid]); // Depend on role, company, and UID

    const showNotification = (notifData) => {
        // CRITICAL: Only show citizen notifications for citizens (not admins or authorities)
        if (userRoleRef.current !== 'citizen') {
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
            if (notification.type === 'strike_warning') {
                navigation.current.navigate('Profile');
            } else if (notification.id) {
                navigation.current.navigate('ComplaintDetails', { complaintId: notification.id });
            }
            dismissNotification();
        }
    };

    const markAsRead = async (notifId) => {
        const baseHistory = historyRef.current || [];
        const updatedHistory = baseHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: true } : n
        );
        historyRef.current = updatedHistory;
        setHistory(updatedHistory);
        const key = getStorageKey('notificationHistory', currentUidRef.current);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const markAsUnread = async (notifId) => {
        const baseHistory = historyRef.current || [];
        const updatedHistory = baseHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: false, timestamp: new Date().toISOString() } : n
        );
        // Sort to move unread notification to top
        const sorted = updatedHistory.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        historyRef.current = sorted;
        setHistory(sorted);
        const key = getStorageKey('notificationHistory', currentUidRef.current);
        await AsyncStorage.setItem(key, JSON.stringify(sorted));
    };

    const markAllAsRead = async () => {
        const baseHistory = historyRef.current || [];
        const updatedHistory = baseHistory.map(n => ({ ...n, read: true }));
        historyRef.current = updatedHistory;
        setHistory(updatedHistory);
        const key = getStorageKey('notificationHistory', currentUidRef.current);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const showAdminNotification = (notifData) => {
        console.log('showAdminNotification called with:', notifData.title);
        console.log('showAdminNotification checks - isAdmin:', isAdmin, 'userRole:', userRole);

        // CRITICAL: Only show notifications for admins (double check with both isAdmin and userRole)
        // Use userRole state primarily as it's more reliable after refreshes
        if (userRoleRef.current !== 'admin') {
            console.log("AdminNotificationContext: Skipping notification - user is not admin. Role:", userRole);
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
            // Priority: Navigate to specific complaint if ID exists
            if (adminNotification.complaintId) {
                console.log('AdminToast: Navigating to AdminComplaintDetail for ID:', adminNotification.complaintId);
                navigation.current.navigate('AdminComplaintDetail', {
                    complaintId: adminNotification.complaintId
                });
            }
            // Fallback: Navigate to admin dashboard flags tab
            else if (adminNotification.type === 'report' || adminNotification.type === 'appeal') {
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
        const baseHistory = adminHistoryRef.current || [];
        const updatedHistory = baseHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: true } : n
        );
        adminHistoryRef.current = updatedHistory;
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    const markAdminAsUnread = async (notifId) => {
        const baseHistory = adminHistoryRef.current || [];
        const updatedHistory = baseHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: false, timestamp: new Date().toISOString() } : n
        );
        // Sort to move unread notification to top
        const sorted = updatedHistory.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        adminHistoryRef.current = sorted;
        setAdminHistory(sorted);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(sorted));
    };

    const markAllAdminAsRead = async () => {
        const baseHistory = adminHistoryRef.current || [];
        const updatedHistory = baseHistory.map(n => ({ ...n, read: true }));
        adminHistoryRef.current = updatedHistory;
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    const clearAllNotifications = async () => {
        setHistory([]);
        setAdminHistory([]);
        setAuthorityHistory([]);
        historyRef.current = [];
        adminHistoryRef.current = [];
        authorityHistoryRef.current = [];
        await AsyncStorage.removeItem(getStorageKey('notificationHistory', currentUidRef.current));
        await AsyncStorage.removeItem('adminNotificationHistory');
        const companyId = authorityCompanyIdRef.current;
        if (companyId) {
            await AsyncStorage.removeItem(`authorityNotificationHistory_${companyId}`);
        }
        console.log('All notification histories cleared.');
    };

    // Delete individual notifications
    const deleteNotification = async (notifId) => {
        const baseHistory = historyRef.current || [];
        const updatedHistory = baseHistory.filter(n => n.uniqId !== notifId);
        historyRef.current = updatedHistory;
        setHistory(updatedHistory);
        const key = getStorageKey('notificationHistory', currentUidRef.current);
        await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    };

    const deleteAdminNotification = async (notifId) => {
        const baseHistory = adminHistoryRef.current || [];
        const updatedHistory = baseHistory.filter(n => n.uniqId !== notifId);
        adminHistoryRef.current = updatedHistory;
        setAdminHistory(updatedHistory);
        await AsyncStorage.setItem('adminNotificationHistory', JSON.stringify(updatedHistory));
    };

    const deleteAuthorityNotification = async (notifId) => {
        const baseHistory = authorityHistoryRef.current || [];
        const updatedHistory = baseHistory.filter(n => n.uniqId !== notifId);
        authorityHistoryRef.current = updatedHistory;
        setAuthorityHistory(updatedHistory);
        const companyId = authorityCompanyIdRef.current;
        if (companyId) {
            const key = `authorityNotificationHistory_${companyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
        }
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
        if (userRoleRef.current !== 'authority') {
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
            navigation.current.navigate('AuthorityComplaintDetail', {
                id: authorityNotification.complaintId
            });
            dismissAuthorityNotification();
        }
    };

    const getAuthorityUnreadCount = () => {
        return authorityHistory.filter(n => !n.read).length;
    };

    const markAuthorityAsRead = async (notifId) => {
        const baseHistory = authorityHistoryRef.current || [];
        const updatedHistory = baseHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: true } : n
        );
        authorityHistoryRef.current = updatedHistory;
        setAuthorityHistory(updatedHistory);
        const companyId = authorityCompanyIdRef.current;
        if (companyId) {
            const key = `authorityNotificationHistory_${companyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
        }
    };

    const markAuthorityAsUnread = async (notifId) => {
        const baseHistory = authorityHistoryRef.current || [];
        const updatedHistory = baseHistory.map(n =>
            n.uniqId === notifId ? { ...n, read: false, timestamp: new Date().toISOString() } : n
        );
        // Re-sort to bring unread to top
        const sortedHistory = updatedHistory.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        authorityHistoryRef.current = sortedHistory;
        setAuthorityHistory(sortedHistory);
        const companyId = authorityCompanyIdRef.current;
        if (companyId) {
            const key = `authorityNotificationHistory_${companyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(sortedHistory));
        }
    };

    const markAllAuthorityAsRead = async () => {
        const baseHistory = authorityHistoryRef.current || [];
        const updatedHistory = baseHistory.map(n => ({ ...n, read: true }));
        authorityHistoryRef.current = updatedHistory;
        setAuthorityHistory(updatedHistory);
        const companyId = authorityCompanyIdRef.current;
        if (companyId) {
            const key = `authorityNotificationHistory_${companyId}`;
            await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
        }
    };

    return (
        <NotificationContext.Provider value={{ setNavigation, history, notification, markAsRead, markAsUnread, markAllAsRead, deleteNotification, logout, userRole, refreshUser }}>
            <AdminNotificationContext.Provider value={{
                setNavigation,
                adminHistory,
                unreadReportsCount,
                unreadAppealsCount,
                getTotalUnreadCount,
                markAdminAsRead,
                markAdminAsUnread,
                markAllAdminAsRead,
                deleteAdminNotification,
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
                    deleteAuthorityNotification,
                    testAuthorityNotification,
                    isAuthority
                }}>
                    {children}
                    {/* Citizen notification toast - ONLY for citizens */}
                    {userRole === 'citizen' && notification && (
                        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
                            <TouchableOpacity style={styles.content} onPress={handlePress}>
                                <View style={[
                                    styles.iconBox,
                                    notification.type === 'strike_warning' && { backgroundColor: '#EF4444' }
                                ]}>
                                    {notification.type === 'strike_warning'
                                        ? <AlertTriangle size={20} color="white" />
                                        : <Bell size={20} color="white" />
                                    }
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
                        <Animated.View style={[
                            styles.toastContainer,
                            { opacity: authorityFadeAnim },
                            authorityNotification.type === 'deletion' && { borderLeftColor: '#EF4444' }
                        ]}>
                            <TouchableOpacity style={styles.content} onPress={handleAuthorityPress}>
                                <View style={[
                                    styles.iconBox,
                                    authorityNotification.type === 'deletion' && { backgroundColor: '#EF4444' }
                                ]}>
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
        overflow: 'hidden'
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingRight: 8
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
        paddingLeft: 8,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
