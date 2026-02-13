import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Clock, XCircle, Send, Trash2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AdminFlagsScreen({ darkMode, defaultTab, navigation }) {
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

  const { useFocusEffect } = require('@react-navigation/native');
  useFocusEffect(
    React.useCallback(() => {
      fetchReports();
    }, [])
  );

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
          citizenUid: r.Complaint?.citizenUid || 'unknown',
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

  // Get user moderation info (strikes, ban status)
  const getUserModerationInfo = async (citizenUid) => {
    // Check cache first
    if (userModerationCache[citizenUid]) {
      return userModerationCache[citizenUid];
    }

    try {
      const response = await axios.get(`${API_URL}/api/moderation/user/${citizenUid}`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        timeout: 5000,
      });

      const info = {
        strikes: response.data.strikes || 0,
        isBanned: response.data.isBanned || false,
        bannedAt: response.data.bannedAt,
        banReason: response.data.banReason
      };

      // Update cache
      setUserModerationCache(prev => ({ ...prev, [citizenUid]: info }));
      return info;
    } catch (error) {
      console.error('Error fetching user moderation info:', error.message);
      return { strikes: 0, isBanned: false };
    }
  };

  // Data for Appeals (Formerly Fake Resolves)
  const [appeals, setAppeals] = useState([]);

  // Data for Forwarded Appeals (tracking approved appeals)
  const [forwardedAppeals, setForwardedAppeals] = useState([]);

  // User moderation info cache (uid -> {strikes, isBanned})
  const [userModerationCache, setUserModerationCache] = useState({});

  // Fetch appeals from API
  useEffect(() => {
    if (subTab === 'appeals') {
      fetchAppeals();
    } else if (subTab === 'forwarded') {
      fetchForwardedAppeals();
    }
  }, [subTab]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      console.log('Fetching appeals from:', `${API_URL}/api/complaints/appeals`);
      const response = await axios.get(`${API_URL}/api/complaints/appeals?status=pending`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        timeout: 10000,
      });
      console.log('Appeals response:', response.data);
      if (response.data && response.data.appeals) {
        const formattedAppeals = response.data.appeals.map(a => ({
          id: a.id,
          complaintId: a.id,
          citizenUid: a.citizenUid,
          user: `Citizen ${a.citizenUid.slice(0, 6)}`,
          title: a.title,
          description: a.description,
          appealReason: a.appealReason,
          categoryName: a.Category?.name || 'Unknown',
          time: formatTime(a.updatedAt),
          currentStatus: a.currentStatus
        }));
        setAppeals(formattedAppeals);
      }
    } catch (error) {
      console.error('Error fetching appeals:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        Alert.alert('Error', `Failed to load appeals: ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        console.error('No response received');
        Alert.alert('Error', 'Backend server is not responding. Make sure it\'s running.');
      } else {
        Alert.alert('Error', 'Failed to load appeals');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch forwarded appeals (approved appeals sent back to authorities)
  const fetchForwardedAppeals = async () => {
    try {
      setLoading(true);
      console.log('Fetching forwarded appeals...');
      // Fetch all complaints that were forwarded by admin
      const response = await axios.get(`${API_URL}/api/complaints?limit=100`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
        timeout: 10000,
      });

      if (response.data && response.data.complaints) {
        // Filter for complaints that were forwarded by admin
        const forwarded = response.data.complaints
          .filter(c => c.forwardedByAdmin === true && c.appealStatus === 'approved')
          .map(c => ({
            id: c.id,
            complaintId: c.id,
            title: c.title,
            categoryName: c.Category?.name || 'Unknown',
            currentStatus: c.currentStatus,
            adminRemarks: c.adminRemarks,
            statusNotes: c.statusNotes,
            time: formatTime(c.updatedAt),
            forwardedAt: formatTime(c.updatedAt),
            user: `Citizen ${c.citizenUid?.slice(0, 6)}` || 'Unknown'
          }));
        console.log('Forwarded appeals found:', forwarded.length);
        setForwardedAppeals(forwarded);
      }
    } catch (error) {
      console.error('Error fetching forwarded appeals:', error.message);
      Alert.alert('Error', 'Failed to load forwarded appeals');
    } finally {
      setLoading(false);
    }
  };

  // Ban a user permanently
  const banUser = async (citizenUid, strikeCount) => {
    try {
      await axios.post(`${API_URL}/api/moderation/ban`, {
        citizenUid,
        reason: `Accumulated ${strikeCount} strikes for policy violations`
      }, {
        headers: { 'bypass-tunnel-reminder': 'true' },
      });

      // Clear cache
      setUserModerationCache(prev => {
        const newCache = { ...prev };
        delete newCache[citizenUid];
        return newCache;
      });

      Alert.alert("User Banned", "The user has been permanently banned from the platform.");
    } catch (error) {
      console.error('Ban error:', error);
      Alert.alert('Error', 'Failed to ban user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Unban a user
  const unbanUser = async (citizenUid) => {
    try {
      await axios.post(`${API_URL}/api/moderation/unban`, {
        citizenUid
      }, {
        headers: { 'bypass-tunnel-reminder': 'true' },
      });

      // Clear cache
      setUserModerationCache(prev => {
        const newCache = { ...prev };
        delete newCache[citizenUid];
        return newCache;
      });

      Alert.alert("User Unbanned", "The user has been unbanned and can now access the platform.");
    } catch (error) {
      console.error('Unban error:', error);
      Alert.alert('Error', 'Failed to unban user: ' + (error.response?.data?.message || error.message));
    }
  };

  // --- LOGIC FOR APPEALS ---
  const handleAppealDecision = async (item, type) => {
    if (type === 'approve') {
      Alert.alert(
        "Approve Appeal",
        `Forward Complaint #${item.complaintId} back to authority for re-investigation?`,
        [
          { text: "Cancel" },
          {
            text: "Approve & Forward", onPress: async () => {
              try {
                await axios.patch(
                  `${API_URL}/api/complaints/appeals/${item.complaintId}`,
                  {
                    action: 'approve',
                    adminRemarks: 'Appeal approved - complaint requires re-investigation'
                  },
                  { headers: { 'bypass-tunnel-reminder': 'true' } }
                );

                setAppeals(appeals.filter(a => a.id !== item.id));
                Alert.alert("Forwarded", `Complaint has been sent back to ${item.categoryName} authorities with admin priority flag.`);
              } catch (error) {
                console.error('Approve appeal error:', error);
                Alert.alert('Error', 'Failed to approve appeal: ' + (error.response?.data?.message || error.message));
              }
            }
          }
        ]
      );
    } else if (type === 'reject') {
      // Get user info first
      const citizenUid = item.citizenUid;
      const userInfo = await getUserModerationInfo(citizenUid);
      const futureStrikes = userInfo.strikes + 1;

      Alert.alert(
        "Reject Appeal & Add Strike?",
        `This will reject the appeal and the complaint stays rejected.\\n\\n${item.user} currently has ${userInfo.strikes} strike(s).\\n\\nDo you want to add a strike for inappropriate appeal?`,
        [
          { text: "Cancel" },
          {
            text: "Reject Only",
            onPress: async () => {
              try {
                await axios.patch(
                  `${API_URL}/api/complaints/appeals/${item.complaintId}`,
                  {
                    action: 'reject',
                    adminRemarks: 'Appeal rejected by admin - original decision upheld'
                  },
                  { headers: { 'bypass-tunnel-reminder': 'true' } }
                );

                setAppeals(appeals.filter(a => a.id !== item.id));
                Alert.alert("Appeal Rejected", "The citizen's appeal has been rejected. Original decision stands.");
              } catch (error) {
                console.error('Reject appeal error:', error);
                Alert.alert('Error', 'Failed to reject appeal: ' + (error.response?.data?.message || error.message));
              }
            }
          },
          {
            text: "Reject & Strike",
            style: "destructive",
            onPress: async () => {
              try {
                // Reject the appeal
                await axios.patch(
                  `${API_URL}/api/complaints/appeals/${item.complaintId}`,
                  {
                    action: 'reject',
                    adminRemarks: 'Appeal rejected by admin - inappropriate appeal, strike issued'
                  },
                  { headers: { 'bypass-tunnel-reminder': 'true' } }
                );

                // Add strike to user
                const strikeResponse = await axios.post(`${API_URL}/api/moderation/strike`, {
                  citizenUid: citizenUid,
                  reason: `Inappropriate appeal rejected for Complaint #${item.complaintId}`,
                  complaintId: item.complaintId
                }, {
                  headers: { 'bypass-tunnel-reminder': 'true' },
                });

                // Clear cache
                setUserModerationCache(prev => {
                  const newCache = { ...prev };
                  delete newCache[citizenUid];
                  return newCache;
                });

                setAppeals(appeals.filter(a => a.id !== item.id));

                // Check if should ban
                if (strikeResponse.data.shouldBan && !strikeResponse.data.isBanned) {
                  Alert.alert(
                    "Ban User?",
                    `${item.user} now has ${strikeResponse.data.strikes} strikes.\\n\\nDo you want to ban this user permanently?`,
                    [
                      { text: "Not Now" },
                      {
                        text: "Ban User",
                        style: "destructive",
                        onPress: () => banUser(citizenUid, strikeResponse.data.strikes)
                      }
                    ]
                  );
                } else {
                  Alert.alert("Appeal Rejected", `Appeal rejected and strike added. ${item.user} now has ${strikeResponse.data.strikes} strike(s).`);
                }
              } catch (error) {
                console.error('Reject appeal error:', error);
                Alert.alert('Error', 'Failed to reject appeal: ' + (error.response?.data?.message || error.message));
              }
            }
          }
        ]
      );
    } else if (type === 'delete') {
      // Get citizenUid from the item
      const citizenUid = item.citizenUid;
      const userInfo = await getUserModerationInfo(citizenUid);
      const futureStrikes = userInfo.strikes + 1;

      Alert.alert(
        "Delete Appeal & Add Strike?",
        `This will permanently remove Complaint #${item.complaintId}.\\n\\nUser currently has ${userInfo.strikes} strike(s).\\nAfter this action: ${futureStrikes} strike(s)${futureStrikes >= 5 ? '\\n⚠️ User will reach ban threshold!' : ''}`,
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

                // Add strike to user
                const strikeResponse = await axios.post(`${API_URL}/api/moderation/strike`, {
                  citizenUid: citizenUid,
                  reason: `Inappropriate appeal deleted`,
                  complaintId: item.complaintId
                }, {
                  headers: { 'bypass-tunnel-reminder': 'true' },
                });

                // Clear cache
                setUserModerationCache(prev => {
                  const newCache = { ...prev };
                  delete newCache[citizenUid];
                  return newCache;
                });

                // Remove from local state
                setAppeals(appeals.filter(a => a.id !== item.id));

                // Check if should ban
                if (strikeResponse.data.shouldBan && !strikeResponse.data.isBanned) {
                  Alert.alert(
                    "Ban User?",
                    `User now has ${strikeResponse.data.strikes} strikes.\\n\\nDo you want to ban this user permanently?`,
                    [
                      { text: "Not Now" },
                      {
                        text: "Ban User",
                        style: "destructive",
                        onPress: () => banUser(citizenUid, strikeResponse.data.strikes)
                      }
                    ]
                  );
                } else {
                  Alert.alert("Deleted", `The complaint has been deleted. User now has ${strikeResponse.data.strikes} strike(s).`);
                }
              } catch (error) {
                console.error('Delete appeal error:', error);
                Alert.alert('Error', 'Failed to delete complaint: ' + (error.response?.data?.message || error.message));
              }
            }
          }
        ]
      );
    }
  };

  // --- LOGIC FOR REPORTS ---
  const handleReportAction = async (item, action) => {
    if (action === 'delete') {
      // Get user info first
      const userInfo = await getUserModerationInfo(item.citizenUid);
      const futureStrikes = userInfo.strikes + 1;

      Alert.alert(
        "Delete Post & Add Strike?",
        `This will permanently remove the complaint.\\n\\n${item.user} currently has ${userInfo.strikes} strike(s).\\nAfter this action: ${futureStrikes} strike(s)${futureStrikes >= 5 ? '\\n⚠️ User will reach ban threshold!' : ''}`,
        [
          { text: "Cancel" },
          {
            text: "Delete & Strike",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete the complaint from backend
                await axios.delete(`${API_URL}/api/complaints/${item.complaintId}`, {
                  data: { citizenUid: 'admin' },
                  headers: { 'bypass-tunnel-reminder': 'true' },
                });

                // Add strike to user
                const strikeResponse = await axios.post(`${API_URL}/api/moderation/strike`, {
                  citizenUid: item.citizenUid,
                  reason: `Reported complaint deleted: ${item.reason}`,
                  complaintId: item.complaintId
                }, {
                  headers: { 'bypass-tunnel-reminder': 'true' },
                });

                // Clear cache for this user
                setUserModerationCache(prev => {
                  const newCache = { ...prev };
                  delete newCache[item.citizenUid];
                  return newCache;
                });

                // Remove from local state
                setReports(reports.filter(r => r.id !== item.id));

                // Check if should ban
                if (strikeResponse.data.shouldBan && !strikeResponse.data.isBanned) {
                  Alert.alert(
                    "Ban User?",
                    `${item.user} now has ${strikeResponse.data.strikes} strikes.\\n\\nDo you want to ban this user permanently?`,
                    [
                      { text: "Not Now" },
                      {
                        text: "Ban User",
                        style: "destructive",
                        onPress: () => banUser(item.citizenUid, strikeResponse.data.strikes)
                      }
                    ]
                  );
                } else {
                  Alert.alert("Action Taken", `Complaint deleted. ${item.user} now has ${strikeResponse.data.strikes} strike(s).`);
                }
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
      <Text style={[styles.mainText, darkMode && { color: 'white' }]}>Complaint #{item.complaintId}: {item.complaint?.title || 'N/A'}</Text>
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
      <Text style={[styles.mainText, darkMode && { color: 'white' }]}>Complaint #{item.complaintId}: {item.title}</Text>
      <Text style={styles.subNote}>Category: {item.categoryName}</Text>
      <View style={[styles.reasonBadge, { backgroundColor: '#FEF3C7' }]}>
        <AlertTriangle size={12} color="#F59E0B" />
        <Text style={[styles.reasonText, { color: '#F59E0B' }]}>Appeal Reason</Text>
      </View>
      <Text style={[styles.subNote, { fontStyle: 'normal', color: darkMode ? '#D1D5DB' : '#374151', marginTop: 4 }]}>"{item.appealReason}"</Text>
      <View style={[styles.actions, { gap: 8 }]}>
        <TouchableOpacity style={[styles.btnPrimDelete, { flex: 1 }]} onPress={() => handleAppealDecision(item, 'delete')}>
          <Trash2 size={16} color="white" />
          <Text style={styles.btnTextPrim}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSec, { flex: 1 }]} onPress={() => handleAppealDecision(item, 'reject')}>
          <XCircle size={16} color="#EF4444" />
          <Text style={[styles.btnTextSec, { color: '#EF4444' }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnPrimForward, { flex: 1 }]} onPress={() => handleAppealDecision(item, 'approve')}>
          <Send size={16} color="white" />
          <Text style={styles.btnTextPrim}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render item for forwarded appeals (tracking authority progress)
  const renderForwardedAppealItem = ({ item }) => {
    // Status badge color based on current status
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return '#F59E0B'; // Orange
        case 'accepted': return '#3B82F6'; // Blue
        case 'in_progress': return '#8B5CF6'; // Purple
        case 'resolved': return '#10B981'; // Green
        case 'rejected': return '#EF4444'; // Red
        default: return '#6B7280'; // Gray
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return Clock;
        case 'accepted': return CheckCircle;
        case 'in_progress': return RefreshCw;
        case 'resolved': return CheckCircle;
        case 'rejected': return XCircle;
        default: return Clock;
      }
    };

    const StatusIcon = getStatusIcon(item.currentStatus);
    const statusColor = getStatusColor(item.currentStatus);

    return (
      <View style={[styles.card, darkMode && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <Text style={styles.user}>{item.user}</Text>
          <Text style={styles.time}><Clock size={10} color="#9CA3AF" /> Forwarded {item.forwardedAt}</Text>
        </View>
        <Text style={[styles.mainText, darkMode && { color: 'white' }]}>
          Complaint #{item.complaintId}: {item.title}
        </Text>
        <Text style={styles.subNote}>Category: {item.categoryName}</Text>

        {/* Current Status Badge */}
        <View style={[styles.reasonBadge, { backgroundColor: `${statusColor}20`, marginTop: 8 }]}>
          <StatusIcon size={12} color={statusColor} />
          <Text style={[styles.reasonText, { color: statusColor, textTransform: 'capitalize' }]}>
            Status: {item.currentStatus.replace('_', ' ')}
          </Text>
        </View>

        {/* Admin Remarks */}
        {item.adminRemarks && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.subNote, { fontSize: 10, color: '#9CA3AF' }]}>Admin Remarks:</Text>
            <Text style={[styles.subNote, { fontStyle: 'normal', color: darkMode ? '#D1D5DB' : '#374151' }]}>
              "{item.adminRemarks}"
            </Text>
          </View>
        )}

        {/* Status Notes from Authority */}
        {item.statusNotes && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.subNote, { fontSize: 10, color: '#9CA3AF' }]}>Authority Update:</Text>
            <Text style={[styles.subNote, { fontStyle: 'normal', color: darkMode ? '#D1D5DB' : '#374151' }]}>
              "{item.statusNotes}"
            </Text>
          </View>
        )}

        {/* View Details Button */}
        <TouchableOpacity
          style={[styles.btnPrimForward, { marginTop: 12 }]}
          onPress={() => {
            navigation.navigate('AdminComplaintDetail', { complaintId: item.complaintId });
          }}
        >
          <Text style={styles.btnTextPrim}>View Full Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const wrapPress = (item, children) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AdminComplaintDetail', { complaintId: item.complaintId })}>
      {children}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, darkMode && { color: 'white' }]}>Moderation Triage</Text>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, subTab === 'reported' && styles.tabActive]} onPress={() => setSubTab('reported')}>
          <Text style={[styles.tabText, subTab === 'reported' && styles.tabTextActive]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, subTab === 'appeals' && styles.tabActive]} onPress={() => setSubTab('appeals')}>
          <Text style={[styles.tabText, subTab === 'appeals' && styles.tabTextActive]}>Appeals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, subTab === 'forwarded' && styles.tabActive]} onPress={() => setSubTab('forwarded')}>
          <Text style={[styles.tabText, subTab === 'forwarded' && styles.tabTextActive]}>Forwarded</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={[styles.subNote, { marginTop: 12 }]}>Loading {subTab}...</Text>
        </View>
      ) : (
        <FlatList
          data={
            subTab === 'reported' ? reports :
              subTab === 'appeals' ? appeals :
                forwardedAppeals
          }
          renderItem={({ item }) => {
            if (subTab === 'reported') return wrapPress(item, renderReportItem({ item }));
            if (subTab === 'appeals') return wrapPress(item, renderAppealItem({ item }));
            return renderForwardedAppealItem({ item });
          }}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No items in {subTab} queue.</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
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