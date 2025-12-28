import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ShieldCheck, LogOut, Key, History } from 'lucide-react-native';

export default function AdminProfileScreen({ darkMode, onLogout }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, darkMode && {color: 'white'}]}>Admin Control</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><ShieldCheck size={40} color="white" /></View>
        <Text style={styles.name}>Super Admin</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>ROOT ACCESS</Text></View>
      </View>
      <View style={[styles.infoCard, darkMode && styles.cardDark]}>
        <InfoLine icon={Key} lab="Access" val="Encrypted AES-256" darkMode={darkMode} />
        <InfoLine icon={History} lab="Last Login" val="Today, 09:42 AM" darkMode={darkMode} />
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <LogOut size={20} color="white" /><Text style={styles.logoutText}>Terminate Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const InfoLine = ({ icon: Icon, lab, val, darkMode }) => (
  <View style={styles.infoLine}>
    <Icon size={16} color="#9CA3AF" />
    <View style={{marginLeft: 12}}><Text style={styles.infoLab}>{lab}</Text><Text style={[styles.infoVal, darkMode && {color: 'white'}]}>{val}</Text></View>
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
  logoutBtn: { backgroundColor: '#EF4444', flexDirection: 'row', padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  logoutText: { color: 'white', fontWeight: 'bold', marginLeft: 10 }
});