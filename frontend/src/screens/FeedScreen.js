import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { Search, MapPin, Heart } from 'lucide-react-native'; 

export default function FeedScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  const complaints = [
    { id: 1, title: 'Pothole on Main Street', category: 'Roads', area: 'Ward 3', status: 'In Progress', image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?w=1080', upvotes: 24, date: '2d ago' },
    { id: 2, title: 'Garbage Delay', category: 'Waste', area: 'Ward 1', status: 'Pending', image: 'https://images.unsplash.com/photo-1580767114670-c778cc443675?w=1080', upvotes: 18, date: '3d ago' }
  ];

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Complaints Feed</Text>
        <View style={[styles.searchBar, darkMode && styles.darkInput]}>
          <Search size={20} color="#9CA3AF" />
          <TextInput style={[styles.input, darkMode && styles.textWhite]} placeholder="Search..." placeholderTextColor="#9CA3AF" />
        </View>

        {complaints.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.card, darkMode && styles.cardDark]} onPress={() => navigation.navigate('ComplaintDetails', { id: item.id })}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'Pending' ? '#FEE2E2' : '#FFEDD5' }]}>
              <Text style={{ color: item.status === 'Pending' ? '#B91C1C' : '#C2410C', fontSize: 10, fontWeight: 'bold' }}>{item.status}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, darkMode && styles.textWhite]}>{item.title}</Text>
              <View style={styles.row}><MapPin size={14} color="#6B7280" /><Text style={styles.cardMeta}>{item.area}</Text></View>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <View style={styles.row}><Heart size={14} color="#6B7280" /><Text style={styles.cardMeta}>{item.upvotes}</Text></View>
                <Text style={styles.cardMeta}>{item.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
  textWhite: { color: 'white' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  darkInput: { backgroundColor: '#1F2937', borderColor: '#374151' },
  input: { marginLeft: 8, flex: 1, fontSize: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  cardImage: { width: '100%', height: 180 },
  statusBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cardMeta: { color: '#6B7280', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }
});