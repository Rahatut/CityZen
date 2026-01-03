import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Navigation from '../components/Navigation';
import BottomNav from '../components/BottomNav';
import { useComplaint } from '../context/ComplaintContext';
import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL;


export default function SubmitComplaintScreen({ navigation, onLogout, darkMode, toggleDarkMode }) {
      const {
      images,
      location,
      title,
      setTitle,
      description,
      setDescription,
      selectedCategory,
      setAssignedAuthorities, // Destructure setAssignedAuthorities
    } = useComplaint();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [recommendedAuthorities, setRecommendedAuthorities] = useState([]);
  const [chosenAuthorities, setChosenAuthorities] = useState([]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const handleChooseAuthority = (authorityId) => {
    setChosenAuthorities(prev => {
      if (prev.includes(authorityId)) {
        return prev.filter(id => id !== authorityId); // Deselect
      } else {
        return [...prev, authorityId]; // Select
      }
    });
  };

  useEffect(() => {
    const fetchRecommendedAuthority = async () => {
      if (selectedCategory && location.latitude && location.longitude) {
        setLoadingRecommendation(true);
        try {
          const response = await axios.get(`${API_URL}/api/complaints/recommend-authorities`, {
            params: {
              category: selectedCategory.name,
              latitude: location.latitude,
              longitude: location.longitude,
              location_string: location.fullAddress,
            },
            headers: {
              'bypass-tunnel-reminder': 'true'
            }
          });
          setRecommendedAuthorities(response.data);
        } catch (error) {
          console.error('Error fetching recommended authority:', error);
        } finally {
          setLoadingRecommendation(false);
        }
      }
    };

    // Debounce the fetch
    const handler = setTimeout(() => {
        fetchRecommendedAuthority();
    }, 1000); // 1 second debounce

    return () => {
        clearTimeout(handler);
    };
  }, [selectedCategory, location, description]);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!title) newErrors.title = 'Title is required.';
    if (images.length === 0) newErrors.image = 'Evidence photos are mandatory.';
    if (!selectedCategory) newErrors.category = 'Category is required.';
    if (!location?.latitude || !location?.longitude) newErrors.location = 'GPS location is required.';
    if (chosenAuthorities.length === 0) newErrors.authorities = 'Please select at least one authority.';

    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join('\n');
      Alert.alert('Missing Info', errorMessages);
      setErrors(newErrors);
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
    formData.append('chosenAuthorities', JSON.stringify(chosenAuthorities));

    if (!auth.currentUser?.uid) {
      Alert.alert('Error', 'Could not identify user. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    images.forEach((imageUri, index) => {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('images', {
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

        // Map chosen authority IDs to their names and save to context
        const assignedAuthorityNames = chosenAuthorities.map(chosenId => {
            const authority = recommendedAuthorities.find(rec => rec.authorityCompanyId === chosenId);
            return authority ? authority.authorityName : 'Unknown Authority';
        });
        setAssignedAuthorities(assignedAuthorityNames);

        navigation.navigate('SubmittedComplaint');
      } else {
        Alert.alert('Error', 'Failed to submit complaint. Please try again.');
      }
    } catch (error) {
      console.error('Submit Complaint Error:', error.response?.data || error.message);
      
      let errorMessage = 'An unexpected error occurred.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Network timeout. Please check your connection and try again.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network Error. Could not connect to the server. Please ensure the backend is running and the API URL is correct.';
      } else {
        errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      }
      
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[styles.heading, darkMode && styles.textWhite]}>Select Authority</Text>

        <View style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={[styles.label, darkMode && styles.textWhite]}>Title <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark, errors.title && styles.errorBorder]}
            placeholder="e.g. Large Pothole on Main St"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, darkMode && styles.textWhite, { marginTop: 12 }]}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }, darkMode && styles.inputDark]}
            placeholder="Add any additional details (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* AI Recommended Authorities */}
          {loadingRecommendation && <ActivityIndicator style={{ marginVertical: 16 }} color="#1E88E5" />}
           {recommendedAuthorities.length > 0 && (
             <View style={{ marginTop: 16 }}>
               <Text style={[styles.label, darkMode && styles.textWhite]}>AI Recommended Authorities</Text>
               {recommendedAuthorities.map((authority, index) => (
                 <TouchableOpacity 
                    key={index} 
                    onPress={() => handleChooseAuthority(authority.authorityCompanyId)}
                    style={[
                        styles.card, 
                        darkMode && styles.cardDark, 
                        { padding: 16, marginBottom: 12 },
                        chosenAuthorities.includes(authority.authorityCompanyId) && styles.selectedCard
                    ]}
                  >
                   <Text style={[styles.dropdownText, darkMode && styles.textWhite, { fontWeight: 'bold' }]}>
                     {authority.authorityName}
                   </Text>
                   <Text style={[styles.readOnlyLabel, darkMode && styles.textGray, { marginTop: 4 }]}>
                     {authority.reason}
                    </Text>
                   {/*<Text style={[styles.readOnlyLabel, darkMode && styles.textGray, { marginTop: 4, fontStyle: 'italic' }]}>
                     Confidence: {(authority.confidence * 100).toFixed(0)}%
                    </Text>*/}
                 </TouchableOpacity>
               ))}
             </View>
           )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
            >
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit</Text>}
            </TouchableOpacity>
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
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
  textWhite: { color: 'white' },
  req: { color: '#EF4444' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedCard: {
    borderColor: '#1E88E5',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
  label: { marginBottom: 8, fontWeight: '600', color: '#374151', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, color: '#1F2937' },
  inputDark: { borderColor: '#374151', color: 'white', backgroundColor: '#374151' },
  errorBorder: { borderColor: '#EF4444' },
  submitBtn: {
    backgroundColor: '#1E88E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1, // Make it take equal space
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 16 },
  backButton: {
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1, // Make it take equal space
  },
  backButtonText: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  },
});

