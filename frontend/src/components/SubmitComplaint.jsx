import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { Camera, MapPin, Sparkles, X } from 'lucide-react-native';

export default function SubmitComplaint({ onLogout, darkMode, toggleDarkMode, navigation }) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    'Roads & Infrastructure', 'Electricity', 'Water Supply', 'Waste Management', 
    'Public Safety', 'Drainage', 'Street Lights', 'Parks & Recreation', 'Other'
  ];

  const handleImagePick = () => {
    // In React Native, you would use expo-image-picker here.
    // For now, we mock it with a dummy image for the UI demo.
    setImagePreview('https://images.unsplash.com/photo-1709934730506-fba12664d4e4?w=1080');
    Alert.alert('Demo', 'Mock image selected. In real app, this opens Camera/Gallery.');
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.category) {
        Alert.alert('Missing Fields', 'Please fill in the title and category');
        return;
    }
    Alert.alert('Success', 'Complaint submitted successfully!');
    navigation?.navigate('Feed');
  };

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Submit Complaint</Text>
          <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Report an issue to help improve our city
          </Text>
        </View>

        <View className={`rounded-xl p-6 shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            {/* Title Input */}
            <View className="mb-4">
               <Text className={`mb-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Complaint Title</Text>
               <TextInput 
                 value={formData.title}
                 onChangeText={(t) => setFormData({...formData, title: t})}
                 placeholder="e.g., Pothole on Main St"
                 placeholderTextColor="#9CA3AF"
                 className={`border rounded-lg p-3 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
               />
            </View>

            {/* Category Select (Simplified as horizontal scroll for mobile) */}
            <View className="mb-4">
               <Text className={`mb-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                 {categories.map(cat => (
                   <TouchableOpacity 
                     key={cat}
                     onPress={() => setFormData({...formData, category: cat})}
                     className={`mr-2 px-4 py-2 rounded-full border ${formData.category === cat ? 'bg-[#1E88E5] border-[#1E88E5]' : (darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50')}`}
                   >
                     <Text className={formData.category === cat ? 'text-white font-bold' : (darkMode ? 'text-gray-300' : 'text-gray-700')}>
                        {cat}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            </View>

            {/* Description Input */}
            <View className="mb-4">
               <Text className={`mb-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</Text>
               <TextInput 
                 value={formData.description}
                 onChangeText={(t) => setFormData({...formData, description: t})}
                 placeholder="Provide details..."
                 placeholderTextColor="#9CA3AF"
                 multiline
                 numberOfLines={4}
                 textAlignVertical="top"
                 className={`border rounded-lg p-3 h-32 ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
               />
            </View>

            {/* Image Upload Area */}
            <View className="mb-6">
               <Text className={`mb-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Evidence Photo</Text>
               
               {imagePreview ? (
                 <View className="relative h-48 rounded-lg overflow-hidden">
                   <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
                   <TouchableOpacity 
                     onPress={() => setImagePreview(null)}
                     className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
                   >
                     <X size={20} color="white" />
                   </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity 
                   onPress={handleImagePick}
                   className={`h-40 border-2 border-dashed rounded-lg items-center justify-center ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}
                 >
                   <Camera size={32} color="#1E88E5" />
                   <Text className="text-[#1E88E5] mt-2 font-medium">Take Photo</Text>
                 </TouchableOpacity>
               )}
            </View>

            {/* Location (Static for Demo) */}
            <View className={`flex-row items-center p-3 rounded-lg mb-6 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <MapPin size={20} color="#1E88E5" />
                <View className="ml-3">
                   <Text className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Location Detected</Text>
                   <Text className="text-xs text-gray-500">Ward 3 - South District</Text>
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              onPress={handleSubmit}
              className="bg-[#1E88E5] py-4 rounded-xl items-center shadow-lg"
            >
              <Text className="text-white font-bold text-lg">Submit Complaint</Text>
            </TouchableOpacity>

        </View>
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}