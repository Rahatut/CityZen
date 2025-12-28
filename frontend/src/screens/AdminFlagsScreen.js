import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Clock, XCircle, Send, Trash2, AlertTriangle } from 'lucide-react-native';

export default function AdminFlagsScreen({ darkMode, defaultTab }) {
  const [subTab, setSubTab] = useState(defaultTab || 'reported');

  useEffect(() => {
    if (defaultTab) setSubTab(defaultTab);
  }, [defaultTab]);

  // Data for Reported Posts
  const [reports, setReports] = useState([
    { id: 'r1', user: 'User 202', reason: 'Graphic Content', target: 'Post #990', time: '5m ago' },
    { id: 'r2', user: 'User 551', reason: 'Hate Speech', target: 'Post #102', time: '40m ago' },
  ]);

  // Data for Appeals (Formerly Fake Resolves)
  const [appeals, setAppeals] = useState([
    { id: 'a1', user: 'User 402', issue: 'Fake Resolution', dept: 'DWASA', ticket: 'REF-88', time: '10m ago', note: 'Technician never arrived but marked as fixed.' },
    { id: 'a2', user: 'User 911', issue: 'Incomplete Fix', dept: 'City Corp', ticket: 'REF-22', time: '1h ago', note: 'Pothole still exists after resolve notice.' },
  ]);

  // --- LOGIC FOR APPEALS ---
  const handleAppealDecision = (item, type) => {
    if (type === 'approve') {
      Alert.alert(
        "Approve Appeal", 
        `Forward Ticket ${item.ticket} to ${item.dept} Authority for re-investigation?`, 
        [
          { text: "Cancel" },
          { text: "Approve & Forward", onPress: () => {
            setAppeals(appeals.filter(a => a.id !== item.id));
            Alert.alert("Forwarded", `Case has been sent to ${item.dept} Management.`);
          }}
        ]
      );
    } else {
      Alert.prompt(
        "Reject Appeal", 
        "Enter reason for rejection (sent to user):", 
        [
          { text: "Cancel" },
          { text: "Reject", style: "destructive", onPress: (reason) => {
            if (!reason) return Alert.alert("Required", "Please provide a reason.");
            setAppeals(appeals.filter(a => a.id !== item.id));
            Alert.alert("Appeal Rejected", `User notified: ${reason}`);
          }}
        ]
      );
    }
  };

  // --- LOGIC FOR REPORTS ---
  const handleReportAction = (item, action) => {
    if (action === 'delete') {
      Alert.alert(
        "Delete Post?",
        `This will permanently remove the post. ${item.user} will receive 1 strike.`,
        [
          { text: "Cancel" },
          { 
            text: "Delete & Strike", 
            style: "destructive", 
            onPress: () => {
              setReports(reports.filter(r => r.id !== item.id));
              Alert.alert("Action Taken", `Post removed. ${item.user} strike count increased.`);
            }
          }
        ]
      );
    } else {
      Alert.alert("Reject Report", "No action will be taken. Dismiss this flag?", [
        { text: "Cancel" },
        { text: "Dismiss", onPress: () => setReports(reports.filter(r => r.id !== item.id)) }
      ]);
    }
  };

  const renderReportItem = ({ item }) => (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <Text style={styles.user}>{item.user}</Text>
        <Text style={styles.time}><Clock size={10} color="#9CA3AF" /> {item.time}</Text>
      </View>
      <View style={styles.reasonBadge}>
        <AlertTriangle size={12} color="#EF4444" />
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>
      <Text style={[styles.mainText, darkMode && {color: 'white'}]}>Target: {item.target}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSec} onPress={() => handleReportAction(item, 'reject')}>
          <XCircle size={16} color="#6B7280" />
          <Text style={styles.btnTextSec}>Reject Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimDelete} onPress={() => handleReportAction(item, 'delete')}>
          <Trash2 size={16} color="white" />
          <Text style={styles.btnTextPrim}>Delete Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAppealItem = ({ item }) => (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <View style={styles.cardHeader}>
        <Text style={styles.user}>{item.user}</Text>
        <Text style={styles.time}><Clock size={10} color="#9CA3AF" /> {item.time}</Text>
      </View>
      <Text style={[styles.mainText, darkMode && {color: 'white'}]}>{item.issue}: {item.dept}</Text>
      <Text style={styles.subNote}>Ticket: {item.ticket} • "{item.note}"</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSec} onPress={() => handleAppealDecision(item, 'reject')}>
          <XCircle size={16} color="#EF4444" />
          <Text style={[styles.btnTextSec, {color: '#EF4444'}]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimForward} onPress={() => handleAppealDecision(item, 'approve')}>
          <Send size={16} color="white" />
          <Text style={styles.btnTextPrim}>Approve & Forward</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, darkMode && {color: 'white'}]}>Moderation Triage</Text>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, subTab === 'reported' && styles.tabActive]} onPress={() => setSubTab('reported')}>
          <Text style={[styles.tabText, subTab === 'reported' && styles.tabTextActive]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, subTab === 'appeals' && styles.tabActive]} onPress={() => setSubTab('appeals')}>
          <Text style={[styles.tabText, subTab === 'appeals' && styles.tabTextActive]}>Appeals</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={subTab === 'reported' ? reports : appeals}
        renderItem={subTab === 'reported' ? renderReportItem : renderAppealItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No items in {subTab} queue.</Text>}
        contentContainerStyle={{paddingBottom: 40}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  tabBar: { flexDirection: 'row', backgroundColor: '#E5E7EB', padding: 4, borderRadius: 12, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontSize: 12, color: '#6B7280', fontWeight: 'bold' },
  tabTextActive: { color: '#1E88E5' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 15, marginBottom: 12, elevation: 2 },
  cardDark: { backgroundColor: '#1F2937' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  user: { color: '#1E88E5', fontWeight: 'bold', fontSize: 13 },
  time: { color: '#9CA3AF', fontSize: 11 },
  reasonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  reasonText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  mainText: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
  subNote: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 15 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnSec: { flex: 0.45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: '#F3F4F6' },
  btnPrimDelete: { flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: '#EF4444' },
  btnPrimForward: { flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: '#1E88E5' },
  btnTextPrim: { color: 'white', fontWeight: 'bold', fontSize: 11, marginLeft: 6 },
  btnTextSec: { color: '#6B7280', fontWeight: 'bold', fontSize: 11, marginLeft: 6 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 30 }
});