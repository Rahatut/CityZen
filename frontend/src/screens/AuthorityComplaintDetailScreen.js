import React, { useEffect, useState } from 'react';
import {
    View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, Linking, TextInput, Modal,
    KeyboardAvoidingView, Platform
} from 'react-native';
import Navigation from '../components/Navigation';
import {
    MapPin, Calendar, ArrowLeft, CheckCircle, Circle, HardHat,
    MessageSquare, AlertTriangle, Map, Camera, X, Clock
} from 'lucide-react-native';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function AuthorityComplaintDetailScreen({ route, navigation, onLogout, darkMode, toggleDarkMode }) {
    const { id, complaintId, initialData } = route.params || {};
    const complaintIdToFetch = id || complaintId;
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);
    const [complaint, setComplaint] = useState(initialData || null);

    // Status Update States
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionType, setActionType] = useState('');
    const [note, setNote] = useState('');
    const [images, setImages] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const rejectionShortcuts = ["Inaccurate Location", "Duplicate Report", "Private Property", "Outside Jurisdiction"];

    useEffect(() => {
        const fetchComplaint = async () => {
            if (!complaintIdToFetch) {
                if (!initialData) {
                    setError('No complaint ID provided');
                    setLoading(false);
                }
                return;
            }
            try {
                // If we already have initialData, loading is false, so we just refresh in background or silent
                const response = await api.get(`/complaints/${complaintIdToFetch}`);
                setComplaint(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching complaint:', err);
                if (!complaint) setError('Failed to load complaint details');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaint();
    }, [complaintIdToFetch]);

    const openGoogleMaps = () => {
        if (!complaint) return;
        const url = `https://www.google.com/maps/search/${complaint.latitude},${complaint.longitude}`;
        Linking.openURL(url).catch(err => {
            console.log('Could not open Google Maps', err);
            Alert.alert('Error', 'Could not open Google Maps.');
        });
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Needed', 'Camera permission is required to take proof photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImages(prev => [...prev, result.assets[0].uri]);
        }
    };

    const handleFinalSubmit = async (statusOverride) => {
        if (!complaint) return;

        const type = actionType || statusOverride;
        if (type === 'Reject' && !note) return Alert.alert("Required", "Please provide a rejection reason.");
        if ((type === 'Resolve' || type === 'Progress') && (!images || images.length === 0)) {
            return Alert.alert("Evidence Required", "Please capture a work-site photo.");
        }

        const statusMapBackend = { 'Reject': 'rejected', 'Progress': 'in_progress', 'Resolve': 'resolved', 'Accept': 'accepted' };
        let newStatusBackend = statusOverride ? statusOverride.toLowerCase() : statusMapBackend[type];

        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('currentStatus', newStatusBackend);
            formData.append('statusNotes', note || '');

            if (images.length > 0) {
                images.forEach((uri, index) => {
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image`;
                    formData.append('images', { uri, name: filename, type });
                });
            }

            await api.patch(`/complaints/${complaint.id}/status`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert("Success", `Status updated to ${newStatusBackend.replace('_', ' ').toUpperCase()}`);

            // Refresh local data
            const response = await api.get(`/complaints/${complaint.id}`);
            setComplaint(response.data);

            setActionModalVisible(false);
            setNote('');
            setImages([]);
        } catch (error) {
            console.error("Update failed", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to update status.";
            Alert.alert("Error", errorMsg);
        } finally {
            setIsUpdating(false);
        }
    };

    const openActionModal = (type) => {
        setActionType(type);
        setNote('');
        setImages([]);
        setActionModalVisible(true);
    };

    // Map backend status to timeline steps
    const steps = ['Submitted', 'Accepted', 'In Progress', 'Resolved'];
    const statusToStepIndex = {
        pending: 0,
        accepted: 1,
        in_progress: 2,
        resolved: 3,
        closed: 3,
        rejected: 0,
        appealed: 2,
        completed: 3
    };
    const currentStep = statusToStepIndex[(complaint?.currentStatus || 'pending').toLowerCase()] ?? 0;

    if (loading) {
        return (
            <View style={[styles.container, darkMode && styles.darkContainer, styles.center]}>
                <ActivityIndicator size="large" color="#1E88E5" />
                <Text style={[styles.loadingText, darkMode && styles.textWhite]}>Loading details...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, darkMode && styles.darkContainer, styles.center]}>
                <AlertTriangle size={48} color="#EF4444" />
                <Text style={[styles.errorText, darkMode && styles.textWhite]}>{error}</Text>
                <TouchableOpacity style={styles.backBtnInline} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, darkMode && styles.darkContainer]}>
            <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={darkMode ? 'white' : '#374151'} />
                    <Text style={[styles.backText, darkMode && styles.textWhite]}>Back</Text>
                </TouchableOpacity>

                {/* Hero Image */}
                <Image
                    source={{ uri: (complaint?.images?.[0]?.imageURL) || 'https://via.placeholder.com/1200x800?text=No+Image' }}
                    style={styles.image}
                    resizeMode="cover"
                />

                <View style={styles.content}>
                    {/* Main Info Card */}
                    <View style={[styles.card, darkMode && styles.cardDark]}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, darkMode && styles.textWhite]}>{complaint?.title || 'Untitled Complaint'}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: (complaint?.currentStatus === 'pending' ? '#FEF3C7' : '#D1FAE5') }]}>
                                <Text style={[styles.statusBadgeText, { color: (complaint?.currentStatus === 'pending' ? '#92400E' : '#065F46') }]}>
                                    {(complaint?.currentStatus || 'pending').replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Calendar size={14} color="#6B7280" />
                                <Text style={styles.metaText}>{new Date(complaint?.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <TouchableOpacity style={styles.mapsSmallBtn} onPress={openGoogleMaps}>
                                <Map size={14} color="white" />
                                <Text style={styles.mapsSmallBtnText}>Maps</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.description, darkMode && styles.textGray]}>{complaint?.description || 'No description provided.'}</Text>
                    </View>

                    {/* Status Action Buttons */}
                    {complaint?.currentStatus !== 'resolved' && complaint?.currentStatus !== 'completed' && complaint?.currentStatus !== 'rejected' && (
                        <View style={[styles.card, darkMode && styles.cardDark]}>
                            <Text style={[styles.label, { marginBottom: 12 }]}>UPDATE STATUS</Text>
                            <View style={styles.actionRow}>
                                {complaint?.currentStatus === 'pending' ? (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.rejectBtn]}
                                            onPress={() => openActionModal('Reject')}
                                            disabled={isUpdating}
                                        >
                                            <X size={18} color="white" />
                                            <Text style={styles.actionBtnText}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.acceptBtn]}
                                            onPress={() => handleFinalSubmit('accepted')}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? <ActivityIndicator size="small" color="white" /> : (
                                                <>
                                                    <CheckCircle size={18} color="white" />
                                                    <Text style={styles.actionBtnText}>Accept</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.progressBtn]}
                                            onPress={() => openActionModal('Progress')}
                                            disabled={isUpdating}
                                        >
                                            <Clock size={18} color="white" />
                                            <Text style={styles.actionBtnText}>Update Progress</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.resolveBtn]}
                                            onPress={() => openActionModal('Resolve')}
                                            disabled={isUpdating}
                                        >
                                            <CheckCircle size={18} color="white" />
                                            <Text style={styles.actionBtnText}>Resolve</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Citizen Appeal / Admin Remarks Section */}
                    {(complaint?.currentStatus === 'appealed' || complaint?.appealReason) && (
                        <View style={[styles.card, styles.appealCard, darkMode && styles.cardDark]}>
                            <View style={styles.sectionHeaderRow}>
                                <MessageSquare size={18} color="#7E22CE" />
                                <Text style={[styles.sectionTitle, { color: '#7E22CE' }]}>Citizen Appeal Remarks</Text>
                            </View>
                            <View style={styles.remarkBox}>
                                <Text style={[styles.remarkText, darkMode && styles.textWhite]}>
                                    {complaint?.appealReason || "Citizen has filed an appeal for this resolution."}
                                </Text>
                            </View>
                            {complaint?.adminRemarks && (
                                <View style={[styles.remarkBox, styles.adminRemarkBox]}>
                                    <Text style={[styles.label, { color: '#B91C1C', marginBottom: 4 }]}>ADMIN INSTRUCTIONS:</Text>
                                    <Text style={[styles.remarkText, darkMode && styles.textWhite]}>{complaint.adminRemarks}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Authority Updates Card */}
                    <View style={[styles.card, darkMode && styles.cardDark]}>
                        <View style={styles.sectionHeaderRow}>
                            <HardHat size={18} color="#1E88E5" />
                            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Department Progress</Text>
                        </View>

                        {complaint?.statusNotes ? (
                            <View style={styles.updateSection}>
                                <Text style={styles.label}>OFFICIAL REMARKS</Text>
                                <View style={[styles.remarkBox, { backgroundColor: darkMode ? '#374151' : '#F3F4F6' }]}>
                                    <Text style={[styles.remarkText, darkMode && styles.textWhite]}>{complaint.statusNotes}</Text>
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.noInfoText}>No official remarks recorded yet.</Text>
                        )}

                        {/* Work Evidence Images */}
                        {complaint?.images?.filter(img => img.type === 'progress' || img.type === 'resolution').length > 0 && (
                            <View style={styles.evidenceSection}>
                                <Text style={styles.label}>WORK EVIDENCE</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceScroll}>
                                    {complaint.images.filter(img => img.type === 'progress' || img.type === 'resolution').map((img, idx) => (
                                        <Image key={idx} source={{ uri: img.imageURL }} style={styles.evidenceImage} />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Timeline Card */}
                    <View style={[styles.card, darkMode && styles.cardDark, { marginBottom: 40 }]}>
                        <Text style={[styles.sectionTitle, darkMode && styles.textWhite, { marginBottom: 16 }]}>Status Timeline</Text>
                        <View style={styles.timeline}>
                            {steps.map((step, index) => (
                                <View key={step} style={styles.stepContainer}>
                                    <View style={styles.stepIconWrapper}>
                                        {index <= currentStep ? (
                                            <CheckCircle size={22} color="#16A34A" />
                                        ) : (
                                            <Circle size={22} color="#D1D5DB" />
                                        )}
                                    </View>
                                    <Text style={[styles.stepText, index <= currentStep && styles.stepTextActive]}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Action Modal */}
            <Modal visible={actionModalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, darkMode && styles.cardDark]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
                                {actionType === 'Reject' ? 'Rejection Reason' : 'Work Proof Upload'}
                            </Text>
                            <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                                <X size={24} color={darkMode ? 'white' : '#374151'} />
                            </TouchableOpacity>
                        </View>

                        {actionType === 'Reject' && (
                            <View style={styles.shortcutWrapper}>
                                {rejectionShortcuts.map(s => (
                                    <TouchableOpacity key={s} style={styles.shortcutChip} onPress={() => setNote(s)}>
                                        <Text style={styles.shortcutText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {(actionType === 'Progress' || actionType === 'Resolve') && (
                            <View>
                                <TouchableOpacity
                                    style={[styles.uploadBox, images.length > 0 && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]}
                                    onPress={handlePickImage}
                                >
                                    <Camera size={32} color={images.length > 0 ? "#10B981" : "#1E88E5"} />
                                    <Text style={[styles.uploadText, { color: images.length > 0 ? '#10B981' : '#1E88E5' }]}>
                                        {images.length > 0 ? `${images.length} Photo(s) Captured` : 'Capture Site Photo'}
                                    </Text>
                                </TouchableOpacity>

                                {images.length > 0 && (
                                    <ScrollView horizontal style={styles.modalImageScroll} showsHorizontalScrollIndicator={false}>
                                        {images.map((img, idx) => (
                                            <View key={idx} style={styles.modalImageWrapper}>
                                                <Image source={{ uri: img }} style={styles.modalImage} />
                                                <TouchableOpacity
                                                    style={styles.removeImageBtn}
                                                    onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                                >
                                                    <X size={12} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        <Text style={[styles.label, { marginTop: 16 }]}>INTERNAL REMARKS</Text>
                        <TextInput
                            style={[styles.modalInput, darkMode && styles.inputDark]}
                            placeholder="Add notes for this update..."
                            multiline
                            value={note}
                            onChangeText={setNote}
                            numberOfLines={4}
                        />

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: actionType === 'Reject' ? '#EF4444' : '#10B981' }]}
                                onPress={() => handleFinalSubmit()}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator size="small" color="white" /> : (
                                    <Text style={styles.confirmBtnText}>Submit {actionType}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    darkContainer: { backgroundColor: '#111827' },
    scrollContent: { paddingBottom: 60 },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },
    errorText: { marginTop: 12, color: '#EF4444', fontSize: 16, textAlign: 'center' },
    backBtnInline: { marginTop: 20, backgroundColor: '#1E88E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: 'white', fontWeight: 'bold' },

    backBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
    backText: { fontSize: 16, color: '#374151', fontWeight: '500' },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' },

    image: { width: '100%', height: 250 },
    content: { padding: 16, gap: 16 },

    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', flex: 1, marginRight: 10 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },

    metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 13, color: '#6B7280' },

    description: { fontSize: 15, color: '#4B5563', lineHeight: 22 },

    appealCard: { borderColor: '#E9D5FF', backgroundColor: '#FAF5FF' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

    label: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', letterSpacing: 1, marginBottom: 6 },
    remarkBox: { padding: 12, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
    adminRemarkBox: { marginTop: 12, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
    remarkText: { fontSize: 14, color: '#374151', lineHeight: 20 },

    updateSection: { marginBottom: 16 },
    evidenceSection: { marginTop: 8 },
    evidenceScroll: { marginTop: 4 },
    evidenceImage: { width: 120, height: 120, borderRadius: 8, marginRight: 12 },
    noInfoText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },

    timeline: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
    stepContainer: { alignItems: 'center', flex: 1, position: 'relative' },
    stepIconWrapper: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    stepLineShortcut: {
        position: 'absolute',
        top: 15,
        left: '50%',
        right: '-50%',
        height: 2,
        backgroundColor: '#E5E7EB',
        zIndex: 0
    },
    stepLineActive: { backgroundColor: '#16A34A' },
    stepText: { fontSize: 10, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
    stepTextActive: { color: '#16A34A', fontWeight: 'bold' },

    mapsSmallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#1E88E5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 'auto'
    },
    mapsSmallBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12
    },
    actionBtnText: { color: 'white', fontWeight: 'bold' },
    acceptBtn: { backgroundColor: '#10B981' },
    rejectBtn: { backgroundColor: '#EF4444' },
    progressBtn: { backgroundColor: '#1E88E5' },
    resolveBtn: { backgroundColor: '#059669' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
    shortcutWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    shortcutChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    shortcutText: { fontSize: 12, color: '#4B5563' },
    uploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E5E7EB',
        borderRadius: 16,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10
    },
    uploadText: { marginTop: 8, fontSize: 14, fontWeight: '500' },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 14,
        textAlignVertical: 'top',
        marginTop: 8,
        minHeight: 100
    },
    inputDark: { backgroundColor: '#374151', color: 'white', borderColor: '#4B5563' },
    modalActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    cancelBtnText: { color: '#4B5563', fontWeight: 'bold' },
    confirmBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    confirmBtnText: { color: 'white', fontWeight: 'bold' },
    modalImageScroll: { marginVertical: 12 },
    modalImageWrapper: { position: 'relative', marginRight: 10 },
    modalImage: { width: 80, height: 80, borderRadius: 8 },
    removeImageBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        padding: 2,
        elevation: 2
    }
});
