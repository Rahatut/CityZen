import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  FlatList, Image, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';


import Navigation from '../components/Navigation';
import AuthorityMapView from '../components/AuthorityMapView';
import {
  BarChart2, ClipboardList, User, MapPin, Clock,
  ThumbsUp, Camera, CheckCircle, XCircle, ArrowLeft,
  ChevronRight, Search, LogOut, HardHat, TrendingUp, AlertCircle,
  ShieldCheck, Award, Settings, Phone, Mail, RefreshCw, Filter, X, Map
} from 'lucide-react-native';
import api from '../services/api';

export default function AuthorityDashboardScreen({ onLogout, darkMode, toggleDarkMode }) {
  const [activeTab, setActiveTab] = useState('ledger');
  const [workSubTab, setWorkSubTab] = useState('new');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [workViewMode, setWorkViewMode] = useState('list'); // 'list' or 'map'
  const [mapVisible, setMapVisible] = useState(false);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState('');
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]); // Array of uris
  const [profileData, setProfileData] = useState(null);



  const rejectionShortcuts = ["Inaccurate Location", "Duplicate Report", "Private Property", "Outside Jurisdiction"];

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);

  // Filter states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // all, weekly, monthly, yearly
  const [categories, setCategories] = useState([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Fetch complaints
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // By default getting all, sorted by upvotes (backend default)
      const response = await api.get('/complaints?limit=100');
      if (response.data && response.data.complaints) {
        const mapped = response.data.complaints
          .filter(c => c.currentStatus !== 'appealed') // Hide appealed from authorities
          .map(c => {
            const statusMap = {
              'pending': 'Pending',
              'accepted': 'Accepted',
              'in_progress': 'In Progress',
              'resolved': 'Resolved',
              'rejected': 'Rejected',
              'completed': 'Completed'
            };
            return {
              id: c.id,
              title: c.title,
              location: `Lat: ${c.latitude}, Long: ${c.longitude}`,
              latitude: c.latitude,
              longitude: c.longitude,
              ward: 'Unknown Ward', // Placeholder
              status: statusMap[c.currentStatus] || c.currentStatus.charAt(0).toUpperCase() + c.currentStatus.slice(1),
              time: new Date(c.createdAt).toLocaleDateString(),
              createdAt: c.createdAt, // Keep raw date for filtering
              upvotes: c.upvotes || 0,
              category: c.Category ? c.Category.name : 'Uncategorized',
              description: c.description,
              citizenProof: c.images && c.images.length > 0 ? c.images[0].imageURL : 'https://via.placeholder.com/400'
            };
          });
        setComplaints(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch complaints", error);
      Alert.alert("Error", "Could not load complaints.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/complaints/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const response = await api.get(`/users/${userData.firebaseUid}`);
        setProfileData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };


  React.useEffect(() => {
    fetchComplaints();
    fetchCategories();
    fetchProfile();
  }, []);


  const kpis = [
    {
      label: 'New',
      value: complaints.filter(c => c.status === 'Pending').length,
      color: '#F59E0B',
      icon: AlertCircle,
      statuses: ['Pending']
    },
    {
      label: 'Repairing',
      value: complaints.filter(c => c.status === 'Accepted' || c.status === 'In Progress').length,
      color: '#1E88E5',
      icon: TrendingUp,
      statuses: ['Accepted', 'In Progress']
    },
    {
      label: 'Fixed',
      value: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Completed').length,
      color: '#10B981',
      icon: CheckCircle,
      statuses: ['Resolved', 'Closed', 'Completed']
    },
  ];

  const handleKpiPress = (statuses) => {
    setSelectedStatuses(statuses);
    setActiveFilterCount(prev => (statuses.length > 0 ? 1 : 0)); // Basic count adjustment
  };

  // --- CORE LOGIC ---
  const handleFinalSubmit = async (statusOverride, targetItem = selectedItem) => {
    if (!targetItem) {
      Alert.alert("Error", "No item selected");
      return;
    }
    if (actionType === 'Reject' && !note) return Alert.alert("Required", "Please provide a rejection reason.");
    if ((actionType === 'Resolve' || actionType === 'Progress') && (!images || images.length === 0)) return Alert.alert("Evidence Required", "Please capture a work-site photo.");

    // Status Validations
    const statusMapBackend = { 'Reject': 'rejected', 'Progress': 'in_progress', 'Resolve': 'resolved', 'Accept': 'accepted' };
    const statusMapUI = { 'rejected': 'Rejected', 'in_progress': 'In Progress', 'resolved': 'Resolved', 'accepted': 'Accepted' };

    let newStatusBackend = statusOverride ? statusOverride.toLowerCase() : statusMapBackend[actionType];

    try {
      console.log(`Sending PATCH for ID ${targetItem.id} with status: ${newStatusBackend}`);

      const formData = new FormData();
      formData.append('currentStatus', newStatusBackend);
      formData.append('statusNotes', note || '');

      if (images.length > 0) {
        images.forEach((uri, index) => {
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('images', { uri, name: filename, type });
        });
      }

      await api.patch(`/complaints/${targetItem.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newStatusUI = statusMapUI[newStatusBackend] || 'Pending';

      setComplaints(prev => prev.map(c => c.id === targetItem.id ? { ...c, status: newStatusUI } : c));
      Alert.alert("Success", `Complaint updated to ${newStatusUI}`);

      setActionModalVisible(false);
      setNote('');
      setImages([]);
      if (activeTab === 'details') setActiveTab('work');

    } catch (error) {
      console.error("Update failed", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update status on server.";
      Alert.alert("Update Failed", errorMsg);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera permission is required to take proof photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
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
          <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => { setSelectedItem(item); handleFinalSubmit('Accepted', item); }}><CheckCircle size={14} color="white" /><Text style={styles.btnText}>Accept</Text></TouchableOpacity>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.screenTitle, darkMode && styles.textWhite]}>Operational Queue</Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <TouchableOpacity onPress={() => setWorkViewMode(workViewMode === 'map' ? 'list' : 'map')}>
              <Map size={20} color={workViewMode === 'map' ? "#1E88E5" : (darkMode ? "white" : "black")} />
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchComplaints}><RefreshCw size={20} color={darkMode ? "white" : "black"} /></TouchableOpacity>
          </View>
        </View>
        <View style={[styles.toggleBar, darkMode && styles.toggleBarDark]}>
          <TouchableOpacity style={[styles.toggleTab, workSubTab === 'new' && styles.toggleActive]} onPress={() => setWorkSubTab('new')}>
            <Text style={[styles.toggleText, workSubTab === 'new' && styles.toggleTextActive]}>New ({complaints.filter(c => c.status === 'Pending').length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleTab, workSubTab === 'active' && styles.toggleActive]} onPress={() => setWorkSubTab('active')}>
            <Text style={[styles.toggleText, workSubTab === 'active' && styles.toggleTextActive]}>Under Repair</Text>
          </TouchableOpacity>
        </View>

        {workViewMode === 'map' ? (
          <View style={{ flex: 1, marginTop: 16 }}>
            <AuthorityMapView
              complaints={data}
              darkMode={darkMode}
              onComplaintSelect={(complaint) => {
                setSelectedItem(complaint);
                setActiveTab('details');
              }}
            />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 150 }}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={[styles.workCard, darkMode && styles.cardDark]}>
                <TouchableOpacity onPress={() => { setSelectedItem(item); setActiveTab('details'); }}>
                  <Text style={[styles.workTitle, darkMode && styles.textWhite]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.workLoc}>{item.location} • {item.ward}</Text>
                </TouchableOpacity>
                <View style={styles.cardDivider} />
                <ActionButtons item={item} />
              </View>
            )}
          />
        )}
      </View>
    );
  };

  const renderDetails = () => (
    <ScrollView style={{ flex: 1 }} bounces={false}>
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

  const renderLedger = () => {
    const filteredData = complaints.filter(item => {
      const matchesSearch = item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const matchesLocation = locationFilter.trim().length === 0 ||
        item.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
        item.ward.toLowerCase().includes(locationFilter.toLowerCase());

      let matchesTime = true;
      if (timeFilter !== 'all') {
        const createdDate = new Date(item.createdAt);
        const now = new Date();
        if (timeFilter === 'weekly') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          matchesTime = createdDate >= weekAgo;
        } else if (timeFilter === 'monthly') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          matchesTime = createdDate >= monthAgo;
        } else if (timeFilter === 'yearly') {
          const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
          matchesTime = createdDate >= yearAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesTime;
    });

    return (
      <View style={styles.paddedContent}>
        <Text style={[styles.screenTitle, darkMode && styles.textWhite]}>Public Records Ledger</Text>
        <View style={styles.kpiGrid}>
          {kpis.map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.kpiCard, darkMode && styles.cardDark, (selectedStatuses.length > 0 && k.statuses.every(s => selectedStatuses.includes(s)) && k.statuses.length === selectedStatuses.length) && styles.kpiCardActive]}
              onPress={() => handleKpiPress(k.statuses)}
            >
              <k.icon size={16} color={k.color} />
              <Text style={[styles.kpiVal, darkMode && styles.textWhite]}>{k.value}</Text>
              <Text style={styles.kpiLab}>{k.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { flex: 1, marginBottom: 0 }]}><Search size={18} color="#9CA3AF" /><TextInput placeholder="Search Location, Ward, or Title..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} /></View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          >
            <Filter size={20} color={activeFilterCount > 0 ? "white" : "#6B7280"} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredData}
          contentContainerStyle={{ paddingBottom: 150 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const getStatusColor = (status) => {
              switch (status) {
                case 'Pending': return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
                case 'Accepted': return { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' };
                case 'In Progress': return { bg: '#F3E8FF', text: '#6B21A8', border: '#9333EA' };
                case 'Resolved':
                case 'Completed': return { bg: '#D1FAE5', text: '#065F46', border: '#10B981' };
                case 'Rejected': return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' };
                default: return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
              }
            };
            const colors = getStatusColor(item.status);

            return (
              <TouchableOpacity
                style={[
                  styles.ledgerRow,
                  darkMode && styles.cardDark,
                  { borderLeftWidth: 4, borderLeftColor: colors.border }
                ]}
                onPress={() => { setSelectedItem(item); setActiveTab('details'); }}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.ledgerTitle, darkMode && styles.textWhite, { flex: 1, marginRight: 10 }]} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.text }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={styles.ledgerLoc}>{item.location} • {item.ward}</Text>
                    <Text style={styles.ledgerId}>#{item.id}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <View style={{ flex: 1, paddingBottom: 85 }}>
        {activeTab === 'ledger' && renderLedger()}
        {activeTab === 'work' && renderWorkQueue()}
        {activeTab === 'profile' && (
          <ScrollView style={styles.paddedContent} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.screenTitle, darkMode && styles.textWhite]}>Authority Identity</Text>
            <View style={[styles.idCard, { backgroundColor: darkMode ? '#1F2937' : '#1E40AF' }]}>
              <View style={styles.idHeader}>
                <View style={styles.govtBadge}>
                  <ShieldCheck size={16} color="white" />
                  <Text style={styles.govtText}>Official Personnel</Text>
                </View>
                <Award size={24} color="#FBBF24" />
              </View>
              <View style={styles.idBody}>
                <View style={styles.idAvatar}>
                  <HardHat size={40} color="#1E40AF" />
                </View>
                <View style={{ marginLeft: 20, flex: 1 }}>
                  <Text style={styles.idName}>{profileData?.fullName || 'Loading...'}</Text>
                  <Text style={styles.idDept}>{profileData?.Authority?.department || 'Official Personnel'}</Text>
                  <Text style={styles.idWard}>Primary Zone: Ward {profileData?.Authority?.ward || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.idFooter}>
                <View style={styles.idInfoItem}>
                  <Phone size={12} color="white" />
                  <Text style={styles.idInfoText}>{profileData?.phone || 'No phone listed'}</Text>
                </View>
                <View style={styles.idInfoItem}>
                  <Mail size={12} color="white" />
                  <Text style={styles.idInfoText}>{profileData?.email || 'No email listed'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, darkMode && styles.cardDark]}>
                <Text style={styles.statSub}>Handled by Dept</Text>
                <Text style={[styles.statNum, darkMode && styles.textWhite]}>{complaints.length}</Text>
              </View>
              <View style={[styles.statBox, darkMode && styles.cardDark]}>
                <Text style={styles.statSub}>Resolved</Text>
                <Text style={[styles.statNum, { color: '#10B981' }]}>
                  {complaints.filter(c => c.status === 'Resolved' || c.status === 'Completed').length}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <LogOut size={20} color="white" />
              <Text style={styles.logoutBtnText}>Secure Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
        {activeTab === 'details' && renderDetails()}
      </View>

      {/* Filter Modal */}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.cardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}><X size={24} color={darkMode ? "white" : "black"} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptionsGrid}>
                {['Pending', 'Accepted', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, selectedStatuses.includes(status) && styles.filterChipActive]}
                    onPress={() => {
                      setSelectedStatuses(prev =>
                        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                      );
                    }}
                  >
                    <Text style={[styles.filterChipText, selectedStatuses.includes(status) && styles.filterChipTextActive]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptionsGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, selectedCategories.includes(cat.name) && styles.filterChipActive]}
                    onPress={() => {
                      setSelectedCategories(prev =>
                        prev.includes(cat.name) ? prev.filter(c => c !== cat.name) : [...prev, cat.name]
                      );
                    }}
                  >
                    <Text style={[styles.filterChipText, selectedCategories.includes(cat.name) && styles.filterChipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Location / Ward</Text>
              <TextInput
                style={[styles.locationInput, darkMode && styles.inputDark]}
                placeholder="Enter ward or locality..."
                value={locationFilter}
                onChangeText={setLocationFilter}
              />

              <Text style={styles.filterSectionTitle}>Time Period</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'All Time', value: 'all' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.filterChip, timeFilter === item.value && styles.filterChipActive]}
                    onPress={() => setTimeFilter(item.value)}
                  >
                    <Text style={[styles.filterChipText, timeFilter === item.value && styles.filterChipTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedStatuses([]);
                  setSelectedCategories([]);
                  setLocationFilter('');
                  setTimeFilter('all');
                  setActiveFilterCount(0);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  let count = 0;
                  if (selectedStatuses.length > 0) count++;
                  if (selectedCategories.length > 0) count++;
                  if (locationFilter.trim().length > 0) count++;
                  if (timeFilter !== 'all') count++;
                  setActiveFilterCount(count);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={actionModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.cardDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>{actionType === 'Reject' ? 'Rejection Reason' : 'Work Proof Upload'}</Text>
            {actionType === 'Reject' && (<View style={styles.shortcutWrapper}>{rejectionShortcuts.map(s => (<TouchableOpacity key={s} style={styles.shortcutChip} onPress={() => setNote(s)}><Text style={styles.shortcutText}>{s}</Text></TouchableOpacity>))}</View>)}
            {(actionType === 'Progress' || actionType === 'Resolve') && (
              <View>
                <TouchableOpacity style={[styles.uploadBox, images.length > 0 && { borderColor: '#10B981' }]} onPress={handlePickImage}>
                  <Camera size={30} color={images.length > 0 ? "#10B981" : "#1E88E5"} />
                  <Text style={{ color: images.length > 0 ? '#10B981' : '#1E88E5', fontWeight: 'bold', marginTop: 10 }}>
                    {images.length > 0 ? `${images.length} Photo(s) Captured` : 'Capture Site Photo'}
                  </Text>
                </TouchableOpacity>
                {images.length > 0 && (
                  <ScrollView horizontal style={{ marginBottom: 15 }} showsHorizontalScrollIndicator={false}>
                    {images.map((img, idx) => (
                      <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
                        <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                        <TouchableOpacity
                          style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, padding: 2 }}
                          onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
            <TextInput style={[styles.modalInput, darkMode && styles.inputDark]} placeholder="Internal remarks..." multiline value={note} onChangeText={setNote} />
            <View style={styles.modalActionButtons}><TouchableOpacity style={styles.cancelBtn} onPress={() => setActionModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: actionType === 'Reject' ? '#EF4444' : '#10B981' }]} onPress={() => handleFinalSubmit()}><Text style={{ color: 'white', fontWeight: 'bold' }}>Submit {actionType}</Text></TouchableOpacity></View>
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
  paddedContent: { flex: 1, padding: 16 },
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
  navLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },

  // New Filter Styles
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  filterBtn: { width: 48, height: 48, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  filterBtnActive: { backgroundColor: '#1E88E5' },
  kpiCardActive: { borderColor: '#1E88E5', borderWidth: 2, transform: [{ scale: 1.05 }] },
  filterBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  filterBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginTop: 15, marginBottom: 10 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  filterChipText: { fontSize: 13, color: '#4B5563' },
  filterChipTextActive: { color: 'white', fontWeight: 'bold' },
  locationInput: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, fontSize: 14, marginTop: 5 },
  clearBtn: { padding: 15 },
  clearBtnText: { color: '#6B7280', fontWeight: 'bold' },
  applyBtn: { backgroundColor: '#1E88E5', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  applyBtnText: { color: 'white', fontWeight: 'bold' }
});