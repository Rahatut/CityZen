import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Tags, Building2, UserX, ArrowLeft, Trash2, Plus, UserCheck } from 'lucide-react-native';
import api from '../services/api';

export default function AdminSystemScreen({ darkMode }) {
  const [view, setView] = useState('main'); 
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [depts, setDepts] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  
  // Anonymous Data with Strikes
  const [offenders] = useState([
    { id: 'User 202', strikes: 4, last: 'Graphic Content' }, // This user is 1 strike away from ban
    { id: 'User 551', strikes: 1, last: 'Spam' }
  ]);
  const [bannedUsers, setBannedUsers] = useState([
    { id: 'User 001', reason: 'Abusive Language', date: 'Dec 20' }
  ]);

  const handleLiftBan = (id) => {
    Alert.alert("Lift Ban", `Unban ${id}?`, [
      { text: "Cancel" },
      { text: "Lift Ban", onPress: () => setBannedUsers(bannedUsers.filter(u => u.id !== id)) }
    ]);
  };

  // Fetch categories from API
  const loadCategories = async () => {
    try {
      setCatLoading(true);
      const res = await api.get('/complaints/categories');
      const payload = res.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.categories || payload?.data?.categories || [];
      setCategories(list);
    } catch (err) {
      console.log('Failed to load categories', err?.response?.data || err.message);
      Alert.alert('Error', 'Could not load categories');
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadDepartments();
  }, []);

  // Fetch departments from API
  const loadDepartments = async () => {
    try {
      setDeptLoading(true);
      const res = await api.get('/authority-companies');
      const payload = res.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.companies || payload?.data?.companies || [];
      setDepts(list);
    } catch (err) {
      console.log('Failed to load departments', err?.response?.data || err.message);
      Alert.alert('Error', 'Could not load departments');
    } finally {
      setDeptLoading(false);
    }
  };

  const addDepartment = async () => {
    const name = newDeptName.trim();
    if (!name) {
      Alert.alert('Validation', 'Enter a department name');
      return;
    }
    try {
      setDeptLoading(true);
      const res = await api.post('/authority-companies', { name, description: '' });
      const created = res.data?.company || res.data;
      if (created) {
        setDepts((prev) => [...prev, created]);
        setNewDeptName('');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not add department';
      Alert.alert('Error', message);
    } finally {
      setDeptLoading(false);
    }
  };

  const deleteDepartment = async (id) => {
    Alert.alert('Delete Department', 'Are you sure you want to delete this department?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setDeptLoading(true);
            await api.delete(`/authority-companies/${id}`);
            setDepts((prev) => prev.filter((d) => `${d.id}` !== `${id}`));
            Alert.alert('Success', 'Department deleted');
          } catch (err) {
            const message = err?.response?.data?.message || 'Could not remove department';
            Alert.alert('Error', message);
          } finally {
            setDeptLoading(false);
          }
        },
        style: 'destructive'
      }
    ]);
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Validation', 'Enter a category name');
      return;
    }
    try {
      setCatLoading(true);
      const res = await api.post('/complaints/categories', { name });
      const created = res.data?.category || res.data;
      if (created) {
        setCategories((prev) => [...prev, created]);
        setNewCategoryName('');
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not add category';
      Alert.alert('Error', message);
    } finally {
      setCatLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setCatLoading(true);
            await api.delete(`/complaints/categories/${id}`);
            setCategories((prev) => prev.filter((c) => `${c.id}` !== `${id}`));
            Alert.alert('Success', 'Category deleted');
          } catch (err) {
            const message = err?.response?.data?.message || 'Could not remove category';
            Alert.alert('Error', message);
          } finally {
            setCatLoading(false);
          }
        },
        style: 'destructive'
      }
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
      {view === 'cat' && (
        <View style={styles.catForm}>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            placeholder="Add new category"
            placeholderTextColor="#9CA3AF"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCategory} disabled={catLoading}>
            <Text style={styles.addBtnText}>{catLoading ? 'Saving...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {view === 'dept' && (
        <View style={styles.catForm}>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            placeholder="Add new department"
            placeholderTextColor="#9CA3AF"
            value={newDeptName}
            onChangeText={setNewDeptName}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addDepartment} disabled={deptLoading}>
            <Text style={styles.addBtnText}>{deptLoading ? 'Saving...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {(catLoading && view === 'cat') || (deptLoading && view === 'dept') ? (
        <ActivityIndicator color="#1E88E5" style={{ marginVertical: 10 }} />
      ) : null}
      <FlatList
        data={view === 'cat' ? categories : depts}
        keyExtractor={(item, idx) => `${item.id || item}-${idx}`}
        renderItem={({ item }) => (
          <View style={[styles.listItem, darkMode && styles.cardDark]}>
            <Text style={[styles.itemText, darkMode && {color: 'white'}]}>{item.name || item}</Text>
            {view === 'cat' ? (
              <TouchableOpacity onPress={() => deleteCategory(item.id)}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => deleteDepartment(item.id)}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
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
  catForm: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  input: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  inputDark: { backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' },
  addBtn: { backgroundColor: '#1E88E5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  cardDark: { backgroundColor: '#1F2937' },
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