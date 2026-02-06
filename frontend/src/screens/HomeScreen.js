import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { FileText, List, CheckCircle, Clock, PlusCircle, TrendingUp, AlertCircle } from 'lucide-react-native';
import api from '../services/api';

export default function HomeScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0, appealed: 0, rejected: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Citizen');

  const fetchData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.name || userData.username || 'Citizen');
        // DEBUG LOGGING
        console.log("HomeScreen Loaded UserData:", JSON.stringify(userData, null, 2));

        // CRITICAL FIX: The backend Complaint model expects citizenUid to be a STRING (likely the Firebase UID).
        // userData from login usually contains { id: 1, firebaseUid: 'abc...', ... }
        // We MUST prioritize firebaseUid.
        let uid = userData.firebaseUid;

        // Fallback: If firebaseUid is missing, maybe 'uid' is the field (some auth providers use 'uid')
        if (!uid && userData.uid && typeof userData.uid === 'string') {
          uid = userData.uid;
        }

        // Last resort: standard id (though this is likely the int PK and might be wrong for citizenUid column)
        if (!uid) {
          uid = userData.id || userData.uid;
        }

        console.log("HomeScreen Fetching complaints for UID:", uid);

        if (uid) {
          // Fetch user specific complaints
          const response = await api.get(`/api/complaints/citizen/${uid}`);
          console.log("HomeScreen API Response Complaints Count:", response.data.complaints?.length);
          const complaints = response.data.complaints || [];

          // Calculate KPIs
          const total = complaints.length;
          const resolved = complaints.filter(c => ['resolved', 'closed', 'completed'].includes(c.currentStatus)).length;
          const pending = complaints.filter(c => c.currentStatus === 'pending').length;
          const inProgress = complaints.filter(c => ['in_progress', 'accepted', 'assigned'].includes(c.currentStatus)).length;
          const appealed = complaints.filter(c => c.currentStatus === 'appealed').length;
          const rejected = complaints.filter(c => c.currentStatus === 'rejected').length;

          setStats({ total, resolved, pending, inProgress, appealed, rejected });

          // Get recent activity (top 3)
          setRecentActivity(complaints.slice(0, 3));
        }
      }
    } catch (error) {
      console.error("Failed to fetch home data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const StatusIcon = ({ status }) => {
    if (['resolved', 'closed', 'completed'].includes(status)) return <CheckCircle size={20} color="#16A34A" />;
    if (status === 'pending') return <Clock size={20} color="#EA580C" />;
    if (['in_progress', 'accepted'].includes(status)) return <TrendingUp size={20} color="#1E88E5" />;
    return <AlertCircle size={20} color="#6B7280" />;
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.welcome, darkMode && styles.textWhite]}>Welcome back, {userName}! 👋</Text>
          <Text style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}>Let's make our city better together</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Camera')} style={styles.bigBtn}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
            <PlusCircle size={32} color="white" />
          </View>
          <View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Submit Complaint</Text>
            <Text style={{ color: '#BFDBFE', fontSize: 14 }}>Report a new issue</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Feed')} style={[styles.smallCard, darkMode && styles.cardDark]}>
            <List size={28} color="#1E88E5" style={{ marginBottom: 8 }} />
            <Text style={[styles.cardText, darkMode && styles.textWhite]}>View Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={[styles.smallCard, darkMode && styles.cardDark]}>
            <FileText size={28} color="#16A34A" style={{ marginBottom: 8 }} />
            <Text style={[styles.cardText, darkMode && styles.textWhite]}>My Activity</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Overview</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
          <StatCard icon={FileText} color="#1E88E5" bg="#EFF6FF" value={stats.total} label="Total" darkMode={darkMode} onPress={() => navigation.navigate('UserComplaintList', { title: 'All Complaints' })} />
          <StatCard icon={CheckCircle} color="#16A34A" bg="#F0FDF4" value={stats.resolved} label="Resolved" darkMode={darkMode} onPress={() => navigation.navigate('UserComplaintList', { statusFilter: 'resolved', title: 'Resolved Complaints' })} />
          <StatCard icon={Clock} color="#EA580C" bg="#FFF7ED" value={stats.pending} label="Pending" darkMode={darkMode} onPress={() => navigation.navigate('UserComplaintList', { statusFilter: 'pending', title: 'Pending Complaints' })} />
          <StatCard icon={TrendingUp} color="#1E88E5" bg="#E0F2FE" value={stats.inProgress} label="In Progress" darkMode={darkMode} onPress={() => navigation.navigate('UserComplaintList', { statusFilter: 'in_progress', title: 'In Progress' })} />
          <StatCard icon={AlertCircle} color="#9333EA" bg="#FAF5FF" value={stats.appealed} label="Appeals" darkMode={darkMode} onPress={() => navigation.navigate('UserComplaintList', { statusFilter: 'appealed', title: 'Your Appeals' })} />
          <StatCard icon={AlertCircle} color="#EF4444" bg="#FEF2F2" value={stats.rejected} label="Rejected" darkMode={darkMode} onPress={() => navigation.navigate('UserComplaintList', { statusFilter: 'rejected', title: 'Rejected Issues' })} />
        </View>

        <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map(complaint => (
            <TouchableOpacity
              key={complaint.id}
              style={[styles.activityCard, darkMode && styles.cardDark]}
              onPress={() => navigation.navigate('ComplaintDetails', { complaintId: complaint.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <StatusIcon status={complaint.currentStatus} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityTitle, darkMode && styles.textWhite]} numberOfLines={1}>{complaint.title}</Text>
                    <Text style={styles.activityDate}>{new Date(complaint.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: ['resolved', 'closed'].includes(complaint.currentStatus) ? '#D1FAE5' : (complaint.currentStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7') }]}>
                  <Text style={[styles.statusText, { color: ['resolved', 'closed'].includes(complaint.currentStatus) ? '#065F46' : (complaint.currentStatus === 'rejected' ? '#991B1B' : '#92400E') }]}>
                    {complaint.currentStatus.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: '#6B7280', fontStyle: 'italic' }}>No recent activity to show.</Text>
        )}

      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const StatCard = ({ icon: Icon, color, bg, value, label, darkMode, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.statCard, darkMode && styles.cardDark]}>
    <View style={{ backgroundColor: bg, padding: 8, borderRadius: 8, marginBottom: 8, alignSelf: 'flex-start' }}>
      <Icon size={20} color={color} />
    </View>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: darkMode ? 'white' : '#1F2937' }}>{value}</Text>
    <Text style={{ color: '#6B7280', fontSize: 12 }}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  textWhite: { color: 'white' },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  bigBtn: { backgroundColor: '#1E88E5', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, elevation: 5 },
  smallCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  cardText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  statCard: { width: '31%', backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, alignItems: 'center' },

  // Recent Activity
  activityCard: { backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  activityTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  activityDate: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' }
});