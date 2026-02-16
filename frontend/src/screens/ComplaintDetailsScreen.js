import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput as RNTextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { MapPin, Calendar, Heart, ArrowLeft, CheckCircle, Circle, AlertCircle, Camera, X, Plus } from 'lucide-react-native';

import api from '../services/api';

export default function ComplaintDetailsScreen({ route, navigation, onLogout, darkMode, toggleDarkMode }) {
  const { id, complaintId } = route.params || {};
  const complaintIdToFetch = id || complaintId;
  const [upvotes, setUpvotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [userData, setUserData] = useState(null);

  // Report modal state
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Appeal & Rating state
  const [rating, setRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealImages, setAppealImages] = useState([]);
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue != null) setUserData(JSON.parse(jsonValue));
      } catch (e) {
        console.error('Error fetching userData from storage:', e);
      }
    };
    fetchUser();
  }, []);


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
  const currentStep = statusToStepIndex[(complaint?.currentStatus || 'pending')] ?? 0;

  const handleUpvote = async () => {
    try {
      if (!userData || !userData.firebaseUid) {
        Alert.alert('Error', 'Please login to upvote');
        return;
      }

      const res = await api.post(`/complaints/${complaintIdToFetch}/upvote`, { citizenUid: userData.firebaseUid });
      if (res.data && res.data.upvotes !== undefined) {
        setComplaint(prev => ({ ...prev, upvotes: res.data.upvotes, hasUpvoted: true }));
        setUpvotes(res.data.upvotes);
      }
    } catch (e) {
      if (e.response && e.response.status === 400) {
        Alert.alert('Info', 'You have already upvoted this complaint.');
      } else {
        console.error('Upvote failed', e);
        Alert.alert('Error', 'Failed to upvote.');
      }
    }
  };

  const handleRating = async (stars) => {
    try {
      if (ratingSubmitting) return;
      if (!userData || !userData.firebaseUid) return Alert.alert('Error', 'Please login to rate');

      setRatingSubmitting(true);
      await api.post(`/complaints/${complaintIdToFetch}/rate`, {
        rating: stars,
        citizenUid: userData.firebaseUid
      });
      setRating(stars);
      setComplaint(prev => ({ ...prev, rating: stars }));
      Alert.alert('Success', 'Thank you for your rating!');
    } catch (e) {
      console.error('Rating failed', e);
      Alert.alert('Error', 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handlePickAppealImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Needed', 'Camera permission is required.');

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets) {
      setAppealImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const submitAppeal = async () => {
    try {
      if (appealSubmitting) return;
      if (!appealReason) return Alert.alert('Error', 'Please provide a reason for appeal.');
      if (!userData || !userData.firebaseUid) return Alert.alert('Error', 'Please login to appeal');

      setAppealSubmitting(true);
      const formData = new FormData();
      formData.append('appealReason', appealReason);
      formData.append('citizenUid', userData.firebaseUid);

      appealImages.forEach((uri) => {
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('images', { uri, name: filename, type });
      });

      await api.post(`/complaints/${complaintIdToFetch}/appeal`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAppealVisible(false);
      setComplaint(prev => ({ ...prev, currentStatus: 'appealed' }));
      Alert.alert('Success', 'Appeal submitted successfully.');
    } catch (e) {
      console.error('Appeal failed', e);
      Alert.alert('Error', 'Failed to submit appeal.');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const openReport = () => {
    setReportReason('');
    setReportDescription('');
    setReportVisible(true);
  };

  const submitReport = async () => {
    try {
      if (reportSubmitting) return;

      if (!userData || !userData.firebaseUid) {
        Alert.alert('Error', 'Please login to report');
        return;
      }
      if (!reportReason) {
        Alert.alert('Error', 'Please select a reason');
        return;
      }

      setReportSubmitting(true);
      await api.post(`/complaints/${complaintIdToFetch}/report`, {
        complaintId: complaintIdToFetch,
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


  const fetchComplaintData = useCallback(async () => {
    if (!complaintIdToFetch) {
      setError('No complaint ID provided');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      // We don't set loading(true) here to avoid flickering on every focus
      // Only set it if we don't have complaint data yet
      if (!complaint) setLoading(true);

      const response = await api.get(`/complaints/${complaintIdToFetch}`, {
        timeout: 10000,
      });
      setComplaint(response.data);
      setUpvotes(response.data.upvotes || 0);
      setRating(response.data.rating || 0);
    } catch (err) {
      console.error('Error fetching complaint:', err);
      if (!complaint) {
        let message = 'Failed to load complaint details';
        if (err.code === 'ECONNABORTED') message = 'Network timeout. Please check your connection.';
        else if (err.message === 'Network Error') message = 'Network error. Please check your connection.';
        else if (err.response?.status === 404) message = 'Complaint not found.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [complaintIdToFetch]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaintData();
    }, [fetchComplaintData])
  );

  const handleBump = async () => {
    try {
      if (!userData || !userData.firebaseUid) return Alert.alert('Error', 'Please login to bump');

      const res = await api.post(`/complaints/${complaintIdToFetch}/bump`);

      Alert.alert("Success 🚀", "Complaint Bumped to Top of Queue!");
      fetchComplaintData(); // Refresh to update lastBumpedAt
    } catch (e) {
      console.error('Bump failed', e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to bump complaint.');
    }
  };

  // Helper to check bump eligibility
  const canBumpComplaint = () => {
    if (!complaint || !userData) return false;

    // Robust User ID Extraction
    let uid = userData.firebaseUid;
    if (!uid && userData.uid && typeof userData.uid === 'string') uid = userData.uid;
    if (!uid) uid = userData.id;

    // 1. Must be owner
    if (complaint.citizenUid !== uid) return false;

    // 2. Must be open
    if (['resolved', 'closed', 'rejected', 'completed'].includes(complaint.currentStatus)) return false;

    // 3. Must be inactive > 3 days
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const lastActivity = complaint.lastAuthorityActivityAt || complaint.updatedAt;
    const isInactive = (Date.now() - new Date(lastActivity).getTime()) > threeDays;
    if (!isInactive) return false;

    // 4. Must not be bumped recently
    if (complaint.lastBumpedAt && (Date.now() - new Date(complaint.lastBumpedAt).getTime()) < threeDays) return false;

    return true;
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={darkMode ? 'white' : '#374151'} />
          <Text style={[styles.backText, darkMode && styles.textWhite]}>Back</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.loadingText, darkMode && styles.textWhite]}>Loading complaint...</Text>
          </View>
        ) : error ? (
          <View style={[styles.errorCard, darkMode && styles.errorCardDark]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); fetchComplaintData(); }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Image source={{ uri: (complaint?.images?.[0]?.imageURL) || 'https://via.placeholder.com/1200x800?text=No+Image' }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.content}>
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.title, darkMode && styles.textWhite]}>{complaint?.title || 'Untitled Complaint'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={[styles.badge, { backgroundColor: (complaint?.currentStatus === 'pending' ? '#FEE2E2' : '#FFEDD5'), alignSelf: 'flex-start' }]}>
                <Text style={{ color: (complaint?.currentStatus === 'pending' ? '#B91C1C' : '#C2410C'), fontWeight: 'bold' }}>
                  {(complaint?.currentStatus || 'pending').replace('_', ' ').replace(/^./, s => s.toUpperCase())}
                </Text>
              </View>
              {/* My Complaint Badge */}
              {userData && complaint && (userData.firebaseUid === complaint.citizenUid || userData.uid === complaint.citizenUid || userData.id === complaint.citizenUid) && (
                <View style={[styles.badge, { backgroundColor: '#DBEAFE', marginLeft: 8, alignSelf: 'flex-start' }]}>
                  <Text style={{ color: '#1E40AF', fontWeight: 'bold', fontSize: 12 }}>My Complaint</Text>
                </View>
              )}
            </View>
            <Text style={[styles.description, darkMode && styles.textGray]}>{complaint?.description || 'No description provided.'}</Text>

            {/* Authority Department Info */}
            {complaint?.AuthorityCompany && (
              <View style={styles.authorityInfoCard}>
                <View style={styles.authorityInfoHeader}>
                  <MapPin size={16} color="#1E88E5" />
                  <Text style={styles.authorityInfoLabel}>Assigned to Department</Text>
                </View>
                <Text style={styles.authorityInfoName}>{complaint.AuthorityCompany.name}</Text>
                {complaint.AuthorityCompany.description && (
                  <Text style={styles.authorityInfoContact}>{complaint.AuthorityCompany.description}</Text>
                )}
              </View>
            )}

            {/* Bump Button - Prominent Placement */}
            {canBumpComplaint() && (
              <TouchableOpacity style={styles.bumpButtonLarge} onPress={handleBump}>
                <Text style={styles.bumpTextLarge}>🚀  Bump to Top of Queue</Text>
                <Text style={styles.bumpSubText}>Authority hasn't responded in 3 days</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleUpvote}>
                <Heart size={16} color={upvotes > 0 ? "#EF4444" : "#6B7280"} fill={complaint?.hasUpvoted ? "#EF4444" : "none"} />
                <Text style={[styles.actionText, { marginLeft: 4, color: upvotes > 0 ? "#EF4444" : "#6B7280" }]}>
                  {upvotes} upvotes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={openReport}>
                <AlertCircle size={16} color="#6B7280" />
                <Text style={[styles.actionText, { marginLeft: 4, color: "#6B7280" }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Citizen Added Evidence (Original + Supplementary) */}
          {complaint?.images?.filter((img, idx) => (img.type === 'initial' && idx > 0) || img.type === 'evidence').length > 0 && (
            <View style={[styles.card, darkMode && styles.cardDark, { position: 'relative' }]}>
              <View style={styles.sectionHeaderRow}>
                <Camera size={18} color="#9CA3AF" />
                <Text style={[styles.sectionHeader, darkMode && styles.textWhite, { marginBottom: 0, marginLeft: 8 }]}>Citizen Evidence</Text>
              </View>
              <TouchableOpacity
                style={styles.addEvidencePlusButton}
                onPress={() => navigation.navigate('AddEvidence', { complaintId: complaintIdToFetch })}
              >
                <Plus size={12} color="white" />
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {complaint.images.filter((img, idx) => (img.type === 'initial' && idx > 0) || img.type === 'evidence').map((img, idx) => (
                  <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
                    <Image source={{ uri: img.imageURL }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                    <View style={[styles.evidenceBadge, { backgroundColor: img.type === 'initial' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(107, 114, 128, 0.7)' }]}>
                      <Text style={styles.evidenceBadgeText}>{img.type === 'initial' ? 'ORIGINAL' : 'SUPPLEMENTARY'}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Authority Updates */}
          {(complaint?.statusNotes || (complaint?.images && complaint?.images.filter(img => img.type === 'progress' || img.type === 'resolution').length > 0)) && (
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <View style={styles.sectionHeaderRow}>
                <CheckCircle size={18} color="#1E88E5" />
                <Text style={[styles.sectionHeader, darkMode && styles.textWhite, { marginBottom: 0, marginLeft: 8 }]}>Authority Updates</Text>
              </View>

              {complaint?.statusNotes ? (
                <View style={{ marginVertical: 12 }}>
                  <Text style={[styles.label, { fontSize: 12, color: '#6B7280', marginBottom: 4 }]}>OFFICIAL REMARKS</Text>
                  <View style={{ backgroundColor: darkMode ? '#374151' : '#F3F4F6', padding: 12, borderRadius: 8 }}>
                    <Text style={{ color: darkMode ? 'white' : '#1F2937' }}>{complaint.statusNotes}</Text>
                  </View>
                </View>
              ) : null}

              {complaint?.images?.filter(img => img.type === 'progress' || img.type === 'resolution').length > 0 && (
                <View>
                  <Text style={[styles.label, { fontSize: 12, color: '#6B7280', marginBottom: 8 }]}>WORK EVIDENCE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {complaint.images.filter(img => img.type === 'progress' || img.type === 'resolution').map((img, idx) => (
                      <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
                        <Image source={{ uri: img.imageURL }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                        <View style={[styles.evidenceBadge, { backgroundColor: '#1E88E5EE' }]}>
                          <Text style={styles.evidenceBadgeText}>AUTHORITY PROOF</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Appeal Details */}
          {(complaint?.appealReason || (complaint?.images && complaint?.images.filter(img => img.type === 'appeal').length > 0)) && (
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <View style={styles.sectionHeaderRow}>
                <AlertCircle size={18} color="#EF4444" />
                <Text style={[styles.sectionHeader, darkMode && styles.textWhite, { marginBottom: 0, marginLeft: 8 }]}>Appeal Details</Text>
              </View>

              {complaint?.appealReason && (
                <View style={{ marginVertical: 12 }}>
                  <Text style={[styles.label, { fontSize: 12, color: '#6B7280', marginBottom: 4 }]}>APPEAL REASON</Text>
                  <View style={{ backgroundColor: darkMode ? '#4B5563' : '#FEF2F2', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
                    <Text style={{ color: darkMode ? 'white' : '#B91C1C' }}>{complaint.appealReason}</Text>
                  </View>
                </View>
              )}

              {complaint?.images?.filter(img => img.type === 'appeal').length > 0 && (
                <View>
                  <Text style={[styles.label, { fontSize: 12, color: '#6B7280', marginBottom: 8 }]}>APPEAL EVIDENCE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {complaint.images.filter(img => img.type === 'appeal').map((img, idx) => (
                      <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
                        <Image source={{ uri: img.imageURL }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                        <View style={[styles.evidenceBadge, { backgroundColor: '#EF4444EE' }]}>
                          <Text style={styles.evidenceBadgeText}>APPEAL PROOF</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Rating & Appeal Section */}
          {(complaint?.currentStatus === 'resolved' || complaint?.currentStatus === 'completed' || complaint?.currentStatus === 'rejected') && (
            <View style={[styles.card, darkMode && styles.cardDark]}>
              <Text style={[styles.sectionHeader, darkMode && styles.textWhite]}>Resolution Actions</Text>

              {(complaint.currentStatus === 'resolved' || complaint.currentStatus === 'completed') && !complaint.rating && (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={[styles.label, { color: '#6B7280', marginBottom: 10 }]}>Rate the work resolution:</Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                        <Heart size={30} color={star <= rating ? "#F59E0B" : "#D1D5DB"} fill={star <= rating ? "#F59E0B" : "none"} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {complaint.rating > 0 && (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={[styles.label, { color: '#6B7280' }]}>Your Rating: {complaint.rating} / 5</Text>
                </View>
              )}

              {(complaint.currentStatus === 'resolved' || complaint.currentStatus === 'rejected') && (
                <TouchableOpacity style={styles.appealBtn} onPress={() => setAppealVisible(true)}>
                  <Text style={styles.appealBtnText}>Appeal this Decision</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Timeline */}
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.sectionHeader, darkMode && styles.textWhite]}>Status Timeline</Text>
            <View style={styles.timeline}>
              {steps.map((step, index) => (
                <View key={step} style={styles.stepContainer}>
                  {index <= currentStep ? <CheckCircle size={20} color="#16A34A" /> : <Circle size={20} color="#D1D5DB" />}
                  <Text style={[styles.stepText, index <= currentStep && styles.stepTextActive]}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Appeal Modal */}
      <Modal visible={appealVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
          <View style={[styles.modalCard, darkMode && styles.cardDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Appeal Complaint</Text>
            <Text style={[styles.modalSubtitle, darkMode && styles.textWhite]}>Explain why you are dissatisfied with the resolution/rejection.</Text>

            <RNTextInput
              placeholder="Appeal reason..."
              multiline
              style={[styles.textArea, darkMode && styles.textWhite, { minHeight: 120 }]}
              value={appealReason}
              onChangeText={setAppealReason}
            />

            <TouchableOpacity style={styles.appealCameraBtn} onPress={handlePickAppealImage}>
              <Camera size={24} color="#1E88E5" />
              <Text style={{ color: '#1E88E5', fontWeight: 'bold', marginLeft: 10 }}>Attach Evidence (Optional)</Text>
            </TouchableOpacity>

            {appealImages.length > 0 && (
              <ScrollView horizontal style={{ marginBottom: 15 }}>
                {appealImages.map((uri, idx) => (
                  <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
                    <Image source={{ uri }} style={{ width: 70, height: 70, borderRadius: 8 }} />
                    <TouchableOpacity
                      style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10 }}
                      onPress={() => setAppealImages(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.rowBetween}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAppealVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitAppealBtn} onPress={submitAppeal} disabled={appealSubmitting}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{appealSubmitting ? 'Submitting...' : 'Submit Appeal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportVisible} animationType="slide" transparent onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, darkMode && styles.cardDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Report Complaint</Text>
            <Text style={[styles.modalSubtitle, darkMode && styles.textWhite]} numberOfLines={2}>
              {complaint?.title}
            </Text>
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

      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  backBtn: { flexDirection: 'row', padding: 16 },
  backText: { marginLeft: 8, fontSize: 16, color: '#374151' },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  image: { width: '100%', height: 250 },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' },
  addEvidencePlusButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#9CA3AF',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  description: { color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  bumpButton: { backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#BAE6FD', marginRight: 8 },
  bumpText: { color: '#0284C7', fontWeight: 'bold', fontSize: 12 },
  bumpButtonLarge: { backgroundColor: '#F0F9FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD', alignItems: 'center', marginBottom: 16 },
  bumpTextLarge: { color: '#0284C7', fontWeight: 'bold', fontSize: 16 },
  bumpSubText: { color: '#0EA5E9', fontSize: 12, marginTop: 4 },
  actionText: { fontSize: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: 'white', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  reasonItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  reasonItemActive: { backgroundColor: '#E5E7EB' },
  reasonText: { fontSize: 14, color: '#111827' },
  textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, minHeight: 70, textAlignVertical: 'top', marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: '#F59E0B' },
  submitText: { color: 'white', fontWeight: '700' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stepContainer: { alignItems: 'center', flex: 1 },
  stepText: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  stepTextActive: { color: '#16A34A', fontWeight: 'bold' },
  authorityInfoCard: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8
  },
  authorityInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  authorityInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  authorityInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginLeft: 22
  },
  authorityInfoContact: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 22,
    marginTop: 4
  },
  loaderWrap: { height: 250, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280' },
  errorCard: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  errorCardDark: { backgroundColor: '#7F1D1D', borderColor: '#991B1B' },
  errorText: { color: '#DC2626' },
  retryBtn: { marginTop: 8, backgroundColor: '#EF4444', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: 'bold' },
  appealBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 10, alignItems: 'center' },
  appealBtnText: { color: 'white', fontWeight: 'bold' },
  appealCameraBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 12, borderRadius: 10, marginVertical: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#1E88E5' },
  submitAppealBtn: { backgroundColor: '#1E88E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  evidenceBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  evidenceBadgeText: { color: 'white', fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
});