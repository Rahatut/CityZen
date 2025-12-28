import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, Alert, TouchableOpacity, Text } from 'react-native';
import { BarChart3, AlertTriangle, Settings, ShieldCheck } from 'lucide-react-native';

// Import the top navigation used by citizens
import Navigation from '../components/Navigation'; 

// Import modular sub-screens
import AdminStatusScreen from './AdminStatusScreen';
import AdminFlagsScreen from './AdminFlagsScreen';
import AdminSystemScreen from './AdminSystemScreen';
import AdminProfileScreen from './AdminProfileScreen';

export default function AdminDashboardScreen({ onLogout, darkMode, toggleDarkMode }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [initialFlagTab, setInitialFlagTab] = useState('reported');

  // Logic to jump from Status Screen to a specific Flag Tab
  const jumpToFlags = (subTab) => {
    setInitialFlagTab(subTab);
    setActiveTab('flags');
  };

  useEffect(() => {
    const backAction = () => {
      if (activeTab !== 'overview') {
        setActiveTab('overview');
        return true;
      }
      Alert.alert("Logout", "Exit Admin Panel?", [
        { text: "Cancel" },
        { text: "Logout", onPress: onLogout }
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminStatusScreen darkMode={darkMode} onJump={jumpToFlags} />;
      case 'flags':    return <AdminFlagsScreen darkMode={darkMode} defaultTab={initialFlagTab} />;
      case 'system':   return <AdminSystemScreen darkMode={darkMode} />;
      case 'profile':  return <AdminProfileScreen darkMode={darkMode} onLogout={onLogout} />;
      default:         return <AdminStatusScreen darkMode={darkMode} />;
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      {/* Top Header (Same as Citizen Space) */}
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      {/* Admin Bottom Tabs */}
      <View style={[styles.bottomNav, darkMode && styles.bottomNavDark]}>
        <TabItem icon={BarChart3} label="Status" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
        <TabItem icon={AlertTriangle} label="Flags" active={activeTab === 'flags'} onPress={() => setActiveTab('flags')} />
        <TabItem icon={Settings} label="System" active={activeTab === 'system'} onPress={() => setActiveTab('system')} />
        <TabItem icon={ShieldCheck} label="Admin" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
      </View>
    </View>
  );
}

const TabItem = ({ icon: Icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <Icon size={22} color={active ? '#1E88E5' : '#9CA3AF'} />
    <Text style={[styles.navLabel, active && {color: '#1E88E5', fontWeight: 'bold'}]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  mainContent: { flex: 1, paddingBottom: 80 },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 20 },
  bottomNavDark: { backgroundColor: '#1F2937', borderTopColor: '#374151' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4 }
});