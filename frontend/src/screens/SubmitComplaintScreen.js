import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';

import { Camera, Image as ImageIcon, MapPin, Sparkles, Trash2, ChevronDown, ChevronUp, RefreshCw, Clock, CheckCircle, Shield } from 'lucide-react-native';
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;


export default function SubmitComplaintScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // Changed to store object {id, name}
  const [categories, setCategories] = useState([]); // New state for fetched categories
  const [images, setImages] = useState([]); // Changed to array for multiple images
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  
  const [location, setLocation] = useState({ latitude: null, longitude: null, fullAddress: null,});
  const [locationTime, setLocationTime] = useState(null);
  
  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // System State
  const [locating, setLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/complaints/categories`, {
          headers: {
            'bypass-tunnel-reminder': 'true'
          }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        Alert.alert('Error', 'Failed to load categories.');
      }
    };
    fetchCategories();
  }, []);

  //Permissions
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return false;
    }
    return true;
  };

  const requestLibraryPermission = async () => { // New permission request
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return false;
    }
    return true;
  };

  //Location
  // Convert DMS array to decimal degrees
  const convertDMSToDecimal = (dms, ref) => {
    if (!dms) return null;
    const [deg, min, sec] = dms;
    let dec = deg + min / 60 + sec / 3600;

    if (ref === 'S' || ref === 'W') dec = -dec;
    return dec;
  };

  const extractLocationFromExif = (exif) => {
    if (!exif) return null;

    const latitude = exif.GPSLatitude
      ? Array.isArray(exif.GPSLatitude)
        ? convertDMSToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef)
        : exif.GPSLatitudeRef === 'S' ? -exif.GPSLatitude : exif.GPSLatitude
      : null;

    const longitude = exif.GPSLongitude
      ? Array.isArray(exif.GPSLongitude)
        ? convertDMSToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef)
        : exif.GPSLongitudeRef === 'W' ? -exif.GPSLongitude : exif.GPSLongitude
      : null;

    if (latitude !== null && longitude !== null) return { latitude, longitude };
    return null;
};

const updateLocationWithAddress = async (latitude, longitude) => {
  setLocating(true);

  try {
    const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });

    const areaName = addr.name || addr.street || addr.subregion || addr.city || 'Unknown area';
    const district = addr.district || addr.city || '';
    const region = addr.region || '';

    setLocation({
      latitude,
      longitude,
      areaName,
      district,
      region,
      fullAddress: `${areaName}, ${district}, ${region}`,
    });

    setLocationTime(new Date().toLocaleString());
  } catch (err) {
    console.warn('Reverse geocode failed', err);
    setLocation({
      latitude,
      longitude,
      fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    });
    setLocationTime(new Date().toLocaleString());
  } finally {
    setLocating(false);
  }
};

  
  //Camera
  const handleImagePick = async () => {
    const hasPermission = await requestCameraPermission();
    const locPerm = await requestLocationPermission();
    if (!locPerm || !hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
      exif: true,
    });

    // Camera
    if (result.assets?.length > 0) {
      const asset = result.assets[0];
      setImages(prev => [...prev, asset.uri]); // Append new image to array

      const exifLocation = extractLocationFromExif(asset.exif);
      if (exifLocation) {
        await updateLocationWithAddress(exifLocation.latitude, exifLocation.longitude);
        return;
      }

      const gps = await Location.getCurrentPositionAsync({});
      await updateLocationWithAddress(gps.coords.latitude, gps.coords.longitude);
    }
  };

  const handleLibraryPick = async () => { // New function for picking from library
    const hasPermission = await requestLibraryPermission();
    const locPerm = await requestLocationPermission();
    if (!locPerm || !hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,  
      quality: 1,
      allowsMultipleSelection: true, // Allow multiple selections
      exif: true, 
    });

    if (result.assets?.length > 0) {
      const asset = result.assets[0];
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)]); // Append new images to array

      const exifLocation = extractLocationFromExif(asset.exif);
      if (exifLocation) {
        await updateLocationWithAddress(exifLocation.latitude, exifLocation.longitude);
        return;
      }

      const gps = await Location.getCurrentPositionAsync({});
      await updateLocationWithAddress(gps.coords.latitude, gps.coords.longitude);
    }
  };

      const handleGPSDetect = async () => {
        setLocating(true);
        try {
          const hasLocationPerm = await requestLocationPermission();
          if (!hasLocationPerm) throw new Error('Location permission denied');

          const gps = await Location.getCurrentPositionAsync({});
          await updateLocationWithAddress(gps.coords.latitude, gps.coords.longitude);
        } catch (err) {
          Alert.alert('Error', 'Unable to detect location.');
        } finally {
          setLocating(false);
        }
      };

      const handleSubmit = async () => {
      const newErrors = {};
      if (images.length === 0) newErrors.image = 'Evidence photos are mandatory.'; // Update validation
      if (!title) newErrors.title = 'Title is required.';
      if (!selectedCategory) newErrors.category = 'Category is required.';
      if (!location.latitude || !location.longitude) newErrors.location = 'GPS location is required.';
  
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        Alert.alert('Missing Info', 'Please fill in all required fields.');
        return;
      }
  
      setIsSubmitting(true);
      setErrors({});
  
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('citizenUid', auth.currentUser?.uid);
      formData.append('categoryId', selectedCategory.id);
  
      if (!auth.currentUser?.uid) {
        Alert.alert('Error', 'Could not identify user. Please log in again.');
        setIsSubmitting(false);
        return;
      }
  
      // Loop through multiple images and append to FormData
      images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('images', { // Append each image with the field name 'images'
          uri: imageUri,
          name: filename,
          type: type,
        });
      });
      
      try {
        const response = await axios.post(`${API_URL}/api/complaints`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'bypass-tunnel-reminder': 'true'
          }
        });
  
        if (response.status === 201) {
          Alert.alert("Success", "Complaint Submitted Successfully!");
          navigation.navigate('Feed');
        } else {
          Alert.alert('Error', 'Failed to submit complaint. Please try again.');
        }
      } catch (error) {
        console.error('Submit Complaint Error:', error);
        const message = error.response?.data?.message || 'An unexpected error occurred.';
        Alert.alert('Submission Failed', message);
      } finally {
        setIsSubmitting(false);
      }
    };
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Submit Complaint</Text>
        
        <View style={[styles.card, darkMode && styles.cardDark]}>
           
           {/* 1. Image Upload (Mandatory) */}
           <Text style={[styles.label, darkMode && styles.textWhite]}>Evidence Photos <Text style={styles.req}>*</Text></Text>
           {images.length > 0 && (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {images.map((uri, index) => (
                <View key={index} style={styles.previewContainer}>
                <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

               <TouchableOpacity onPress={() => setImages(images.filter((_, i) => i !== index))} style={styles.removeImgBtn}>
                 <Trash2 size={16} color="white" />
                 <Text style={styles.removeImgText}>Remove</Text>
               </TouchableOpacity>
              </View>
              ))}
             </ScrollView>
           )}

             <View style={styles.uploadRow}>
              <TouchableOpacity onPress={handleImagePick} style={[styles.uploadBtn,images.length > 0 ? styles.uploadBtnSmall : null,errors.image && styles.errorBorder]}>
                 <Camera size={images.length > 0 ? 18 : 24} color="#1E88E5" />
                 <Text style={images.length > 0 ? styles.uploadTextSmall : styles.uploadText}>Camera</Text>
               </TouchableOpacity>

               <TouchableOpacity onPress={handleLibraryPick} style={[styles.uploadBtn,images.length > 0 ? styles.uploadBtnSmall : null,errors.image && styles.errorBorder]}>
                 <ImageIcon size={images.length > 0 ? 18 : 24} color="#1E88E5" />
                 <Text style={images.length > 0 ? styles.uploadTextSmall : styles.uploadText}>Gallery</Text>
               </TouchableOpacity>
             </View>
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
               {selectedCategory ? selectedCategory.name : "Select a Category"}
             </Text>
             {isDropdownOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
           </TouchableOpacity>
           
           {isDropdownOpen && (
             <View style={[styles.dropdownList, darkMode && styles.cardDark]}>
               {categories.map((cat, index) => (
                 <TouchableOpacity 
                   key={cat.id} 
                   style={[styles.dropdownItem, darkMode && styles.dropdownItemDark]}
                   onPress={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                 >
                   <Text style={[styles.dropdownItemText, darkMode && styles.textWhite]}>{cat.name}</Text>
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

           {/* 5. Location */}
            <View style={styles.locationSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.label, darkMode && styles.textWhite, { marginBottom: 0 }]}>
                  Location Details <Text style={styles.req}>*</Text>
                </Text>

                <TouchableOpacity onPress={handleGPSDetect} style={styles.refreshBtn}>
                  <RefreshCw size={14} color="#1E88E5" />
                  <Text style={styles.refreshText}>Refresh GPS</Text>
                </TouchableOpacity>
              </View>

              {locating ? (
                <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { alignItems: 'center', justifyContent: 'center' }]}>
                  <ActivityIndicator color="#1E88E5" />
                  <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
                    Detecting location...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Location Coordinates */}
                  <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MapPin size={16} color="#1E88E5" />
                      <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
                        Detected Coordinates
                      </Text>
                    </View>

                    <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>
                      {location.fullAddress
                        ? location.fullAddress
                        : location.latitude && location.longitude
                          ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                          : 'No location detected'}
                    </Text>

                  </View>

                  {/* Timestamp */}
                  <View style={[styles.readOnlyBox, darkMode && styles.readOnlyBoxDark, { marginTop: 8 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Clock size={16} color="#1E88E5" />
                      <Text style={[styles.readOnlyLabel, darkMode && styles.textGray]}>
                        Timestamp
                      </Text>
                    </View>

                    <Text style={[styles.readOnlyValue, darkMode && styles.textWhite]}>
                      {locationTime || '—'}
                    </Text>
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
  previewContainer: { width:270, height:180, borderRadius:12, overflow:'hidden', marginRight:12, position:'relative' }, // Updated
  previewImage: { width: '100%', height: '100%' },
  uploadBtnSmall: { flex: 1, height: 40, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }, // New
  uploadTextSmall: { color: '#1E88E5', marginTop: 4, fontSize: 10, fontWeight: '600' }, // New

  removeImgBtn: { position:'absolute', bottom:10, right:10, backgroundColor:'rgba(0,0,0,0.6)', flexDirection:'row', padding:6, borderRadius:8, alignItems:'center' },
  removeImgText: { color:'white', fontSize:12, marginLeft:4 },
  addImgBtn: { position:'absolute', bottom:10, right:90, backgroundColor:'rgba(0,0,0,0.6)', flexDirection:'row', padding:6, borderRadius:8, alignItems:'center' }, // New
  addImgText: { color:'white', fontSize:12, marginLeft:4, alignItems: 'center'  }, // New

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