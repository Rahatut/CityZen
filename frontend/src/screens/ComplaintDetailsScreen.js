import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { MapPin, Calendar, Heart, ArrowLeft, CheckCircle, Circle } from 'lucide-react-native';

export default function ComplaintDetailsScreen({ route, navigation, onLogout, darkMode, toggleDarkMode }) {
  const { id } = route.params || { id: 1 };
  const [upvotes, setUpvotes] = useState(24);
  const steps = ['Submitted', 'Accepted', 'In Progress', 'Resolved'];
  const currentStep = 2; 

  const complaint = {
    title: 'Pothole on Main Street',
    category: 'Roads & Infrastructure',
    area: 'Ward 3',
    status: 'In Progress',
    image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?w=1080',
    description: 'Large pothole causing traffic slowdowns near the school crossing.',
    date: '2 days ago',
    coords: '40.7128° N, 74.0060° W'
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={darkMode ? 'white' : '#374151'} />
          <Text style={[styles.backText, darkMode && styles.textWhite]}>Back</Text>
        </TouchableOpacity>

        <Image source={{ uri: complaint.image }} style={styles.image} resizeMode="cover" />

        <View style={styles.content}>
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.title, darkMode && styles.textWhite]}>{complaint.title}</Text>
            <View style={[styles.badge, { backgroundColor: '#FFEDD5', alignSelf: 'flex-start', marginBottom: 16 }]}>
               <Text style={{ color: '#C2410C', fontWeight: 'bold' }}>{complaint.status}</Text>
            </View>
            <Text style={[styles.description, darkMode && styles.textGray]}>{complaint.description}</Text>
            <TouchableOpacity onPress={() => setUpvotes(p => p + 1)} style={[styles.upvoteBtn, darkMode && styles.upvoteBtnDark]}>
              <Heart size={20} color={darkMode ? 'white' : 'black'} />
              <Text style={[styles.upvoteText, darkMode && styles.textWhite]}>Upvote ({upvotes})</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline */}
          <View style={[styles.card, darkMode && styles.cardDark]}>
            <Text style={[styles.sectionHeader, darkMode && styles.textWhite]}>Status Timeline</Text>
            <View style={styles.timeline}>
              {steps.map((step, index) => (
                <View key={step} style={styles.stepContainer}>
                  {index <= currentStep ? <CheckCircle size={20} color="#16A34A" /> : <Circle size={20} color="#D1D5DB" />}
                  <Text style={[styles.stepText, index <= currentStep && styles.stepTextActive]}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  backBtn: { flexDirection: 'row', padding: 16 },
  backText: { marginLeft: 8, fontSize: 16, color: '#374151' },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  image: { width: '100%', height: 250 },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  description: { color: '#4B5563', lineHeight: 22, marginBottom: 20 },
  upvoteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stepContainer: { alignItems: 'center', flex: 1 },
  stepText: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  stepTextActive: { color: '#16A34A', fontWeight: 'bold' },
});