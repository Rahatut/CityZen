import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Tags, Building2, UserX, ArrowLeft, Plus, UserCheck } from 'lucide-react-native';
import api from '../services/api';

export default function AdminSystemScreen({ darkMode }) {
  const [view, setView] = useState('main'); 
  const [categories, setCategories] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newDept, setNewDept] = useState('');
  
  // Anonymous Data with Strikes
  const [offenders] = useState([
    { id: 'User 202', strikes: 4, last: 'Graphic Content' }, // This user is 1 strike away from ban
    { id: 'User 551', strikes: 1, last: 'Spam' }
  ]);
  const [bannedUsers, setBannedUsers] = useState([
    { id: 'User 001', reason: 'Abusive Language', date: 'Dec 20' }
  ]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchDepartments()]);
      setLoading(false);
    };
    bootstrap();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/complaints/categories');
      setCategories(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load categories.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepts(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load departments.');
    }
  };

  const handleAdd = async (type) => {
    const value = type === 'cat' ? newCategory.trim() : newDept.trim();
    if (!value) {
      Alert.alert('Missing info', `Please enter a ${type === 'cat' ? 'category' : 'department'} name.`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (type === 'cat') {
        await api.post('/complaints/categories', { name: value });
        setNewCategory('');
        await fetchCategories();
      } else {
        await api.post('/departments', { name: value });
        setNewDept('');
        await fetchDepartments();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Unable to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiftBan = (id) => {
    Alert.alert("Lift Ban", `Unban ${id}?`, [
      { text: "Cancel" },
      { text: "Lift Ban", onPress: () => setBannedUsers(bannedUsers.filter(u => u.id !== id)) }
    ]);
  };

  if (view === 'main') return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, darkMode && {color: 'white'}]}>System Config</Text>
      <MenuBtn icon={Tags} label="Categories" count={categories.length} color="#8B5CF6" darkMode={darkMode} onPress={() => setView('cat')} />
      <MenuBtn icon={Building2} label="Departments" count={depts.length} color="#F59E0B" darkMode={darkMode} onPress={() => setView('dept')} />
      <MenuBtn icon={UserX} label="Security & Bans" count={bannedUsers.length} color="#EF4444" darkMode={darkMode} onPress={() => setView('bans')} />
    </ScrollView>
  );

  const SubHeader = ({ title }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setView('main')}><ArrowLeft color={darkMode ? "white" : "black"} /></TouchableOpacity>
      <Text style={[styles.subTitle, darkMode && {color: 'white'}]}>{title.toUpperCase()}</Text>
      <TouchableOpacity><Plus color="#1E88E5" /></TouchableOpacity>
    </View>
  );

  if (view === 'cat' || view === 'dept') return (
    <View style={styles.container}>
      <SubHeader title={view === 'cat' ? "Categories" : "Departments"} />
      {loading ? (
        <ActivityIndicator color="#1E88E5" />
      ) : (
        <FlatList 
          data={view === 'cat' ? categories : depts}
          keyExtractor={(item) => String(item?.id || item?.name)}
          renderItem={({ item }) => (
            <View style={[styles.listItem, darkMode && styles.cardDark]}>
              <Text style={[styles.itemText, darkMode && {color: 'white'}]}>{item?.name || item}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.emptyText, darkMode && {color: 'white'}]}>No items yet.</Text>}
          ListFooterComponent={
            <View style={[styles.addCard, darkMode && styles.cardDark]}>
              <Text style={[styles.addLabel, darkMode && {color: 'white'}]}>Add {view === 'cat' ? 'Category' : 'Department'}</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, darkMode && styles.inputDark]}
                  placeholder={view === 'cat' ? 'e.g. Drainage' : 'e.g. DPHE'}
                  placeholderTextColor={darkMode ? '#9CA3AF' : '#9CA3AF'}
                  value={view === 'cat' ? newCategory : newDept}
                  onChangeText={(text) => view === 'cat' ? setNewCategory(text) : setNewDept(text)}
                />
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(view === 'cat' ? 'cat' : 'dept')} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color="white" /> : <Plus color="white" size={16} />}
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
    </View>
  );

  if (view === 'bans') return (
    <ScrollView style={styles.container}>
      <SubHeader title="Ban Analytics" />
      <Text style={styles.sectionLabel}>Frequent Violators (Anonymous)</Text>
      {offenders.map(user => (
        <View key={user.id} style={[styles.offenderCard, darkMode && styles.cardDark]}>
          <View style={styles.offRow}>
            <View><Text style={[styles.offId, darkMode && {color: 'white'}]}>{user.id}</Text><Text style={styles.offSub}>Last: {user.last}</Text></View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={[styles.strikeText, {color: user.strikes >= 4 ? '#EF4444' : '#F59E0B'}]}>{user.strikes}/5 Strikes</Text>
              <View style={styles.barBase}><View style={[styles.barFill, {width: `${(user.strikes/5)*100}%`, backgroundColor: user.strikes >= 4 ? '#EF4444' : '#F59E0B'}]} /></View>
            </View>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionLabel, {marginTop: 30}]}>Active Bans</Text>
      {bannedUsers.map(user => (
        <View key={user.id} style={[styles.listItem, darkMode && styles.cardDark]}>
          <View><Text style={[styles.itemText, darkMode && {color: 'white'}]}>{user.id}</Text><Text style={styles.offSub}>{user.reason}</Text></View>
          <TouchableOpacity style={styles.liftBtn} onPress={() => handleLiftBan(user.id)}><UserCheck size={16} color="#059669" /><Text style={styles.liftText}>Lift</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const MenuBtn = ({ icon: Icon, label, count, color, darkMode, onPress }) => (
  <TouchableOpacity style={[styles.menuItem, darkMode && styles.cardDark]} onPress={onPress}>
    <View style={[styles.iconCircle, {backgroundColor: `${color}15`}]}><Icon size={20} color={color} /></View>
    <View style={{flex: 1}}><Text style={[styles.menuLabel, darkMode && {color: 'white'}]}>{label}</Text><Text style={styles.menuSub}>{count} Active</Text></View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  subTitle: { fontSize: 16, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 15, marginBottom: 12, elevation: 2 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { fontWeight: 'bold', fontSize: 16 },
  menuSub: { fontSize: 11, color: '#9CA3AF' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10 },
  itemText: { fontWeight: 'bold' },
  cardDark: { backgroundColor: '#1F2937' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 10 },
  addCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginTop: 10 },
  addLabel: { fontWeight: 'bold', marginBottom: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginRight: 10 },
  inputDark: { backgroundColor: '#111827', color: 'white' },
  addBtn: { backgroundColor: '#1E88E5', padding: 12, borderRadius: 10 },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 15 },
  offenderCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10 },
  offRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offId: { fontWeight: 'bold' },
  offSub: { fontSize: 11, color: '#9CA3AF' },
  strikeText: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  barBase: { width: 60, height: 5, backgroundColor: '#F3F4F6', borderRadius: 3 },
  barFill: { height: '100%', borderRadius: 3 },
  liftBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  liftText: { color: '#059669', fontSize: 11, fontWeight: 'bold', marginLeft: 5 }
});