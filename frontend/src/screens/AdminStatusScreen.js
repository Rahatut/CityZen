import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, ShieldAlert, Clock, AlertTriangle, Scale } from 'lucide-react-native';

export default function AdminStatusScreen({ darkMode, onJump }) {
  const departments = [
    { name: 'DWASA', active: 14, resolved: 88, color: '#1E88E5', perf: '92%' },
    { name: 'City Corp', active: 42, resolved: 156, color: '#8B5CF6', perf: '85%' },
    { name: 'DESCO', active: 6, resolved: 44, color: '#F59E0B', perf: '98%' }
  ];

  return (
    <ScrollView contentContainerStyle={styles.padding}>
      <Text style={[styles.title, darkMode && {color: 'white'}]}>Command Center</Text>

      <View style={styles.kpiGrid}>
        <KPIBox icon={Activity} val="99.9%" lab="Uptime" color="#10B981" darkMode={darkMode} />
        <KPIBox icon={Clock} val="3.8h" lab="Avg. Solve" color="#1E88E5" darkMode={darkMode} />
        <KPIBox icon={ShieldAlert} val="12" lab="Pending" color="#EF4444" darkMode={darkMode} />
      </View>

      <Text style={styles.sectionLabel}>Moderation Overview</Text>
      <View style={[styles.summaryCard, darkMode && styles.cardDark]}>
        <TouchableOpacity style={styles.summaryRow} onPress={() => onJump('reported')}>
          <View style={[styles.iconBox, {backgroundColor: '#FEE2E2'}]}><AlertTriangle size={18} color="#EF4444" /></View>
          <View style={{flex: 1, marginLeft: 12}}><Text style={[styles.sumTitle, darkMode && {color: 'white'}]}>Reported Posts</Text><Text style={styles.sumSub}>8 urgent reviews</Text></View>
          <Text style={[styles.sumCount, {color: '#EF4444'}]}>08</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.summaryRow} onPress={() => onJump('appeals')}>
          <View style={[styles.iconBox, {backgroundColor: '#E0E7FF'}]}><Scale size={18} color="#4F46E5" /></View>
          <View style={{flex: 1, marginLeft: 12}}><Text style={[styles.sumTitle, darkMode && {color: 'white'}]}>Citizen Appeals</Text><Text style={styles.sumSub}>4 cases pending</Text></View>
          <Text style={[styles.sumCount, {color: '#4F46E5'}]}>04</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, {marginTop: 20}]}>Dept Performance</Text>
      <View style={[styles.analyticsCard, darkMode && styles.cardDark]}>
        {departments.map(dept => (
          <View key={dept.name} style={styles.deptRow}>
            <View style={{flex: 1}}><Text style={[styles.deptName, darkMode && {color: 'white'}]}>{dept.name}</Text><Text style={styles.deptSub}>{dept.active} Active</Text></View>
            <View style={styles.progressContainer}>
              <Text style={styles.perfText}>{dept.perf}</Text>
              <View style={styles.progressBase}><View style={[styles.progressFill, {backgroundColor: dept.color, width: dept.perf}]} /></View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const KPIBox = ({ icon: Icon, val, lab, color, darkMode }) => (
  <View style={[styles.kpiCard, darkMode && styles.cardDark]}>
    <Icon size={20} color={color} />
    <Text style={[styles.kpiVal, darkMode && {color: 'white'}]}>{val}</Text>
    <Text style={styles.kpiLab}>{lab}</Text>
  </View>
);

const styles = StyleSheet.create({
  padding: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  kpiCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, width: '31%', alignItems: 'center', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1 },
  kpiVal: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  kpiLab: { fontSize: 10, color: '#9CA3AF' },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 },
  summaryCard: { backgroundColor: 'white', borderRadius: 15, padding: 15 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sumTitle: { fontSize: 14, fontWeight: 'bold' },
  sumSub: { fontSize: 11, color: '#9CA3AF' },
  sumCount: { fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  analyticsCard: { backgroundColor: 'white', borderRadius: 15, padding: 16 },
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  deptName: { fontWeight: 'bold', fontSize: 14 },
  deptSub: { fontSize: 11, color: '#9CA3AF' },
  progressContainer: { alignItems: 'flex-end', width: 80 },
  perfText: { fontSize: 11, fontWeight: 'bold', color: '#10B981', marginBottom: 4 },
  progressBase: { height: 4, width: '100%', backgroundColor: '#F3F4F6', borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 }
});