import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { Search, MapPin, Heart, AlertCircle } from 'lucide-react-native';
import axios from 'axios';
import api from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function FeedScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);

  // Fetch complaints from API
  const fetchComplaints = useCallback(async () => {
    try {
      setError(null);
      let url = `${API_URL}/api/complaints?page=1&limit=50`;

      // Get user ID for upvote persistence check
      const jsonValue = await AsyncStorage.getItem('userData');
      const retrievedUserData = jsonValue != null ? JSON.parse(jsonValue) : null;
      setUserData(retrievedUserData);

      if (retrievedUserData && retrievedUserData.firebaseUid) {
        url += `&citizenUid=${retrievedUserData.firebaseUid}`;
      }

      const response = await axios.get(url, {
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
              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.row}
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
                        // Already upvoted or bad request
                        console.log('Upvote prevented:', e.response.data.message);
                        Alert.alert('Info', 'You have already upvoted this complaint.');
                      } else {
                        console.error('Upvote failed', e);
                      }
                    }
                  }}
                >
                  <Heart size={16} color={item.upvotes > 0 ? "#EF4444" : "#6B7280"} fill={item.hasUpvoted ? "#EF4444" : "none"} />
                  <Text style={[styles.cardMeta, { marginLeft: 4, color: item.upvotes > 0 ? "#EF4444" : "#6B7280" }]}>
                    {item.upvotes || 0} upvotes
                  </Text>
                </TouchableOpacity>
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