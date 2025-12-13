import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, FileText, List, User } from 'lucide-react-native';

export default function BottomNav({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.tab}>
        <Home size={24} color="#6B7280" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SubmitComplaint')} style={styles.tab}>
        <FileText size={24} color="#6B7280" />
        <Text style={styles.label}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Feed')} style={styles.tab}>
        <List size={24} color="#6B7280" />
        <Text style={styles.label}>Feed</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.tab}>
        <User size={24} color="#6B7280" />
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingBottom: 24, // Extra padding for iPhone home indicator
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: { alignItems: 'center' },
  label: { fontSize: 10, color: '#6B7280', marginTop: 4 },
});