import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminDeptRow({ name, active, resolved, color, perf, darkMode }) {
  return (
    <View style={styles.deptRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.deptName, darkMode && { color: 'white' }]}>{name}</Text>
        <Text style={styles.deptSub}>{active} Active • {resolved} Resolved</Text>
      </View>
      <View style={styles.progressContainer}>
        <Text style={[styles.perfText, { color: color }]}>{perf}</Text>
        <View style={[styles.progressBase, darkMode && { backgroundColor: '#374151' }]}>
          <View style={[styles.progressFill, { backgroundColor: color, width: perf }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  deptName: { fontWeight: 'bold', fontSize: 14 },
  deptSub: { fontSize: 11, color: '#9CA3AF' },
  progressContainer: { alignItems: 'flex-end', width: 80 },
  perfText: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  progressBase: { height: 4, width: '100%', backgroundColor: '#F3F4F6', borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 }
});