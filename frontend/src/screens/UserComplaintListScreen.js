import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, MapPin, Calendar, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react-native';
import api from '../services/api';

export default function UserComplaintListScreen({ navigation, route }) {
    const { statusFilter, title } = route.params || {};
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (!userDataStr) return;
            const userData = JSON.parse(userDataStr);

            // CRITICAL FIX: Match HomeScreen logic. Prioritize firebaseUid.
            let uid = userData.firebaseUid;
            if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
            if (!uid) uid = userData.id || userData.uid;

            const response = await api.get(`/complaints/citizen/${uid}`);
            let allComplaints = response.data.complaints || [];

            if (statusFilter) {
                if (statusFilter === 'resolved') {
                    allComplaints = allComplaints.filter(c => ['resolved', 'closed', 'completed'].includes(c.currentStatus));
                } else if (statusFilter === 'pending') {
                    allComplaints = allComplaints.filter(c => c.currentStatus === 'pending');
                } else if (statusFilter === 'in_progress') {
                    allComplaints = allComplaints.filter(c => ['in_progress', 'accepted', 'assigned'].includes(c.currentStatus));
                }
            }

            setComplaints(allComplaints);
        } catch (error) {
            console.error("Failed to load complaints", error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const isResolved = ['resolved', 'closed', 'completed'].includes(status);
        const isPending = status === 'pending';
        const isInProgress = ['in_progress', 'accepted'].includes(status);

        let bg = '#F3F4F6';
        let color = '#374151';
        let text = status.replace('_', ' ').toUpperCase();

        if (isResolved) { bg = '#D1FAE5'; color = '#065F46'; }
        else if (isPending) { bg = '#FEF3C7'; color = '#92400E'; }
        else if (isInProgress) { bg = '#DBEAFE'; color = '#1E40AF'; }

        return (
            <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={[styles.badgeText, { color }]}>{text}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'My Complaints'}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1E88E5" />
                </View>
            ) : (
                <FlatList
                    data={complaints}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No complaints found.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('ComplaintDetails', { complaintId: item.id })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                <StatusBadge status={item.currentStatus} />
                            </View>

                            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.footerItem}>
                                    <Clock size={14} color="#9CA3AF" />
                                    <Text style={styles.footerText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                                {item.upvotes > 0 && (
                                    <View style={styles.footerItem}>
                                        <TrendingUp size={14} color="#EF4444" />
                                        <Text style={styles.footerText}>{item.upvotes} Upvotes</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white' },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    list: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { color: '#6B7280', fontSize: 16 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', flex: 1, marginRight: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    cardDesc: { color: '#4B5563', fontSize: 14, marginBottom: 12, lineHeight: 20 },
    cardFooter: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 12, color: '#9CA3AF' }
});
