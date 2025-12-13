import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, ActivityIndicator, Image, Alert, Platform 
} from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
// FIXED: Added CheckCircle and Shield to imports
import { 
  Camera, Image as ImageIcon, MapPin, Sparkles, X, Trash2, 
  ChevronDown, ChevronUp, RefreshCw, Clock, CheckCircle, Shield 
} from 'lucide-react-native';

export default function SubmitComplaintScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [image, setImage] = useState(null);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  
  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // System State
  const [locating, setLocating] = useState(true); // Start true for auto-detect
  const [locationData, setLocationData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'Roads & Highways', 'WASA (Water)', 'DESCO/DPDC (Power)', 
    'Waste Management', 'Public Safety', 'Drainage', 'Others'
  ];

  // Auto-Detect GPS on Mount
  useEffect(() => {
    handleGPSDetect();
  }, []);

  const handleGPSDetect = () => {
    setLocating(true);
    setLocationData(null);
    // Simulate GPS Delay
    setTimeout(() => {
      setLocating(false);
      setLocationData({
        ward: 'Ward 3 - South District',
        coords: '23.8103° N, 90.4125° E',
        time: new Date().toLocaleString()
      });
    }, 2500);
  };

  const handleImagePick = (source) => {
    const mockImage = source === 'camera' 
      ? 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80' 
      : 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80';
    
    setImage(mockImage);
    setErrors(prev => ({ ...prev, image: null }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!image) newErrors.image = 'Evidence photo is mandatory.';
    if (!title) newErrors.title = 'Title is required.';
    if (!selectedCategory) newErrors.category = 'Category is required.';
    if (!locationData) newErrors.location = 'GPS location is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Success", "Complaint Submitted Successfully!");
      navigation.navigate('Feed');
    }, 2000);
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Submit Complaint</Text>
        
        <View style={[styles.card, darkMode && styles.cardDark]}>
           
           {/* 1. Image Upload (Mandatory) */}
           <Text style={[styles.label, darkMode && styles.textWhite]}>Evidence Photo <Text style={styles.req}>*</Text></Text>
           {image ? (
             <View style={styles.previewContainer}>
               <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
               <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImgBtn}>
                 <Trash2 size={16} color="white" />
                 <Text style={styles.removeImgText}>Remove</Text>
               </TouchableOpacity>
             </View>
           ) : (
             <View style={styles.uploadRow}>
               <TouchableOpacity onPress={() => handleImagePick('camera')} style={[styles.uploadBtn, errors.image && styles.errorBorder]}>
                 <Camera size={24} color="#1E88E5" />
                 <Text style={styles.uploadText}>Camera</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => handleImagePick('gallery')} style={[styles.uploadBtn, errors.image && styles.errorBorder]}>
                 <ImageIcon size={24} color="#1E88E5" />
                 <Text style={styles.uploadText}>Gallery</Text>
               </TouchableOpacity>
             </View>
           )}
           {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}

           {/* AI Placeholder */}
           <View style={styles.aiBox}>
             <Sparkles size={16} color="#9333EA" />
             <Text style={styles.aiText}>AI detected: "Pothole" (Confidence: 85%)</Text>
           </View>

           {/* 2. Title */}
           <Text style={[styles.label, darkMode && styles.textWhite]}>Title <Text style={styles.req}>*</Text></Text>
           <TextInput 
             style={[styles.input, darkMode && styles.inputDark, errors.title && styles.errorBorder]} 
             placeholder="e.g. Broken Street Light" 
             placeholderTextColor="#9CA3AF"
             value={title}
             onChangeText={setTitle}
           />

           {/* 3. Category Dropdown */}
           <Text style={[styles.label, darkMode && styles.textWhite]}>Category <Text style={styles.req}>*</Text></Text>
           <TouchableOpacity 
             onPress={() => setIsDropdownOpen(!isDropdownOpen)}
             style={[styles.dropdownHeader, darkMode && styles.inputDark, errors.category && styles.errorBorder]}
           >
             <Text style={[styles.dropdownText, !selectedCategory && styles.placeholderText, darkMode && styles.textWhite]}>
               {selectedCategory || "Select a Category"}
             </Text>
             {isDropdownOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
           </TouchableOpacity>
           
           {isDropdownOpen && (
             <View style={[styles.dropdownList, darkMode && styles.cardDark]}>
               {categories.map((cat, index) => (
                 <TouchableOpacity 
                   key={index} 
                   style={[styles.dropdownItem, darkMode && styles.dropdownItemDark]}
                   onPress={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                 >
                   <Text style={[styles.dropdownItemText, darkMode && styles.textWhite]}>{cat}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           )}

           {/* 4. Description */}
           <Text style={[styles.label, darkMode && styles.textWhite, { marginTop: 12 }]}>Description</Text>
           <TextInput 
             style={[styles.input, { height: 80, textAlignVertical: 'top' }, darkMode && styles.inputDark]} 
             placeholder="Additional details (Optional)..." 
             placeholderTextColor="#9CA3AF"
             multiline
             value={description}
             onChangeText={setDescription}
           />

           {/* 5. Location (Auto-Detected & Read-Only) */}
           <View style={styles.locationSection}>
             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
               <Text style={[styles.label, darkMode && styles.textWhite, { marginBottom: 0 }]}>Location Details <Text style={styles.req}>*</Text></Text>
               <TouchableOpacity onPress={handleGPSDetect} style={styles.refreshBtn}>
                 <RefreshCw size={14} color="#1E88E5" />
                 <Text style={styles.refreshText}>Refresh GPS</Text>
               </TouchableOpacity>
             </View>

             {locating ? (
               <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { alignItems: 'center', justifyContent: 'center' }]}>
                 <ActivityIndicator color="#1E88E5" />
                 <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>Pinpointing location...</Text>
               </View>
             ) : (
               <>
                 <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark]}>
                   <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                     <MapPin size={16} color="#1E88E5" />
                     <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>Detected Ward/Area</Text>
                   </View>
                   <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>{locationData?.ward}</Text>
                   <Text style={{fontSize: 10, color: '#9CA3AF', marginTop: 2}}>{locationData?.coords}</Text>
                 </View>

                 <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { marginTop: 8 }]}>
                   <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                     <Clock size={16} color="#1E88E5" />
                     <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>Timestamp</Text>
                   </View>
                   <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>{locationData?.time}</Text>
                 </View>
               </>
             )}
           </View>

           {/* 6. Privacy & Submit */}
           <TouchableOpacity onPress={() => setPrivacyEnabled(!privacyEnabled)} style={styles.privacyRow}>
             <View style={[styles.checkbox, privacyEnabled && styles.checkboxActive]}>
               {privacyEnabled && <CheckCircle size={14} color="white" />}
             </View>
             <Text style={[styles.privacyText, darkMode && styles.textGray]}>Blur faces or license plates (Privacy)</Text>
             <Shield size={16} color="#6B7280" style={{ marginLeft: 'auto' }} />
           </TouchableOpacity>

           <TouchableOpacity 
             onPress={handleSubmit} 
             style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
             disabled={isSubmitting}
           >
             {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
           </TouchableOpacity>

        </View>
      </ScrollView>
      <BottomNav navigation={navigation} darkMode={darkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  darkContainer: { backgroundColor: '#111827' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  req: { color: '#EF4444' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  label: { marginBottom: 8, fontWeight: '600', color: '#374151', fontSize: 14 },
  
  // Image
  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  uploadBtn: { flex: 1, height: 80, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  uploadText: { color: '#1E88E5', marginTop: 4, fontSize: 12, fontWeight: '600' },
  previewContainer: { height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  removeImgBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', padding: 6, borderRadius: 8, alignItems: 'center' },
  removeImgText: { color: 'white', fontSize: 12, marginLeft: 4 },

  aiBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F3E8FF', padding: 10, borderRadius: 8 },
  aiText: { fontSize: 12, color: '#9333EA', marginLeft: 8, fontWeight: '500' },

  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#1F2937' },
  inputDark: { borderColor: '#374151', color: 'white', backgroundColor: '#374151' },
  errorBorder: { borderColor: '#EF4444', borderWidth: 1 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 12, marginTop: -8 },

  // Dropdown
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 4 },
  dropdownText: { fontSize: 16, color: '#1F2937' },
  placeholderText: { color: '#9CA3AF' },
  dropdownList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  dropdownItemDark: { backgroundColor: '#374151', borderBottomColor: '#4B5563' },
  dropdownItemText: { color: '#374151' },

  // Location Read-Only
  locationSection: { marginBottom: 16, marginTop: 4 },
  readOnlyBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  readOnlyBoxDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  readOnlyLabel: { fontSize: 12, color: '#6B7280', marginLeft: 6 },
  readOnlyValue: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginLeft: 22 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { color: '#1E88E5', fontSize: 12, fontWeight: 'bold' },

  privacyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  privacyText: { fontSize: 14, color: '#374151' },

  submitBtn: { backgroundColor: '#1E88E5', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  // Success Screen
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  successSub: { color: '#6B7280', fontSize: 16, marginBottom: 32 },
  summaryCard: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 32 },
  summaryLabel: { color: '#6B7280', fontSize: 12 },
  summaryVal: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
  viewStatusBtn: { width: '100%', backgroundColor: '#1E88E5', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  viewStatusText: { color: 'white', fontWeight: 'bold' },
  submitAgainBtn: { width: '100%', padding: 16, alignItems: 'center' },
  submitAgainText: { color: '#1E88E5', fontWeight: '600' }
});