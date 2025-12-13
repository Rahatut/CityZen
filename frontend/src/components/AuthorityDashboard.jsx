import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react-native';

export default function AuthorityDashboard({ onLogout, darkMode, toggleDarkMode, navigation }) {
  const [selectedPriority, setSelectedPriority] = useState('All');
  
  const stats = {
    assigned: 15,
    inProgress: 6,
    todayDeadlines: 3,
    resolved: 42
  };

  const complaints = [
    {
      id: 'C-001',
      title: 'Pothole on Main Street',
      category: 'Roads & Infrastructure',
      area: 'Ward 3 - South',
      priority: 24,
      status: 'Assigned',
      date: '2 days ago'
    },
    // ... rest of your data ...
  ];

  const handleAction = (id, action) => {
    Alert.alert("Action", `${action} complaint ${id}`);
  };

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Authority Dashboard</Text>
          <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and resolve citizen complaints</Text>
        </View>

        {/* Overview Cards */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {/* Card 1 */}
          <View className={`w-[48%] mb-4 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <View className={`self-start p-3 rounded-lg mb-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <FileText size={24} color="#1E88E5" />
            </View>
            <Text className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.assigned}</Text>
            <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assigned</Text>
          </View>
          {/* Card 2 */}
          <View className={`w-[48%] mb-4 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <View className={`self-start p-3 rounded-lg mb-2 ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <TrendingUp size={24} color="#EA580C" />
            </View>
            <Text className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.inProgress}</Text>
            <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</Text>
          </View>
          {/* ... Add other cards similarly ... */}
        </View>

        {/* Priority Complaints */}
        <View className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Text className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Priority Queue</Text>
          
          {complaints.map((complaint) => (
            <View key={complaint.id} className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.id}</Text>
                  <Text className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{complaint.title}</Text>
                </View>
                <View className={`px-2 py-1 rounded bg-yellow-100`}>
                   <Text className="text-yellow-800 text-xs font-bold">{complaint.status}</Text>
                </View>
              </View>

              {/* Action Buttons (Replacing Select) */}
              <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <TouchableOpacity onPress={() => handleAction(complaint.id, 'Start')} className="flex-1 bg-[#1E88E5] py-2 rounded-lg items-center">
                    <Text className="text-white font-bold text-xs">Start</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAction(complaint.id, 'Resolve')} className="flex-1 bg-green-600 py-2 rounded-lg items-center">
                    <Text className="text-white font-bold text-xs">Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}