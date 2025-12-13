import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { FileText, List, CheckCircle, Clock, AlertCircle, PlusCircle, TrendingUp } from 'lucide-react-native';

export default function Home({ onLogout, darkMode, toggleDarkMode, navigation }) {
  const userName = 'Alex';
  const stats = { total: 12, resolved: 8, pending: 3, inProgress: 1 };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.welcomeText, darkMode && styles.textWhite]}>Welcome back, {userName}! 👋</Text>
          <Text style={darkMode ? styles.subTextDark : styles.subText}>Let's make our city better together</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity onPress={() => navigation?.navigate('SubmitComplaint')} style={styles.mainActionBtn}>
            <View style={styles.actionContent}>
              <View style={styles.iconBoxWhite}>
                <PlusCircle size={32} color="white" />
              </View>
              <View>
                <Text style={styles.mainActionTitle}>Submit Complaint</Text>
                <Text style={styles.mainActionSub}>Report a new issue</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.rowGap}>
            <TouchableOpacity onPress={() => navigation?.navigate('Feed')} style={[styles.smallCard, darkMode && styles.cardDark]}>
              <View style={styles.iconBoxBlue}>
                <List size={28} color="#1E88E5" />
              </View>
              <Text style={[styles.cardText, darkMode && styles.textWhite]}>View Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation?.navigate('Profile')} style={[styles.smallCard, darkMode && styles.cardDark]}>
              <View style={styles.iconBoxGreen}>
                <FileText size={28} color="#16A34A" />
              </View>
              <Text style={[styles.cardText, darkMode && styles.textWhite]}>My Activity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview */}
        <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Overview</Text>
        <View style={styles.statsGrid}>
           <StatCard icon={FileText} color="#1E88E5" bg="#EFF6FF" value={stats.total} label="Total" darkMode={darkMode} />
           <StatCard icon={CheckCircle} color="#16A34A" bg="#F0FDF4" value={stats.resolved} label="Resolved" darkMode={darkMode} />
           <StatCard icon={Clock} color="#EA580C" bg="#FFF7ED" value={stats.pending} label="Pending" darkMode={darkMode} />
           <StatCard icon={TrendingUp} color="#9333EA" bg="#FAF5FF" value={stats.inProgress} label="In Progress" darkMode={darkMode} />
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}

// Helper Component for Stats
const StatCard = ({ icon: Icon, color, bg, value, label, darkMode }) => (
  <View style={[styles.statCard, darkMode && styles.cardDark]}>
    <View style={[styles.statIconBox, { backgroundColor: bg }, darkMode && styles.iconBoxDark]}>
      <Icon size={20} color={color} />
    </View>
    <Text style={[styles.statValue, darkMode && styles.textWhite]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 24 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  textWhite: { color: '#FFFFFF' },
  subText: { color: '#6B7280', fontSize: 16 },
  subTextDark: { color: '#9CA3AF' },
  actionsGrid: { gap: 16, marginBottom: 24 },
  mainActionBtn: { backgroundColor: '#1E88E5', borderRadius: 16, padding: 20, shadowColor: '#1E88E5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBoxWhite: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  mainActionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  mainActionSub: { color: '#BFDBFE', fontSize: 14 },
  rowGap: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  iconBoxBlue: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, marginBottom: 8 },
  iconBoxGreen: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, marginBottom: 8 },
  cardText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  statIconBox: { alignSelf: 'flex-start', padding: 8, borderRadius: 8, marginBottom: 8 },
  iconBoxDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { color: '#6B7280', fontSize: 14 },
});