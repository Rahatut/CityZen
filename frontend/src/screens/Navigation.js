import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Bell, Moon, Sun, Building2, LogOut } from 'lucide-react-native';

export default function Navigation({ onLogout, darkMode, toggleDarkMode, navigation }) {
  return (
    <View style={[styles.headerContainer, darkMode && styles.darkBg]}>
      <View style={styles.contentRow}>
        {/* Logo */}
        <TouchableOpacity 
          onPress={() => navigation?.navigate('HomeScreen')}
          style={styles.logoContainer}
        >
          <Building2 size={28} color="#1E88E5" />
          <Text style={styles.logoText}>CityZen</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color={darkMode ? '#D1D5DB' : '#374151'} />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleDarkMode} style={styles.iconButton}>
            {darkMode ? <Sun size={24} color="#D1D5DB" /> : <Moon size={24} color="#374151" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.iconButton}>
            <LogOut size={24} color={darkMode ? '#D1D5DB' : '#374151'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, 
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 50,
  },
  darkBg: { backgroundColor: '#1F2937', borderBottomColor: '#374151' },
  contentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#1E88E5' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});