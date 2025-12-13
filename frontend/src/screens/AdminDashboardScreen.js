import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Navigation from '../components/Navigation';
import { Users, Shield } from 'lucide-react-native';

export default function AdminDashboardScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Admin Dashboard</Text>
        <View style={styles.grid}>
          <View style={[styles.card, darkMode && styles.cardDark]}>
             <Users size={24} color="#1E88E5" />
             <Text style={[styles.stat, darkMode && styles.textWhite]}>1,247 Users</Text>
          </View>
          <View style={[styles.card, darkMode && styles.cardDark]}>
             <Shield size={24} color="#16A34A" />
             <Text style={[styles.stat, darkMode && styles.textWhite]}>856 Complaints</Text>
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
  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  card: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  stat: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
});