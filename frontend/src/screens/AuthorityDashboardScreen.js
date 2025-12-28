import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  FlatList, Image, TextInput, Alert, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import Navigation from '../components/Navigation';
import { 
  BarChart2, ClipboardList, User, MapPin, Clock, 
  ThumbsUp, Camera, CheckCircle, XCircle, ArrowLeft, 
  ChevronRight, Search, LogOut, HardHat, TrendingUp, AlertCircle,
  ShieldCheck, Award, Settings, Phone, Mail
} from 'lucide-react-native';

export default function AuthorityDashboardScreen({ onLogout, darkMode, toggleDarkMode }) {
  const [activeTab, setActiveTab] = useState('ledger'); 
  const [workSubTab, setWorkSubTab] = useState('new'); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(''); 
  const [note, setNote] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const rejectionShortcuts = ["Inaccurate Location", "Duplicate Report", "Private Property", "Outside Jurisdiction"];

  const [complaints, setComplaints] = useState([
    { id: '101', title: 'Major Water Leak', location: 'Dhanmondi 27', ward: 'Ward 15', status: 'Pending', time: '45m ago', upvotes: 156, category: 'Water', description: 'Main pipe burst near the pharmacy. Significant water wastage.', citizenProof: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=500' },
    { id: '102', title: 'Faulty Transformer', location: 'Banani Road 11', ward: 'Ward 19', status: 'Accepted', time: '3h ago', upvotes: 42, category: 'Electric', description: 'Sparking near gate. Dangerous for pedestrians.', citizenProof: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=500' },
    { id: '103', title: 'Drainage Clog', location: 'Mirpur 10', ward: 'Ward 2', status: 'In Progress', time: '5h ago', upvotes: 89, category: 'Sewerage', description: 'Water stinking up the area. Health hazard.', citizenProof: 'https://images.unsplash.com/photo-1516663243141-8f5573427f7a?auto=format&fit=crop&w=500' },
  ]);

  const kpis = [
    { label: 'New', value: complaints.filter(c => c.status === 'Pending').length, color: '#F59E0B', icon: AlertCircle },
    { label: 'Repairing', value: complaints.filter(c => c.status === 'Accepted' || c.status === 'In Progress').length, color: '#1E88E5', icon: TrendingUp },
    { label: 'Fixed', value: '1,240', color: '#10B981', icon: CheckCircle },
  ];

  // --- CORE LOGIC ---
  const handleFinalSubmit = (statusOverride) => {
    if (actionType === 'Reject' && !note) return Alert.alert("Required", "Please provide a rejection reason.");
    if ((actionType === 'Resolve' || actionType === 'Progress') && !hasPhoto) return Alert.alert("Evidence Required", "Please capture a work-site photo.");

    const statusMap = { 'Reject': 'Rejected', 'Progress': 'In Progress', 'Resolve': 'Resolved', 'Accept': 'Accepted' };
    const newStatus = statusOverride || statusMap[actionType];

    setComplaints(prev => prev.map(c => c.id === selectedItem.id ? { ...c, status: newStatus } : c));
    setActionModalVisible(false);
    setNote('');
    setHasPhoto(false);
    if(activeTab === 'details') setActiveTab('work');
  };

  const openActionModal = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setActionModalVisible(true);
  };

  // --- SHARED UI COMPONENTS ---
  const ActionButtons = ({ item }) => (
    <View style={styles.actionRow}>
      {item.status === 'Pending' ? (
        <>
          <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => openActionModal(item, 'Reject')}><XCircle size={14} color="white" /><Text style={styles.btnText}>Reject</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => { setSelectedItem(item); handleFinalSubmit('Accepted'); }}><CheckCircle size={14} color="white" /><Text style={styles.btnText}>Accept</Text></TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={[styles.btn, styles.progressBtn]} onPress={() => openActionModal(item, 'Progress')}><Clock size={14} color="white" /><Text style={styles.btnText}>Progress</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.resolveBtn]} onPress={() => openActionModal(item, 'Resolve')}><CheckCircle size={14} color="white" /><Text style={styles.btnText}>Resolve</Text></TouchableOpacity>
        </>
      )}
    </View>
  );

  // --- TAB RENDERERS ---

  const renderWorkQueue = () => {
    const data = workSubTab === 'new' 
      ? complaints.filter(c => c.status === 'Pending') 
      : complaints.filter(c => c.status === 'Accepted' || c.status === 'In Progress');

    return (
      <View style={styles.paddedContent}>
        <Text style={[styles.screenTitle, darkMode && styles.textWhite]}>Operational Queue</Text>
        <View style={[styles.toggleBar, darkMode && styles.toggleBarDark]}>
          <TouchableOpacity style={[styles.toggleTab, workSubTab === 'new' && styles.toggleActive]} onPress={() => setWorkSubTab('new')}>
            <Text style={[styles.toggleText, workSubTab === 'new' && styles.toggleTextActive]}>New ({complaints.filter(c => c.status === 'Pending').length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleTab, workSubTab === 'active' && styles.toggleActive]} onPress={() => setWorkSubTab('active')}>
            <Text style={[styles.toggleText, workSubTab === 'active' && styles.toggleTextActive]}>Under Repair</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.workCard, darkMode && styles.cardDark]}>
              <TouchableOpacity onPress={() => { setSelectedItem(item); setActiveTab('details'); }}>
                <Text style={[styles.workTitle, darkMode && styles.textWhite]}>{item.title}</Text>
                <Text style={styles.workLoc}>{item.location} • {item.ward}</Text>
              </TouchableOpacity>
              <View style={styles.cardDivider} />
              <ActionButtons item={item} />
            </View>
          )}
        />
      </View>
    );
  };

  const renderDetails = () => (
    <ScrollView style={{flex: 1}} bounces={false}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => setActiveTab('work')} style={styles.backButton}><ArrowLeft size={24} color="white" /></TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Complaint #{selectedItem.id}</Text>
      </View>
      <Image source={{ uri: selectedItem.citizenProof }} style={styles.heroImage} />
      <View style={[styles.detailCard, darkMode && styles.cardDark]}>
        <Text style={[styles.detailTitle, darkMode && styles.textWhite]}>{selectedItem.title}</Text>
        <View style={styles.detailLocRow}><MapPin size={16} color="#6B7280" /><Text style={styles.detailLocText}>{selectedItem.location} • {selectedItem.ward}</Text></View>
        <Text style={[styles.detailDesc, darkMode && styles.textGray]}>{selectedItem.description}</Text>
        <View style={styles.cardDivider} />
        <Text style={styles.sectionLabel}>Administrative Actions</Text>
        <ActionButtons item={selectedItem} />
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <View style={{ flex: 1, paddingBottom: 85 }}>
        {activeTab === 'ledger' && (
          <View style={styles.paddedContent}>
            <Text style={[styles.screenTitle, darkMode && styles.textWhite]}>Public Records Ledger</Text>
            <View style={styles.kpiGrid}>{kpis.map((k, i) => (<View key={i} style={[styles.kpiCard, darkMode && styles.cardDark]}><k.icon size={16} color={k.color} /><Text style={[styles.kpiVal, darkMode && styles.textWhite]}>{k.value}</Text><Text style={styles.kpiLab}>{k.label}</Text></View>))}</View>
            <View style={styles.searchBar}><Search size={18} color="#9CA3AF" /><TextInput placeholder="Search Location, Ward, or Title..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery}/></View>
            <FlatList data={complaints.filter(item => item.location.toLowerCase().includes(searchQuery.toLowerCase()) || item.ward.toLowerCase().includes(searchQuery.toLowerCase()) || item.title.toLowerCase().includes(searchQuery.toLowerCase()))} renderItem={({ item }) => (
              <TouchableOpacity style={[styles.ledgerRow, darkMode && styles.cardDark]} onPress={() => { setSelectedItem(item); setActiveTab('details'); }}>
                <View style={{ flex: 1 }}><View style={styles.rowTop}><Text style={[styles.ledgerTitle, darkMode && styles.textWhite]}>{item.title}</Text><View style={[styles.statusBadge, { backgroundColor: item.status === 'Resolved' ? '#D1FAE5' : '#FEF3C7' }]}><Text style={[styles.statusBadgeText, { color: item.status === 'Resolved' ? '#065F46' : '#92400E' }]}>{item.status}</Text></View></View><View style={styles.rowBottom}><Text style={styles.ledgerLoc}>{item.location} • {item.ward}</Text><Text style={styles.ledgerId}>#{item.id}</Text></View></View>
              </TouchableOpacity>
            )}/>
          </View>
        )}
        {activeTab === 'work' && renderWorkQueue()}
        {activeTab === 'profile' && (
          <ScrollView style={styles.paddedContent}>
            <Text style={[styles.screenTitle, darkMode && styles.textWhite]}>Authority Identity</Text>
            <View style={[styles.idCard, { backgroundColor: darkMode ? '#1F2937' : '#1E40AF' }]}><View style={styles.idHeader}><View style={styles.govtBadge}><ShieldCheck size={16} color="white" /><Text style={styles.govtText}>Official Personnel</Text></View><Award size={24} color="#FBBF24" /></View><View style={styles.idBody}><View style={styles.idAvatar}><HardHat size={40} color="#1E40AF" /></View><View style={{ marginLeft: 20 }}><Text style={styles.idName}>Ahmed Bin Rahman</Text><Text style={styles.idDept}>Executive Engineer, DWASA</Text><Text style={styles.idWard}>Primary Zone: Ward 15 & 19</Text></View></View><View style={styles.idFooter}><View style={styles.idInfoItem}><Phone size={12} color="white" /><Text style={styles.idInfoText}>+880 1711-XXXXXX</Text></View><View style={styles.idInfoItem}><Mail size={12} color="white" /><Text style={styles.idInfoText}>a.rahman@dwasa.gov.bd</Text></View></View></View>
            <View style={styles.statsRow}><View style={[styles.statBox, darkMode && styles.cardDark]}><Text style={styles.statSub}>Total Handled</Text><Text style={[styles.statNum, darkMode && styles.textWhite]}>412</Text></View><View style={[styles.statBox, darkMode && styles.cardDark]}><Text style={styles.statSub}>Efficiency</Text><Text style={[styles.statNum, { color: '#10B981' }]}>94%</Text></View></View>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}><LogOut size={20} color="white" /><Text style={styles.logoutBtnText}>Secure Sign Out</Text></TouchableOpacity>
          </ScrollView>
        )}
        {activeTab === 'details' && renderDetails()}
      </View>

      <Modal visible={actionModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.cardDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>{actionType === 'Reject' ? 'Rejection Reason' : 'Work Proof Upload'}</Text>
            {actionType === 'Reject' && (<View style={styles.shortcutWrapper}>{rejectionShortcuts.map(s => (<TouchableOpacity key={s} style={styles.shortcutChip} onPress={() => setNote(s)}><Text style={styles.shortcutText}>{s}</Text></TouchableOpacity>))}</View>)}
            {(actionType === 'Progress' || actionType === 'Resolve') && (<TouchableOpacity style={[styles.uploadBox, hasPhoto && {borderColor: '#10B981'}]} onPress={() => setHasPhoto(true)}><Camera size={30} color={hasPhoto ? "#10B981" : "#1E88E5"} /><Text style={{color: hasPhoto ? '#10B981' : '#1E88E5', fontWeight: 'bold', marginTop: 10}}>{hasPhoto ? 'Photo Attached' : 'Capture Site Photo'}</Text></TouchableOpacity>)}
            <TextInput style={[styles.modalInput, darkMode && styles.inputDark]} placeholder="Internal remarks..." multiline value={note} onChangeText={setNote} />
            <View style={styles.modalActionButtons}><TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: actionType === 'Reject' ? '#EF4444' : '#10B981' }]} onPress={() => handleFinalSubmit()}><Text style={{color: 'white', fontWeight: 'bold'}}>Submit {actionType}</Text></TouchableOpacity></View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={[styles.bottomNav, darkMode && styles.bottomNavDark]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('ledger')}><BarChart2 size={24} color={activeTab === 'ledger' ? '#1E88E5' : '#9CA3AF'} /><Text style={styles.navLabel}>Ledger</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('work')}><ClipboardList size={24} color={activeTab === 'work' ? '#1E88E5' : '#9CA3AF'} /><Text style={styles.navLabel}>Work</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}><User size={24} color={activeTab === 'profile' ? '#1E88E5' : '#9CA3AF'} /><Text style={styles.navLabel}>Profile</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  paddedContent: { padding: 16 },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  screenTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1 },

  // Ledger & KPI
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: { backgroundColor: 'white', padding: 12, borderRadius: 12, width: '31%', alignItems: 'center', elevation: 2 },
  kpiVal: { fontSize: 16, fontWeight: 'bold', marginVertical: 2 },
  kpiLab: { fontSize: 9, color: '#6B7280', textTransform: 'uppercase' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, height: 48, borderRadius: 12, marginBottom: 15 },
  searchInput: { flex: 1, marginLeft: 10 },
  ledgerRow: { backgroundColor: 'white', padding: 16, borderRadius: 15, marginBottom: 10 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ledgerTitle: { fontSize: 14, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  ledgerLoc: { fontSize: 11, color: '#6B7280' },
  ledgerId: { fontSize: 11, color: '#9CA3AF' },

  // Operational Queue
  toggleBar: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 15 },
  toggleBarDark: { backgroundColor: '#374151' },
  toggleTab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: 'white' },
  toggleText: { fontWeight: 'bold', color: '#6B7280', fontSize: 12 },
  toggleTextActive: { color: '#1E88E5' },
  workCard: { backgroundColor: 'white', padding: 16, borderRadius: 15, marginBottom: 10 },
  workTitle: { fontWeight: 'bold', fontSize: 15 },
  workLoc: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, height: 38, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 11, marginLeft: 5 },
  acceptBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  progressBtn: { backgroundColor: '#EA580C' },
  resolveBtn: { backgroundColor: '#1E88E5' },

  // Details
  detailHeader: { position: 'absolute', top: 0, zIndex: 10, width: '100%', flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.3)' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  detailHeaderTitle: { color: 'white', fontWeight: 'bold', marginLeft: 15, fontSize: 18 },
  heroImage: { width: '100%', height: 300 },
  detailCard: { marginTop: -20, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: 'white', padding: 20, minHeight: 400 },
  detailTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  detailLocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailLocText: { color: '#6B7280', marginLeft: 5 },
  detailDesc: { fontSize: 15, lineHeight: 22, color: '#4B5563' },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  shortcutWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  shortcutChip: { backgroundColor: '#EEF2FF', padding: 8, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  shortcutText: { fontSize: 11, color: '#4338CA' },
  uploadBox: { height: 120, borderStyle: 'dashed', borderWidth: 1, borderColor: '#1E88E5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF', marginBottom: 15 },
  modalInput: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, height: 80, textAlignVertical: 'top' },
  inputDark: { backgroundColor: '#374151', color: 'white' },
  modalActionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 15 },
  confirmBtn: { paddingHorizontal: 25, borderRadius: 10, justifyContent: 'center' },

  // Profile (From your code)
  idCard: { borderRadius: 20, padding: 20, elevation: 8, marginBottom: 20 },
  idHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  govtBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  govtText: { color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
  idBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  idAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  idName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  idDept: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  idWard: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 15 },
  idInfoItem: { flexDirection: 'row', alignItems: 'center' },
  idInfoText: { color: 'white', fontSize: 10, marginLeft: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBox: { backgroundColor: 'white', width: '48%', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  statSub: { fontSize: 12, color: '#6B7280' },
  logoutBtn: { backgroundColor: '#EF4444', flexDirection: 'row', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },

  // Nav
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 85, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 25 },
  bottomNavDark: { backgroundColor: '#1F2937', borderTopColor: '#374151' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4 }
});