import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Home, FileText, List, User } from 'lucide-react-native';

export default function BottomNav({ navigation, darkMode }) {
  let currentRoute = 'HomeScreen';
  try {
    const route = useRoute();
    currentRoute = route.name;
  } catch (e) {}

  const activeColor = '#1E88E5';
  const inactiveColor = darkMode ? '#9CA3AF' : '#6B7280';

  const getColor = (name) => currentRoute === name ? activeColor : inactiveColor;
  const getWeight = (name) => currentRoute === name ? 'bold' : 'normal';

  return (
    <View style={[styles.container, darkMode ? styles.darkContainer : styles.lightContainer]}>
      <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')} style={styles.tab}>
        <Home size={24} color={getColor('HomeScreen')} />
        <Text style={[styles.label, { color: getColor('HomeScreen'), fontWeight: getWeight('HomeScreen') }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('CameraScreen')} style={styles.tab}>
        <FileText size={24} color={getColor('SubmitComplaint')} />
        <Text style={[styles.label, { color: getColor('SubmitComplaint'), fontWeight: getWeight('SubmitComplaint') }]}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Feed')} style={styles.tab}>
        <List size={24} color={getColor('Feed')} />
        <Text style={[styles.label, { color: getColor('Feed'), fontWeight: getWeight('Feed') }]}>Feed</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.tab}>
        <User size={24} color={getColor('Profile')} />
        <Text style={[styles.label, { color: getColor('Profile'), fontWeight: getWeight('Profile') }]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 20, zIndex: 100,
  },
  lightContainer: { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' },
  darkContainer: { backgroundColor: '#1F2937', borderTopColor: '#374151' },
  tab: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  label: { fontSize: 10, marginTop: 4 },
});