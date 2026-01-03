import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { MapPin, Calendar, Heart, ArrowLeft, CheckCircle, Circle } from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ComplaintDetailsScreen({ route, navigation, onLogout, darkMode, toggleDarkMode }) {
  const { id } = route.params || {};
  const [upvotes, setUpvotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  // Map backend status to timeline steps
  const steps = ['Submitted', 'Accepted', 'In Progress', 'Resolved'];
  const statusToStepIndex = {
    pending: 0,
    in_progress: 2,
    resolved: 3,
    closed: 3,
    rejected: 0,
  };
  const currentStep = statusToStepIndex[(complaint?.currentStatus || 'pending')] ?? 0;

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!id) {
        setError('No complaint ID provided');
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const response = await axios.get(`${API_URL}/api/complaints/${id}`, {
          headers: { 'bypass-tunnel-reminder': 'true' },
          timeout: 10000,
        });
        setComplaint(response.data);
      } catch (err) {
        console.error('Error fetching complaint:', err);
        let message = 'Failed to load complaint details';
        if (err.code === 'ECONNABORTED') message = 'Network timeout. Please check your connection.';
        else if (err.message === 'Network Error') message = 'Network error. Please check your connection.';
        else if (err.response?.status === 404) message = 'Complaint not found.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id, retryTick]);

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
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); setRetryTick((t) => t + 1); }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Image source={{ uri: (complaint?.images?.[0]?.imageURL) || 'https://via.placeholder.com/1200x800?text=No+Image' }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.content}>
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.title, darkMode && styles.textWhite]}>{complaint?.title || 'Untitled Complaint'}</Text>
            <View style={[styles.badge, { backgroundColor: (complaint?.currentStatus === 'pending' ? '#FEE2E2' : '#FFEDD5'), alignSelf: 'flex-start', marginBottom: 16 }]}>
               <Text style={{ color: (complaint?.currentStatus === 'pending' ? '#B91C1C' : '#C2410C'), fontWeight: 'bold' }}>
                 {(complaint?.currentStatus || 'pending').replace('_',' ').replace(/^./, s => s.toUpperCase())}
               </Text>
            </View>
            <Text style={[styles.description, darkMode && styles.textGray]}>{complaint?.description || 'No description provided.'}</Text>
            <TouchableOpacity onPress={() => setUpvotes(p => p + 1)} style={[styles.upvoteBtn, darkMode && styles.upvoteBtnDark]}>
              <Heart size={20} color={darkMode ? 'white' : 'black'} />
              <Text style={[styles.upvoteText, darkMode && styles.textWhite]}>Upvote ({upvotes})</Text>
            </TouchableOpacity>
          </View>

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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  description: { color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  upvoteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stepContainer: { alignItems: 'center', flex: 1 },
  stepText: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  stepTextActive: { color: '#16A34A', fontWeight: 'bold' },
  loaderWrap: { height: 250, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280' },
  errorCard: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  errorCardDark: { backgroundColor: '#7F1D1D', borderColor: '#991B1B' },
  errorText: { color: '#DC2626' },
  retryBtn: { marginTop: 8, backgroundColor: '#EF4444', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: 'bold' },
});