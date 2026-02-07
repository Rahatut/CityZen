import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { ArrowLeft, Calendar, CheckCircle, Clock, TrendingUp, AlertCircle, FileText } from 'lucide-react-native';
import api from '../services/api';

export default function UserComplaintListScreen({ navigation, route, darkMode, toggleDarkMode, onLogout }) {
    const { statusFilter, title } = route.params || {};
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) return;
            const userData = JSON.parse(userDataStr);

            let uid = userData.firebaseUid;
            if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
            if (!uid) uid = userData.id || userData.uid;

            const response = await api.get(`/api/complaints/citizen/${uid}`);
            let allComplaints = response.data.complaints || [];

            if (statusFilter) {
                if (statusFilter === 'resolved') {
                    allComplaints = allComplaints.filter(c => ['resolved', 'closed', 'completed'].includes(c.currentStatus));
                } else if (statusFilter === 'pending') {
                    allComplaints = allComplaints.filter(c => c.currentStatus === 'pending');
                } else if (statusFilter === 'in_progress') {
                    allComplaints = allComplaints.filter(c => ['in_progress', 'accepted', 'assigned'].includes(c.currentStatus));
                } else if (statusFilter === 'appealed') {
                    allComplaints = allComplaints.filter(c => c.currentStatus === 'appealed');
                } else if (statusFilter === 'rejected') {
                    allComplaints = allComplaints.filter(c => c.currentStatus === 'rejected');
                }
            }

            setComplaints(allComplaints);
        } catch (error) {
            console.error("Failed to load complaints", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchComplaints();
    };

    const StatusBadge = ({ status }) => {
        const isResolved = ['resolved', 'closed', 'completed'].includes(status);
        const isPending = status === 'pending';
        const isInProgress = ['in_progress', 'accepted'].includes(status);
        const isAppealed = status === 'appealed';
        const isRejected = status === 'rejected';

        let bg = '#F3F4F6';
        let color = '#374151';
        let text = status.replace('_', ' ').toUpperCase();

        if (isResolved) { bg = '#D1FAE5'; color = '#065F46'; }
        else if (isPending) { bg = '#FEF3C7'; color = '#92400E'; }
        else if (isInProgress) { bg = '#DBEAFE'; color = '#1E40AF'; }
        else if (isAppealed) { bg = '#FAF5FF'; color = '#7E22CE'; }
        else if (isRejected) { bg = '#FEE2E2'; color = '#991B1B'; }

        return (
            <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={[styles.badgeText, { color }]}>{text}</Text>
            </View>
        );
    };

    const StatusIcon = ({ status }) => {
        if (['resolved', 'closed', 'completed'].includes(status))
            return <CheckCircle size={20} color="#16A34A" />;
        if (status === 'pending')
            return <Clock size={20} color="#EA580C" />;
        if (['in_progress', 'accepted'].includes(status))
            return <TrendingUp size={20} color="#1E88E5" />;
        return <AlertCircle size={20} color="#6B7280" />;
    };

    return (
        <View style={[styles.container, darkMode && styles.darkContainer]}>
            <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1E88E5" />
                    <Text style={[styles.loadingText, darkMode && styles.textGray]}>Loading complaints...</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Page Header */}
                    <View style={styles.pageHeader}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ArrowLeft size={20} color={darkMode ? '#D1D5DB' : '#374151'} />
                            <Text style={[styles.backText, darkMode && styles.textWhite]}>Back</Text>
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>{title || 'My Complaints'}</Text>
                        <Text style={styles.headerSubtitle}>{complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</Text>
                    </View>

                    <FlatList
                        data={complaints}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <FileText size={64} color="#9CA3AF" />
                                <Text style={[styles.emptyTitle, darkMode && styles.textWhite]}>No complaints found</Text>
                                <Text style={styles.emptyText}>
                                    {statusFilter
                                        ? `You don't have any ${statusFilter.replace('_', ' ')} complaints yet.`
                                        : "You haven't submitted any complaints yet."}
                                </Text>
                                <TouchableOpacity
                                    style={styles.emptyButton}
                                    onPress={() => navigation.navigate('Camera')}
                                >
                                    <Text style={styles.emptyButtonText}>Submit a Complaint</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.card, darkMode && styles.cardDark]}
                                onPress={() => navigation.navigate('ComplaintDetails', { complaintId: item.id })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, darkMode && styles.iconContainerDark]}>
                                        <StatusIcon status={item.currentStatus} />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.cardTitle, darkMode && styles.textWhite]} numberOfLines={2}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.cardDesc, darkMode && styles.textGray]} numberOfLines={2}>
                                            {item.description || 'No description provided'}
                                        </Text>
                                    </View>
                                    <StatusBadge status={item.currentStatus} />
                                </View>

                                <View style={[styles.cardFooter, darkMode && styles.cardFooterDark]}>
                                    <View style={styles.footerItem}>
                                        <Calendar size={14} color="#9CA3AF" />
                                        <Text style={styles.footerText}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    {item.upvotes > 0 && (
                                        <View style={styles.footerItem}>
                                            <TrendingUp size={14} color="#EF4444" />
                                            <Text style={styles.footerText}>{item.upvotes} upvote{item.upvotes !== 1 ? 's' : ''}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
            <BottomNav navigation={navigation} darkMode={darkMode} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    darkContainer: { backgroundColor: '#111827' },

    // Page Header
    pageHeader: {
        padding: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
    backText: { fontSize: 14, color: '#374151', fontWeight: '500' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#6B7280' },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' },

    // List
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },

    // Loading
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },

    // Empty State
    emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    emptyButton: {
        backgroundColor: '#1E88E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    emptyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Card
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
    cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'flex-start' },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    iconContainerDark: { backgroundColor: '#374151' },
    cardContent: { flex: 1, marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    cardDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    cardFooter: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 16
    },
    cardFooterDark: { borderTopColor: '#374151' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 12, color: '#9CA3AF' }
});
