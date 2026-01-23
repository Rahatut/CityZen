import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Clock, XCircle, Send, Trash2, AlertTriangle } from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminFlagsScreen({ darkMode, defaultTab }) {
  const [subTab, setSubTab] = useState(defaultTab || 'reported');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (defaultTab) setSubTab(defaultTab);
  }, [defaultTab]);

  // Data for Reported Posts
  const [reports, setReports] = useState([]);

  // Fetch reports from API
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('Fetching reports from:', `${API_URL}/api/complaints/reports`);
      const response = await axios.get(`${API_URL}/api/complaints/reports?status=pending`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        timeout: 10000,
      });
      console.log('Reports response:', response.data);
      if (response.data && response.data.reports) {
        const formattedReports = response.data.reports.map(r => ({
          id: r.id,
          complaintId: r.complaintId,
          user: `User ${r.reportedBy.slice(0, 6)}`,
          reason: formatReason(r.reason),
          target: `Complaint #${r.complaintId}`,
          time: formatTime(r.createdAt),
          description: r.description,
          complaint: r.Complaint
        }));
        setReports(formattedReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error.message);
      console.error('Full error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        Alert.alert('Error', `Failed to load reports: ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        console.error('No response received');
        Alert.alert('Error', 'Backend server is not responding. Make sure it\'s running.');
      } else {
        Alert.alert('Error', 'Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatReason = (reason) => {
    const reasonMap = {
      'harassment_threats': 'Harassment & Threats',
      'hate_speech_discrimination': 'Hate Speech',
      'nudity_sexual_content': 'Nudity/Sexual Content',
      'spam_scams': 'Spam/Scams',
      'fake_information_misinformation': 'Misinformation',
      'self_harm_suicide': 'Self-Harm',
      'violence_graphic_content': 'Graphic Content',
      'intellectual_property': 'IP Violation',
      'impersonation_fake_accounts': 'Impersonation',
      'child_safety': 'Child Safety',
      'other_violations': 'Other Violation'
    };
    return reasonMap[reason] || reason;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
  const handleReportAction = async (item, action) => {
    if (action === 'delete') {
      Alert.alert(
        "Delete Post?",
        `This will permanently remove the complaint. ${item.user} will receive 1 strike.`,
        [
          { text: "Cancel" },
          { 
            text: "Delete & Strike", 
            style: "destructive", 
            onPress: async () => {
              try {
                // Delete the complaint from backend
                await axios.delete(`${API_URL}/api/complaints/${item.complaintId}`, {
                  data: { citizenUid: 'admin' }, // Admin override
                  headers: { 'bypass-tunnel-reminder': 'true' },
                });
                
                // Remove from local state
                setReports(reports.filter(r => r.id !== item.id));
                Alert.alert("Action Taken", `Complaint deleted. ${item.user} strike count increased.`);
              } catch (error) {
                console.error('Delete error:', error);
                Alert.alert('Error', 'Failed to delete complaint: ' + (error.response?.data?.message || error.message));
              }
            }
          }
        ]
      );
    } else {
      Alert.alert("Reject Report", "No action will be taken. Dismiss this flag?", [
        { text: "Cancel" },
        { 
          text: "Dismiss", 
          onPress: async () => {
            try {
              // Update report status to dismissed
              await axios.patch(`${API_URL}/api/complaints/reports/${item.id}`, 
                { status: 'dismissed' },
                { headers: { 'bypass-tunnel-reminder': 'true' } }
              );
              
              // Remove from local state
              setReports(reports.filter(r => r.id !== item.id));
            } catch (error) {
              console.error('Dismiss error:', error);
              Alert.alert('Error', 'Failed to dismiss report: ' + (error.response?.data?.message || error.message));
            }
          }
        }
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
      <Text style={[styles.mainText, darkMode && {color: 'white'}]}>Complaint #{item.complaintId}: {item.complaint?.title || 'N/A'}</Text>
      {item.description && (
        <Text style={[styles.subNote, { marginTop: 4 }]}>Details: {item.description}</Text>
      )}
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

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={[styles.subNote, { marginTop: 12 }]}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList 
          data={subTab === 'reported' ? reports : appeals}
          renderItem={subTab === 'reported' ? renderReportItem : renderAppealItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No items in {subTab} queue.</Text>}
          contentContainerStyle={{paddingBottom: 40}}
        />
      )}
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