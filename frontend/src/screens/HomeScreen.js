import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { FileText, List, CheckCircle, Clock, PlusCircle, TrendingUp } from 'lucide-react-native';

export default function HomeScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const stats = { total: 12, resolved: 8, pending: 3, inProgress: 1 };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.welcome, darkMode && styles.textWhite]}>Welcome back, Alex! 👋</Text>
          <Text style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}>Let's make our city better together</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SubmitComplaint')} style={styles.bigBtn}>
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
           <StatCard icon={FileText} color="#1E88E5" bg="#EFF6FF" value={stats.total} label="Total" darkMode={darkMode} />
           <StatCard icon={CheckCircle} color="#16A34A" bg="#F0FDF4" value={stats.resolved} label="Resolved" darkMode={darkMode} />
           <StatCard icon={Clock} color="#EA580C" bg="#FFF7ED" value={stats.pending} label="Pending" darkMode={darkMode} />
           <StatCard icon={TrendingUp} color="#9333EA" bg="#FAF5FF" value={stats.inProgress} label="In Progress" darkMode={darkMode} />
        </View>
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const StatCard = ({ icon: Icon, color, bg, value, label, darkMode }) => (
  <View style={[styles.statCard, darkMode && styles.cardDark]}>
    <View style={{ backgroundColor: bg, padding: 8, borderRadius: 8, marginBottom: 8, alignSelf: 'flex-start' }}>
      <Icon size={20} color={color} />
    </View>
    <Text style={{ fontSize: 24, fontWeight: 'bold', color: darkMode ? 'white' : '#1F2937' }}>{value}</Text>
    <Text style={{ color: '#6B7280', fontSize: 12 }}>{label}</Text>
  </View>
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
  statCard: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
});