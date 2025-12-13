import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { User, CheckCircle, Clock, AlertCircle, FileText, Edit } from 'lucide-react-native';

export default function Profile({ onLogout, darkMode, toggleDarkMode, userRole, navigation }) {
  const userData = {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    ward: 'Ward 3 - South District',
    anonymousId: 'User #4532',
    joinedDate: 'November 2025',
    stats: {
      total: 12,
      resolved: 8,
      pending: 3,
      inProgress: 1
    }
  };

  const recentComplaints = [
    { id: 1, title: 'Pothole on Main Street', status: 'In Progress', date: '2 days ago' },
    { id: 2, title: 'Garbage Collection Delay', status: 'Pending', date: '3 days ago' },
    { id: 3, title: 'Broken Street Light', status: 'Resolved', date: '5 days ago' },
    { id: 4, title: 'Water Pipe Leak', status: 'In Review', date: '1 week ago' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-100';
      case 'In Review': return 'bg-yellow-100';
      case 'In Progress': return 'bg-orange-100';
      case 'Resolved': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };
  
  const getStatusTextColor = (status) => {
      switch (status) {
        case 'Pending': return 'text-red-700';
        case 'In Review': return 'text-yellow-700';
        case 'In Progress': return 'text-orange-700';
        case 'Resolved': return 'text-green-700';
        default: return 'text-gray-700';
      }
    };

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>My Profile</Text>
          <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your account and view your activity
          </Text>
        </View>

        {/* User Card */}
        <View className={`rounded-xl p-6 shadow-sm border mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-3">
              <User size={40} color="#1E88E5" />
            </View>
            <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{userData.name}</Text>
            <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userData.email}</Text>
            <View className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full mt-2">
               <Text className="text-xs text-gray-500 dark:text-gray-300">ID: {userData.anonymousId}</Text>
            </View>
          </View>

          {/* Details */}
          <View className="space-y-4">
             <View>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Ward</Text>
                <Text className={`text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{userData.ward}</Text>
             </View>
             <View className="mt-4">
                <Text className="text-sm text-gray-500 dark:text-gray-400">Role</Text>
                <View className="self-start bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full mt-1">
                   <Text className="text-purple-700 dark:text-purple-300 capitalize">{userRole || 'Citizen'}</Text>
                </View>
             </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity className="mt-6 bg-[#1E88E5] py-3 rounded-lg flex-row justify-center items-center">
             <Edit size={18} color="white" />
             <Text className="text-white font-bold ml-2">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View className={`rounded-xl p-6 shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
           <Text className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Complaints</Text>
           {recentComplaints.map(complaint => (
             <View key={complaint.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <View>
                   <Text className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{complaint.title}</Text>
                   <Text className="text-xs text-gray-500">{complaint.date}</Text>
                </View>
                <View className={`px-2 py-1 rounded text-xs ${getStatusColor(complaint.status)}`}>
                   <Text className={`text-xs font-bold ${getStatusTextColor(complaint.status)}`}>{complaint.status}</Text>
                </View>
             </View>
           ))}
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}