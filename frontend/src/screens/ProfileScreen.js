import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { User, Edit, LogOut, Moon, Sun } from 'lucide-react-native';

export default function ProfileScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const handleLogout = () => {
    if (onLogout) onLogout();
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>My Profile</Text>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <View style={styles.avatarContainer}><User size={40} color="#1E88E5" /></View>
          <Text style={[styles.name, darkMode && styles.textWhite]}>Alex Johnson</Text>
          <Text style={styles.email}>alex@example.com</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ false: "#767577", true: "#1E88E5" }} />
          </View>

          <TouchableOpacity style={styles.editBtn}>
            <Edit size={16} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Edit Profile</Text>
          </TouchableOpacity>
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
});