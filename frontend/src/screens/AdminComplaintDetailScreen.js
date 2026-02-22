import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { MapPin, Calendar, Clock, AlertTriangle, ArrowLeft, Trash2, XCircle, Send, ShieldAlert, Heart } from 'lucide-react-native';
import api from '../services/api';
import Navigation from '../components/Navigation';

export default function AdminComplaintDetailScreen({ route, navigation, darkMode, toggleDarkMode, onLogout }) {
    const { complaintId } = route.params || {};
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userModeration, setUserModeration] = useState({ strikes: 0, isBanned: false });

    const fetchComplaintData = useCallback(async () => {
        if (!complaintId) return;
        try {
            setLoading(true);
            const response = await api.get(`/complaints/${complaintId}`);
            setComplaint(response.data);

            // Fetch user moderation info
            if (response.data.citizenUid) {
                const modRes = await api.get(`/api/moderation/user/${response.data.citizenUid}`).catch(() => ({ data: { strikes: 0, isBanned: false } }));
                setUserModeration(modRes.data);
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching admin complaint details:', err);
            setError('Failed to load complaint details');
        } finally {
            setLoading(false);
        }
    }, [complaintId]);

    useEffect(() => {
        fetchComplaintData();
    }, [fetchComplaintData]);

    const openGoogleMaps = () => {
        if (!complaint) return;
        const url = `https://www.google.com/maps/search/${complaint.latitude},${complaint.longitude}`;
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Google Maps.'));
    };

    const handleBanUser = async () => {
        try {
            await api.post('/moderation/ban', {
                citizenUid: complaint.citizenUid,
                reason: 'Violation of platform policies'
            });
            Alert.alert('Success', 'User has been permanently banned.');
            fetchComplaintData();
        } catch (err) {
            Alert.alert('Error', 'Failed to ban user.');
        }
    };

    const handleDeleteComplaint = async () => {
        Alert.alert(
            "Confirm Deletion",
            "Permanently delete this complaint? This will also issue a moderation strike to the user.",
            [
                { text: "Cancel" },
                {
                    text: "Delete & Strike", style: 'destructive', onPress: async () => {
                        try {
                            await api.delete(`/complaints/${complaintId}`, { data: { citizenUid: 'admin' } });
                            await api.post('/moderation/strike', {
                                citizenUid: complaint.citizenUid,
                                reason: 'Policy violation: reported and confirmed',
                                complaintId: complaintId
                            });
                            Alert.alert('Success', 'Complaint deleted and strike issued.');
                            navigation.goBack();
                        } catch (err) {
                            const message = err?.response?.data?.message || err?.message || 'Failed to complete action.';
                            Alert.alert('Error', `Failed to complete action: ${message}`);
                        }
                    }
                }
            ]
        );
    };

    const handleAppealDecision = async (action) => {
        const isApprove = action === 'approve';
        Alert.alert(
            isApprove ? "Approve Appeal" : "Reject Appeal",
            isApprove ? "Forward this complaint back to the authority?" : "Uphold the original decision?",
            [
                { text: "Cancel" },
                {
                    text: "Confirm", onPress: async () => {
                        try {
                            await api.patch(`/complaints/appeals/${complaintId}`, {
                                action,
                                adminRemarks: isApprove ? 'Appeal approved - re-investigation required' : 'Appeal rejected'
                            });
                            Alert.alert('Success', isApprove ? 'Forwarded to authority' : 'Appeal rejected');
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update appeal status.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) return (
        <View style={[styles.centered, darkMode && styles.darkContainer]}>
            <ActivityIndicator size="large" color="#1E88E5" />
        </View>
    );

    if (error || !complaint) return (
        <View style={[styles.centered, darkMode && styles.darkContainer]}>
            <Text style={darkMode ? styles.textWhite : null}>{error || 'Complaint not found'}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={{ color: '#1E88E5' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, darkMode && styles.darkContainer]}>
            <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={darkMode ? 'white' : 'black'} />
                    <Text style={[styles.backText, darkMode && styles.textWhite]}>Back to Triage</Text>
                </TouchableOpacity>

                <View style={[styles.card, darkMode && styles.cardDark]}>
                    <Text style={[styles.title, darkMode && styles.textWhite]}>{complaint.title}</Text>
                    <View style={styles.row}>
                        <View style={[styles.badge, { backgroundColor: '#1E88E520' }]}>
                            <Text style={{ color: '#1E88E5', fontSize: 12, fontWeight: '700' }}>{complaint.Category?.name}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#F59E0B20' }]}>
                            <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>{complaint.currentStatus.toUpperCase()}</Text>
                        </View>
                    </View>

                    <Text style={[styles.description, darkMode && styles.textGray]}>{complaint.description}</Text>

                    <View style={styles.metaRow}>
                        <Calendar size={16} color="#9CA3AF" />
                        <Text style={styles.metaText}>{new Date(complaint.createdAt).toLocaleDateString()}</Text>
                        <MapPin size={16} color="#9CA3AF" style={{ marginLeft: 16 }} />
                        <Text style={styles.metaText}>{complaint.area || 'Unknown Area'}</Text>
                    </View>

                    <TouchableOpacity onPress={openGoogleMaps} style={styles.mapBtn}>
                        <MapPin size={18} color="white" />
                        <Text style={styles.mapBtnText}>View on Google Maps</Text>
                    </TouchableOpacity>
                </View>

                {/* User Info Card */}
                <View style={[styles.card, darkMode && styles.cardDark]}>
                    <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Reporter Info</Text>
                    <Text style={[styles.metaText, { fontSize: 14, marginBottom: 8 }]}>UID: {complaint.citizenUid}</Text>
                    <View style={styles.row}>
                        <ShieldAlert size={18} color="#EF4444" />
                        <Text style={[styles.metaText, { color: '#EF4444', fontWeight: 'bold' }]}>
                            Strikes: {userModeration.strikes} / 5
                        </Text>
                        {userModeration.isBanned && (
                            <View style={[styles.badge, { backgroundColor: '#EF4444', marginLeft: 10 }]}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>BANNED</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Center */}
                <View style={[styles.card, darkMode && styles.cardDark]}>
                    <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Moderation Actions</Text>

                    <View style={styles.actionGrid}>
                        <ActionBtn
                            icon={Trash2}
                            label="Delete & Strike"
                            color="#EF4444"
                            onPress={handleDeleteComplaint}
                        />
                        <ActionBtn
                            icon={XCircle}
                            label="Ban User"
                            color="#B91C1C"
                            onPress={handleBanUser}
                        />
                    </View>

                    {complaint.currentStatus === 'appealed' && complaint.appealStatus !== 'approved' && complaint.appealStatus !== 'rejected' && (
                        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Appeal Decision</Text>
                            <Text style={[styles.description, { fontStyle: 'italic' }]}>"{complaint.appealReason}"</Text>
                            <View style={styles.actionGrid}>
                                <ActionBtn
                                    icon={XCircle}
                                    label="Reject Appeal"
                                    color="#EF4444"
                                    onPress={() => handleAppealDecision('reject')}
                                />
                                <ActionBtn
                                    icon={Send}
                                    label="Approve & Forward"
                                    color="#1E88E5"
                                    onPress={() => handleAppealDecision('approve')}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Evidence Images */}
                {complaint.images && complaint.images.length > 0 && (
                    <View style={[styles.card, darkMode && styles.cardDark]}>
                        <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Evidence</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {complaint.images.map(img => (
                                <View key={img.id} style={styles.imgWrapper}>
                                    <Image source={{ uri: img.imageURL }} style={styles.evidenceImg} />
                                    <Text style={styles.imgTag}>{img.type.toUpperCase()}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const ActionBtn = ({ icon: Icon, label, color, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.actionBtn, { borderColor: color }]}>
        <Icon size={20} color={color} />
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    darkContainer: { backgroundColor: '#111827' },
    scroll: { padding: 16, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backText: { marginLeft: 8, fontSize: 16, fontWeight: '600' },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardDark: { backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    description: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 16 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    metaText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
    mapBtn: { backgroundColor: '#1E88E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, marginTop: 10 },
    mapBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
    actionGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
    actionLabel: { fontWeight: 'bold', fontSize: 13 },
    imgWrapper: { marginRight: 12, position: 'relative' },
    evidenceImg: { width: 200, height: 200, borderRadius: 12 },
    imgTag: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' }
});
