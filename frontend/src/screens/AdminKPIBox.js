import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminKPIBox({ icon: Icon, val, lab, color, darkMode }) {
  return (
    <View style={[styles.kpiCard, darkMode && styles.cardDark]}>
      <Icon size={20} color={color} />
      <Text style={[styles.kpiVal, darkMode && { color: 'white' }]}>{val}</Text>
      <Text style={styles.kpiLab}>{lab}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiCard: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 12, 
    width: '31%', 
    alignItems: 'center', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1 },
  kpiVal: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  kpiLab: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },
});