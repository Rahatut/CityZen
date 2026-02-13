import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, TextInput as RNTextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { Search, MapPin, Heart, AlertCircle, Filter, SlidersHorizontal, X, Camera } from 'lucide-react-native';
import axios from 'axios';
import api from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function FeedScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const [complaints, setComplaints] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState(null); // in km
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [timeFilter, setTimeFilter] = useState(null);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

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

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Fetch complaints from API
  const fetchComplaints = useCallback(async () => {
    try {
      setError(null);
      // Get user info
      const jsonValue = await AsyncStorage.getItem('userData');
      const retrievedUserData = jsonValue != null ? JSON.parse(jsonValue) : null;
      setUserData(retrievedUserData);

      let url = '/complaints?page=1&limit=50';
      let authorityCompanyId = null;

      if (retrievedUserData && retrievedUserData.role === 'authority') {
        // Try to get companyId from userData or AsyncStorage
        authorityCompanyId = retrievedUserData.companyId || retrievedUserData.authorityCompanyId;
        if (!authorityCompanyId) {
          authorityCompanyId = await AsyncStorage.getItem('authorityCompanyId');
        }
        if (authorityCompanyId) {
          url = `/complaints/authority/${authorityCompanyId}?limit=50`;
        }
      } else if (retrievedUserData && retrievedUserData.firebaseUid) {
        url = `/complaints?page=1&limit=50&citizenUid=${retrievedUserData.firebaseUid}`;
      }

      const response = await api.get(url, {
        headers: {
          'bypass-tunnel-reminder': 'true'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data && response.data.complaints) {
        setComplaints(response.data.complaints);
      }

      // Fetch categories
      try {
        const categoriesResponse = await api.get('/complaints/categories');
        const catPayload = categoriesResponse.data;
        const cats = Array.isArray(catPayload)
          ? catPayload
          : catPayload?.categories || catPayload?.data?.categories || [];

        if (cats && Array.isArray(cats)) {
          setAllCategories(cats);
        }
      } catch (catErr) {
        console.log('Could not fetch categories:', catErr);
      }

    } catch (err) {
      console.error('Error fetching complaints:', err);
      let errorMessage = 'Failed to load complaints';

      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Network timeout. Please check your connection.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Server not reachable. Is the backend running?';
      }

      setError(errorMessage);
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchComplaints();
    getUserLocation();
  }, [fetchComplaints]);

  // Get user's actual GPS location
  const getUserLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('Location permission denied');
        // Fallback to Dhaka coordinates if permission denied
        setUserLocation({ latitude: 23.8103, longitude: 90.4125 });
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to Dhaka coordinates on error
      setUserLocation({ latitude: 23.8103, longitude: 90.4125 });
    }
  };

  // Refresh when navigating back from submit
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshing(true);
      fetchComplaints();
    });

    return unsubscribe;
  }, [navigation, fetchComplaints]);

  // Filter complaints by search query and status
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Radius filter (distance-based)
    if (radiusFilter && userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(complaint.latitude),
        parseFloat(complaint.longitude)
      );
      if (distance > radiusFilter) return false;
    }

    // Category filter
    if (categoryFilter && complaint.Category?.id !== categoryFilter) {
      return false;
    }

    // Time filter
    if (timeFilter) {
      const complaintDate = new Date(complaint.createdAt);
      const now = new Date();
      const diffTime = now - complaintDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeFilter === 'today' && diffDays > 1) return false;
      if (timeFilter === 'week' && diffDays > 7) return false;
      if (timeFilter === 'month' && diffDays > 30) return false;
    }

    return matchesSearch;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints();
  }, [fetchComplaints]);

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

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Complaints Feed</Text>

        {/* Search Bar with Filter Button */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, darkMode && styles.darkInput]}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={[styles.input, darkMode && styles.textWhite]}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive, darkMode && styles.filterBtnDark]}
            onPress={() => setFilterModalVisible(true)}
          >
            <SlidersHorizontal size={20} color={activeFilterCount > 0 ? "white" : "#6B7280"} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loadingText, darkMode && styles.textWhite]}>Loading complaints...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={[styles.errorContainer, darkMode && styles.errorContainerDark]}>
            <AlertCircle size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                fetchComplaints();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && filteredComplaints.length === 0 && (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, darkMode && styles.textWhite]}>
              {searchQuery ? 'No complaints found' : 'No complaints yet'}
            </Text>
          </View>
        )}

        {/* Complaints List */}
        {!loading && !error && filteredComplaints.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={[styles.card, darkMode && styles.cardDark]}
            onPress={() => navigation.navigate('ComplaintDetails', { id: item.id })}
          >
            {/* Header Row: Category & Date */}
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadgeContainer}>
                <View style={[styles.categoryIconCircle, { backgroundColor: darkMode ? '#374151' : '#F3F4F6' }]}>
                  <MapPin size={10} color={darkMode ? '#9CA3AF' : '#6B7280'} />
                </View>
                <Text style={[styles.categoryText, darkMode && styles.textGray]}>{item.Category?.name || 'Uncategorized'}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            {/* Image Section */}
            {(() => {
              const displayImage = item.images?.find(img => img.type === 'initial') || item.images?.[0];
              return displayImage ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: displayImage.imageURL }} style={styles.cardImage} />
                  <View style={[styles.statusOverlay, {
                    backgroundColor:
                      item.currentStatus === 'resolved' || item.currentStatus === 'completed' ? '#059669EE' :
                        item.currentStatus === 'rejected' ? '#DC2626EE' :
                          item.currentStatus === 'in_progress' ? '#1E88E5EE' :
                            item.currentStatus === 'accepted' ? '#F59E0BEE' : '#6B7280EE'
                  }]}>
                    <Text style={styles.statusOverlayText}>
                      {(item.currentStatus || 'pending').replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              ) : null;
            })()}

            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, darkMode && styles.textWhite]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.cardDescription, darkMode && styles.textGray]} numberOfLines={2}>
                {item.description || 'No description provided.'}
              </Text>

              {/* Action Bar */}
              <View style={[styles.cardActions, darkMode && styles.cardActionsDark]}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={async () => {
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
                        Alert.alert('Info', 'You have already upvoted this complaint.');
                      } else {
                        console.error('Upvote failed', e);
                      }
                    }
                  }}
                >
                  <Heart
                    size={18}
                    color={item.hasUpvoted ? "#EF4444" : "#9CA3AF"}
                    fill={item.hasUpvoted ? "#EF4444" : "transparent"}
                  />
                  <Text style={[styles.actionBtnLabel, item.hasUpvoted && { color: "#EF4444" }]}>
                    {item.upvotes || 0}
                  </Text>
                </TouchableOpacity>

                <View style={styles.vSeparator} />

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('AddEvidence', { complaintId: item.id })}
                >
                  <Camera size={18} color="#6B7280" />
                  <Text style={styles.actionBtnLabel}>Evidence</Text>
                </TouchableOpacity>

                <View style={styles.vSeparator} />

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openReport(item)}
                >
                  <AlertCircle size={18} color="#6B7280" />
                  <Text style={styles.actionBtnLabel}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />

      {/* Filter Modal (Authority-style) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.cardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={24} color={darkMode ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Distance from You</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterChip, !radiusFilter && styles.filterChipActive]}
                  onPress={() => setRadiusFilter(null)}
                >
                  <Text style={[styles.filterChipText, !radiusFilter && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {[1, 2, 5, 10, 20].map((km) => (
                  <TouchableOpacity
                    key={km}
                    style={[styles.filterChip, radiusFilter === km && styles.filterChipActive]}
                    onPress={() => setRadiusFilter(km)}
                  >
                    <Text style={[styles.filterChipText, radiusFilter === km && styles.filterChipTextActive]}>{km} km</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Categories</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterChip, !categoryFilter && styles.filterChipActive]}
                  onPress={() => setCategoryFilter(null)}
                >
                  <Text style={[styles.filterChipText, !categoryFilter && styles.filterChipTextActive]}>All Categories</Text>
                </TouchableOpacity>
                {allCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, categoryFilter === cat.id && styles.filterChipActive]}
                    onPress={() => setCategoryFilter(cat.id)}
                  >
                    <Text style={[styles.filterChipText, categoryFilter === cat.id && styles.filterChipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Time Period</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterChip, !timeFilter && styles.filterChipActive]}
                  onPress={() => setTimeFilter(null)}
                >
                  <Text style={[styles.filterChipText, !timeFilter && styles.filterChipTextActive]}>All Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, timeFilter === 'today' && styles.filterChipActive]}
                  onPress={() => setTimeFilter('today')}
                >
                  <Text style={[styles.filterChipText, timeFilter === 'today' && styles.filterChipTextActive]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, timeFilter === 'week' && styles.filterChipActive]}
                  onPress={() => setTimeFilter('week')}
                >
                  <Text style={[styles.filterChipText, timeFilter === 'week' && styles.filterChipTextActive]}>This Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, timeFilter === 'month' && styles.filterChipActive]}
                  onPress={() => setTimeFilter('month')}
                >
                  <Text style={[styles.filterChipText, timeFilter === 'month' && styles.filterChipTextActive]}>Last Month</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setRadiusFilter(null);
                  setCategoryFilter(null);
                  setTimeFilter(null);
                  setActiveFilterCount(0);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  let count = 0;
                  if (radiusFilter) count++;
                  if (categoryFilter) count++;
                  if (timeFilter) count++;
                  setActiveFilterCount(count);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            <View style={[styles.rowBetween, { marginTop: 12 }]}>
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

  // Search and Filter Container
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  darkInput: { backgroundColor: '#1F2937', borderColor: '#374151' },
  input: { marginLeft: 8, flex: 1, fontSize: 16 },
  filterBtn: { width: 48, height: 48, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  filterBtnDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  filterBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  filterBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Filter Modal (Authority Dashboard Style)
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

  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10
  },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  categoryBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  categoryIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.2
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500'
  },

  imageWrapper: {
    position: 'relative',
    height: 220,
    width: '100%'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopLeftRadius: 16,
    elevation: 2
  },
  statusOverlayText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },

  cardInfo: {
    padding: 16
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: -0.5
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16
  },

  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  cardActionsDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280'
  },
  vSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB'
  },

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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: 'white', borderRadius: 12, padding: 16 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  reasonItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  reasonItemActive: { backgroundColor: '#E5E7EB' },
  reasonText: { fontSize: 14, color: '#111827' },
  textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, minHeight: 70, textAlignVertical: 'top', marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: '#F59E0B' },
  submitText: { color: 'white', fontWeight: '700' }
});