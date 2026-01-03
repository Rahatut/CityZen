import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { Search, MapPin, Heart, AlertCircle } from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function FeedScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch complaints from API
  const fetchComplaints = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/complaints?page=1&limit=50`, {
        headers: {
          'bypass-tunnel-reminder': 'true'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data && response.data.complaints) {
        setComplaints(response.data.complaints);
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
  }, [fetchComplaints]);

  // Refresh when navigating back from submit
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshing(true);
      fetchComplaints();
    });

    return unsubscribe;
  }, [navigation, fetchComplaints]);

  // Filter complaints by search query
  const filteredComplaints = complaints.filter(complaint =>
    complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Complaints Feed</Text>
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
            style={[styles.card, darkMode && styles.cardDark]} 
            onPress={() => navigation.navigate('ComplaintDetails', { id: item.id })}
          >
            {item.images && item.images.length > 0 && (
              <Image source={{ uri: item.images[0].imageURL }} style={styles.cardImage} />
            )}
            <View style={[styles.statusBadge, { backgroundColor: item.currentStatus === 'pending' ? '#FEE2E2' : '#FFEDD5' }]}>
              <Text style={{ color: item.currentStatus === 'pending' ? '#B91C1C' : '#C2410C', fontSize: 10, fontWeight: 'bold' }}>
                {item.currentStatus?.charAt(0).toUpperCase() + item.currentStatus?.slice(1) || 'Pending'}
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
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <Heart size={14} color="#6B7280" />
                  <Text style={styles.cardMeta}>{item.images?.length || 0} photos</Text>
                </View>
                <Text style={styles.cardMeta}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
  textWhite: { color: 'white' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  darkInput: { backgroundColor: '#1F2937', borderColor: '#374151' },
  input: { marginLeft: 8, flex: 1, fontSize: 16 },
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
  retryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});