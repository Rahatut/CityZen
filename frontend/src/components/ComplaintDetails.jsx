import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { MapPin, Calendar, Heart, MessageSquare, Upload, ArrowLeft } from 'lucide-react-native';

export default function ComplaintDetails({ onLogout, darkMode, toggleDarkMode, navigation, route }) {
  // Use route params for ID
  const id = route?.params?.id || '1';
  const [upvotes, setUpvotes] = useState(24);
  const [newComment, setNewComment] = useState('');

  const complaint = {
    id: 1,
    title: 'Pothole on Main Street',
    category: 'Roads & Infrastructure',
    area: 'Ward 3 - South District',
    status: 'In Progress',
    image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?w=1080',
    date: '2 days ago',
    description: 'There is a large pothole on Main Street near the intersection with Oak Avenue...',
    submittedBy: 'User #4532',
    latitude: '40.7128',
    longitude: '-74.0060'
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      Alert.alert("Success", "Comment added successfully!");
      setNewComment('');
    }
  };

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="flex-row items-center p-4"
        >
          <ArrowLeft size={20} color={darkMode ? '#D1D5DB' : '#4B5563'} />
          <Text className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Back</Text>
        </TouchableOpacity>

        {/* Image */}
        <Image 
          source={{ uri: complaint.image }} 
          className="w-full h-64 bg-gray-300" 
          resizeMode="cover"
        />

        <View className="p-4">
          {/* Header */}
          <View className={`p-4 rounded-xl border shadow-sm mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
             <Text className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{complaint.title}</Text>
             
             <View className="flex-row flex-wrap gap-2 mb-4">
               <View className="bg-orange-100 px-3 py-1 rounded-full">
                 <Text className="text-orange-700 text-xs font-bold">{complaint.status}</Text>
               </View>
               <View className={`px-3 py-1 rounded-full ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                 <Text className="text-[#1E88E5] text-xs">{complaint.category}</Text>
               </View>
             </View>

             <TouchableOpacity 
               onPress={() => setUpvotes(p => p + 1)}
               className={`flex-row justify-center items-center py-2 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
             >
               <Heart size={18} color={darkMode ? 'white' : 'black'} />
               <Text className={`ml-2 font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Upvote ({upvotes})</Text>
             </TouchableOpacity>
          </View>

          {/* Description */}
          <View className={`p-4 rounded-xl border shadow-sm mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
             <Text className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Description</Text>
             <Text className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{complaint.description}</Text>
             
             <View className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-4">
                <View className="flex-row items-center">
                   <MapPin size={16} color="#1E88E5" />
                   <Text className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{complaint.area}</Text>
                </View>
                <View className="flex-row items-center">
                   <Calendar size={16} color="#1E88E5" />
                   <Text className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{complaint.date}</Text>
                </View>
             </View>
          </View>

          {/* Comment Input */}
          <View className={`p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Text className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add Comment</Text>
            <View className={`flex-row items-center border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
               <TextInput 
                 value={newComment}
                 onChangeText={setNewComment}
                 placeholder="Write a comment..."
                 placeholderTextColor={darkMode ? '#9CA3AF' : '#6B7280'}
                 className={`flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}
               />
               <TouchableOpacity onPress={handleAddComment}>
                 <MessageSquare size={20} color="#1E88E5" />
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}