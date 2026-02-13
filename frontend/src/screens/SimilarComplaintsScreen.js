import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, TextInput as RNTextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // Keep for consistency, though not used for filtering
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { Search, MapPin, Heart, AlertCircle, Filter, SlidersHorizontal, X, Camera } from 'lucide-react-native'; // Keep relevant icons
import axios from 'axios';
import api from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function SimilarComplaintsScreen({ navigation, route, darkMode, toggleDarkMode, onLogout }) {
  // similarComplaints are passed via route.params
  const initialSimilarComplaints = route.params?.similarComplaints || [];
  const [complaints, setComplaints] = useState(initialSimilarComplaints);
  const [loading, setLoading] = useState(false); // No API fetch on this screen, so set to false
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // Keep for consistency, though less likely to be used here
  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // Keep for consistency, though not used for filtering
  
  // Filter states (removed as per requirements, but kept some for placeholders or future use if needed)
  const [filterModalVisible, setFilterModalVisible] = useState(false); // Will not be used
  const [radiusFilter, setRadiusFilter] = useState(null); // Will not be used
  const [categoryFilter, setCategoryFilter] = useState(null); // Will not be used
  const [timeFilter, setTimeFilter] = useState(null); // Will not be used
  const [activeFilterCount, setActiveFilterCount] = useState(0); // Will not be used

  // Report modal state
  const [reportVisible, setReportVisible] = useState(false);
  const [reportComplaint, setReportComplaint] = useState(null); // { id, title }
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const REPORT_REASONS = [
    { key: 'harassment_threats', label: 'Harassment & Threats' },
    { key: 'hate_speech_discrimination', label: 'Hate Speech & Discrimination' },
    { key: 'nudity_sexual_content', label: 'Nudity & Sexual Content' },
    { key: 'spam_scams', label: 'Spam & Scams' },
    { key: 'fake_information_misinformation', label: 'Fake Information / Misinformation' },
    { key: 'self_harm_suicide', label: 'Self-Harm & Suicide' },
    { key: 'violence_graphic_content', label: 'Violence & Graphic Content' },
    { key: 'intellectual_property', label: 'Intellectual Property Violations' },
    { key: 'impersonation_fake_accounts', label: 'Impersonation & Fake Accounts' },
    { key: 'child_safety', label: 'Child Safety' },
    { key: 'other_violations', label: 'Other Policy Violations' },
  ];

  // Calculate distance between two coordinates (Haversine formula) - kept for consistency but not used
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Fetch user data on mount (needed for upvoting/reporting)
  useEffect(() => {
    const fetchUserData = async () => {
      const jsonValue = await AsyncStorage.getItem('userData');
      setUserData(jsonValue != null ? JSON.parse(jsonValue) : null);
    };
    fetchUserData();
  }, []);

  // onRefresh will simply re-initialize the complaints from route.params
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setComplaints(route.params?.similarComplaints || []);
    setRefreshing(false);
  }, [route.params?.similarComplaints]);

  const openReport = (complaint) => {
    setReportComplaint({ id: complaint.id, title: complaint.title });
    setReportReason('');
    setReportDescription('');
    setReportVisible(true);
  };

  const submitReport = async () => {
    try {
      if (reportSubmitting) return; // Prevent double submission
      
      if (!userData || !userData.firebaseUid) {
        Alert.alert('Error', 'Please login to report');
        return;
      }
      if (!reportComplaint?.id || !reportReason) {
        Alert.alert('Error', 'Please select a reason');
        return;
      }
      
      setReportSubmitting(true);
      await api.post(`/complaints/${reportComplaint.id}/report`, {
        complaintId: reportComplaint.id,
        reportedBy: userData.firebaseUid,
        reason: reportReason,
        description: reportDescription || undefined,
      });
      setReportVisible(false);
      setReportReason('');
      setReportDescription('');
      Alert.alert('Thank you', 'Your report has been submitted.');
    } catch (e) {
      console.error('Report failed', e?.response?.data || e.message);
      const errorMsg = e?.response?.data?.message || 'Failed to submit report';
      Alert.alert('Error', errorMsg);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Upvote function from FeedScreen
  const handleUpvote = async (item) => {
    try {
      if (!userData || !userData.firebaseUid) {
        Alert.alert('Error', 'Please login to upvote');
        return;
      }
      const res = await api.post(`/complaints/${item.id}/upvote`, { citizenUid: userData.firebaseUid });
      if (res.data && res.data.upvotes !== undefined) {
        setComplaints(prev => prev.map(c => c.id === item.id ? { ...c, upvotes: res.data.upvotes, hasUpvoted: true } : c));
      }
    } catch (e) {
      if (e.response && e.response.status === 400) {
        console.log('Upvote prevented:', e.response.data.message);
        Alert.alert('Info', 'You have already upvoted this complaint.');
      } else {
        console.error('Upvote failed', e);
      }
    }
  };


  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Similar Complaints</Text>
        
        {/* Search Bar and Filter Button removed */}

        {/* Loading State - not truly loading from API, but keeping structure */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loadingText, darkMode && styles.textWhite]}>Loading similar complaints...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={[styles.errorContainer, darkMode && styles.errorContainerDark]}>
            <AlertCircle size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            {/* Retry button removed as data comes from route.params */}
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && complaints.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, darkMode && styles.textWhite]}>
              No similar complaints found.
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.emptyButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Complaints List */}
        {!loading && !error && complaints.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, darkMode && styles.cardDark]}
            onPress={() => navigation.navigate('ComplaintDetails', { id: item.id })}
          >
            {item.images && item.images.length > 0 && (
              <Image source={{ uri: item.images[0].imageURL }} style={styles.cardImage} />
            )}
            <View style={[styles.statusBadge, {
              backgroundColor:
                item.currentStatus === 'resolved' || item.currentStatus === 'completed' ? '#D1FAE5' :
                  item.currentStatus === 'rejected' ? '#FEE2E2' :
                    item.currentStatus === 'in_progress' || item.currentStatus === 'accepted' ? '#FFEDD5' : '#E5E7EB'
            }]}>
              <Text style={{
                color:
                  item.currentStatus === 'resolved' || item.currentStatus === 'completed' ? '#065F46' :
                    item.currentStatus === 'rejected' ? '#B91C1C' :
                      item.currentStatus === 'in_progress' || item.currentStatus === 'accepted' ? '#C2410C' : '#374151',
                fontSize: 10, fontWeight: 'bold'
              }}>
                {item.currentStatus ? (item.currentStatus.charAt(0).toUpperCase() + item.currentStatus.slice(1).replace('_', ' ')) : 'Pending'}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, darkMode && styles.textWhite]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.row}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.Category?.name || 'Uncategorized'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleUpvote(item)}
                >
                  <Heart size={16} color={item.upvotes > 0 ? "#EF4444" : "#6B7280"} fill={item.hasUpvoted ? "#EF4444" : "none"} />
                  <Text style={[styles.actionText, { marginLeft: 4, color: item.upvotes > 0 ? "#EF4444" : "#6B7280" }]}>
                    {item.upvotes || 0} upvotes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('AddEvidence', { complaintId: item.id })}
                >
                  <Camera size={16} color="#6B7280" />
                  <Text style={[styles.actionText, { marginLeft: 4, color: "#6B7280" }]}>Add Evidence</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openReport(item)}
                >
                  <AlertCircle size={16} color="#6B7280" />
                  <Text style={[styles.actionText, { marginLeft: 4, color: "#6B7280" }]}>Report</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardMeta}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />

      {/* Filter Modal (Removed as per requirements) */}
      {/* Report Modal */}
      <Modal visible={reportVisible} animationType="slide" transparent onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, darkMode && styles.cardDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Report Complaint</Text>
            {reportComplaint && (
              <Text style={[styles.modalSubtitle, darkMode && styles.textWhite]} numberOfLines={2}>
                {reportComplaint.title}
              </Text>
            )}
            <View style={{ maxHeight: 240, marginVertical: 8 }}>
              <ScrollView>
                {REPORT_REASONS.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.reasonItem, reportReason === r.key && styles.reasonItemActive]}
                    onPress={() => setReportReason(r.key)}
                  >
                    <Text style={[styles.reasonText, darkMode && styles.textWhite]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <RNTextInput
              placeholder="Optional description (details)"
              placeholderTextColor="#9CA3AF"
              value={reportDescription}
              onChangeText={setReportDescription}
              style={[styles.textArea, darkMode && styles.textWhite]}
              multiline
            />
            <View style={[styles.rowBetween, { marginTop: 12 }] }>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReportVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, (!reportReason || reportSubmitting) && { opacity: 0.5 }]} 
                onPress={submitReport} 
                disabled={!reportReason || reportSubmitting}
              >
                <Text style={styles.submitText}>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
  textWhite: { color: 'white' },
  
  // Search and Filter Container (removed from layout)
  // searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  // searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  // darkInput: { backgroundColor: '#1F2937', borderColor: '#374151' },
  // input: { marginLeft: 8, flex: 1, fontSize: 16 },
  // filterBtn: { width: 48, height: 48, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  // filterBtnActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  // filterBtnDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  // filterBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  // filterBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  // Filter Modal (Authority Dashboard Style - removed from layout)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  filterSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginTop: 15, marginBottom: 10 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  filterChipText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  filterChipTextActive: { color: 'white', fontWeight: 'bold' },
  modalActionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  clearBtn: { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  clearBtnText: { color: '#6B7280', fontWeight: 'bold' },
  applyBtn: { flex: 1, backgroundColor: '#1E88E5', padding: 15, borderRadius: 10, alignItems: 'center' },
  applyBtnText: { color: 'white', fontWeight: 'bold' },
  
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  cardImage: { width: '100%', height: 180 },
  statusBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cardMeta: { color: '#6B7280', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  centerContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  errorContainer: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  errorContainerDark: { backgroundColor: '#7F1D1D', borderColor: '#991B1B' },
  errorText: { color: '#DC2626', fontSize: 14, marginVertical: 8, textAlign: 'center' },
  retryButton: { backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6, marginTop: 8 },
  retryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 14 },
  
  // Report Modal (existing)
  modalBackdrop: { flex:1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: 'white', borderRadius: 12, padding: 16 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  reasonItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  reasonItemActive: { backgroundColor: '#E5E7EB' },
  reasonText: { fontSize: 14, color: '#111827' },
  textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, minHeight: 70, textAlignVertical: 'top', marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: '#F59E0B' },
  submitText: { color: 'white', fontWeight: '700' },

  // Empty state specific button for SimilarComplaintsScreen
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
    marginTop: 20, // Added margin top
  },
  emptyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

});