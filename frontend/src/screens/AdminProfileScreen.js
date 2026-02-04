import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ShieldCheck, LogOut, Key, History, Mail, Clock, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAdminNotification } from '../context/NotificationContext';

export default function AdminProfileScreen({ darkMode, onLogout }) {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastLogin, setLastLogin] = useState(null);
  const { testAdminNotification } = useAdminNotification();

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      // Get stored user data
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (userData) {
        setAdminData(userData);
        
        // Try to fetch additional admin stats from backend
        try {
          const response = await api.get(`/auth/profile/${userData.firebaseUid}`);
          if (response.data) {
            setAdminData(response.data);
          }
        } catch (err) {
          console.log('Could not fetch extended profile:', err);
        }

        // Get last login time from AsyncStorage
        const lastLoginTime = await AsyncStorage.getItem('lastLoginTime');
        if (lastLoginTime) {
          setLastLogin(new Date(lastLoginTime));
        } else {
          setLastLogin(new Date());
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastLogin = (date) => {
    if (!date) return 'Unknown';
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today, ${time}` : date.toLocaleDateString() + ` ${time}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, darkMode && {color: 'white'}]}>Admin Control</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><ShieldCheck size={40} color="white" /></View>
        <Text style={styles.name}>{adminData?.fullName || 'Super Admin'}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>ROOT ACCESS</Text></View>
      </View>
      <View style={[styles.infoCard, darkMode && styles.cardDark]}>
        <InfoLine 
          icon={Mail} 
          lab="Email" 
          val={adminData?.email || 'admin@cityzen.local'} 
          darkMode={darkMode} 
        />
        <InfoLine 
          icon={Key} 
          lab="Role" 
          val={adminData?.role?.toUpperCase() || 'ADMIN'} 
          darkMode={darkMode} 
        />
        <InfoLine 
          icon={Clock} 
          lab="Member Since" 
          val={adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : 'Recently'} 
          darkMode={darkMode} 
        />
        <InfoLine 
          icon={History} 
          lab="Last Login" 
          val={formatLastLogin(lastLogin)} 
          darkMode={darkMode} 
        />
      </View>
      
      {/* Test Notification Button */}
      <TouchableOpacity 
        style={[styles.testBtn, darkMode && styles.testBtnDark]} 
        onPress={() => {
          console.log('Test button pressed');
          testAdminNotification();
        }}
      >
        <Bell size={20} color="#1E88E5" />
        <Text style={[styles.testBtnText, darkMode && styles.testBtnTextDark]}>
          Test Admin Notification
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <LogOut size={20} color="white" /><Text style={styles.logoutText}>Terminate Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const InfoLine = ({ icon: Icon, lab, val, darkMode }) => (
  <View style={styles.infoLine}>
    <Icon size={16} color="#9CA3AF" />
    <View style={{marginLeft: 12, flex: 1}}>
      <Text style={styles.infoLab}>{lab}</Text>
      <Text style={[styles.infoVal, darkMode && {color: 'white'}, styles.ellipsisText]} numberOfLines={1}>{val}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  profileCard: { backgroundColor: '#1E88E5', padding: 30, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  name: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  badge: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  badgeText: { color: '#1E88E5', fontSize: 10, fontWeight: 'bold' },
  infoCard: { backgroundColor: 'white', padding: 20, borderRadius: 20 },
  cardDark: { backgroundColor: '#1F2937' },
  infoLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoLab: { fontSize: 10, color: '#9CA3AF' },
  infoVal: { fontSize: 14, fontWeight: '600' },
  ellipsisText: { maxWidth: '90%' },
  testBtn: { 
    backgroundColor: '#EFF6FF', 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#1E88E5',
  },
  testBtnDark: {
    backgroundColor: '#1F2937',
    borderColor: '#3B82F6',
  },
  testBtnText: { 
    color: '#1E88E5', 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  testBtnTextDark: {
    color: '#3B82F6',
  },
  logoutBtn: { backgroundColor: '#EF4444', flexDirection: 'row', padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 30 },
  logoutText: { color: 'white', fontWeight: 'bold', marginLeft: 10 }
});