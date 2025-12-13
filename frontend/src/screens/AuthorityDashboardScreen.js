import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Navigation from '../components/Navigation';
import { FileText, TrendingUp } from 'lucide-react-native';

export default function AuthorityDashboardScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const stats = { assigned: 15, inProgress: 6 };
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Authority Dashboard</Text>
        <View style={styles.grid}>
          <View style={[styles.card, darkMode && styles.cardDark, { width: '48%' }]}>
             <FileText size={24} color="#1E88E5" />
             <Text style={[styles.statNum, darkMode && styles.textWhite]}>{stats.assigned}</Text>
             <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={[styles.card, darkMode && styles.cardDark, { width: '48%' }]}>
             <TrendingUp size={24} color="#EA580C" />
             <Text style={[styles.statNum, darkMode && styles.textWhite]}>{stats.inProgress}</Text>
             <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  textWhite: { color: 'white' },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  statLabel: { color: '#6B7280' },
});