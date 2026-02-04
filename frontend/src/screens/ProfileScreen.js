import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { User, Edit, LogOut, Moon, Sun, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ProfileScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const [userData, setUserData] = useState({
    fullName: 'Loading...',
    email: 'Loading...',
    uid: null
  });
  const [strikeInfo, setStrikeInfo] = useState({
    strikes: 0,
    isBanned: false,
    loading: true
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      console.log('Raw userData from AsyncStorage:', userDataStr);
      
      if (userDataStr) {
        const data = JSON.parse(userDataStr);
        console.log('Parsed user data:', data);
        console.log('UID found:', data.uid || data.userId || data.firebaseUid);
        
        const userId = data.uid || data.userId || data.firebaseUid;
        
        setUserData({
          fullName: data.fullName || data.name || data.username || 'User',
          email: data.email || 'No email available',
          uid: userId
        });
        
        // Fetch strike information if user ID exists
        if (userId) {
          console.log('Calling fetchStrikeInfo with UID:', userId);
          fetchStrikeInfo(userId);
        } else {
          console.log('ERROR: No user ID found in userData');
          setStrikeInfo({
            strikes: 0,
            isBanned: false,
            loading: false
          });
        }
      } else {
        console.log('No userData found in AsyncStorage');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setStrikeInfo({
        strikes: 0,
        isBanned: false,
        loading: false
      });
    }
  };

  const fetchStrikeInfo = async (uid) => {
    try {
      console.log('=== FETCHING STRIKE INFO ===');
      console.log('UID:', uid);
      console.log('API_URL:', API_URL);
      console.log('Full URL:', `${API_URL}/api/moderation/my-strikes/${uid}`);
      
      const response = await axios.get(`${API_URL}/api/moderation/my-strikes/${uid}`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        timeout: 8000,
      });
      
      console.log('Strike info response status:', response.status);
      console.log('Strike info received:', response.data);
      setStrikeInfo({
        strikes: response.data.strikes || 0,
        isBanned: response.data.isBanned || false,
        banReason: response.data.banReason,
        loading: false
      });
    } catch (error) {
      console.error('=== ERROR FETCHING STRIKE INFO ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', error);
      // Set default values on error instead of staying in loading state
      setStrikeInfo({
        strikes: 0,
        isBanned: false,
        loading: false
      });
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>My Profile</Text>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <View style={styles.avatarContainer}><User size={40} color="#1E88E5" /></View>
          <Text style={[styles.name, darkMode && styles.textWhite]}>{userData.fullName}</Text>
          <Text style={styles.email}>{userData.email}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ false: "#767577", true: "#1E88E5" }} />
          </View>

          <TouchableOpacity style={styles.editBtn}>
            <Edit size={16} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Strike Information Card */}
        <View style={[styles.strikeCard, darkMode && styles.strikeCardDark]}>
          {strikeInfo.loading ? (
            <ActivityIndicator size="small" color="#1E88E5" />
          ) : (
            <>
              {strikeInfo.isBanned ? (
                <View style={styles.bannedContainer}>
                  <ShieldAlert size={24} color="#DC2626" />
                  <Text style={styles.bannedText}>Account Banned</Text>
                  <Text style={styles.bannedReason}>{strikeInfo.banReason || 'Multiple policy violations'}</Text>
                </View>
              ) : (
                <View style={styles.strikeRow}>
                  <Text style={[styles.strikeLabel, darkMode && styles.textGray]}>Strikes</Text>
                  <Text style={[styles.strikeNumber, darkMode && styles.textWhite]}>
                    {strikeInfo.strikes}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontWeight: 'bold', marginLeft: 8 }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1F2937' },
  textWhite: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  email: { color: '#6B7280', marginBottom: 16 },
  infoRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 16, color: '#6B7280' },
  editBtn: { flexDirection: 'row', backgroundColor: '#1E88E5', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  logoutBtn: { flexDirection: 'row', marginTop: 24, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12 },
  
  // Strike Information Styles
  strikeCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    marginTop: 16,
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    elevation: 2 
  },
  strikeCardDark: { 
    backgroundColor: '#1F2937', 
    borderColor: '#374151' 
  },
  strikeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  strikeLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500'
  },
  strikeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  textGray: { 
    color: '#9CA3AF' 
  },
  bannedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginLeft: 8
  },
  bannedReason: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8
  }
});