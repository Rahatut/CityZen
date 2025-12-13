import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { 
  Users, 
  FileText, 
  Shield, 
  AlertOctagon, 
  Ban, 
  BarChart3, 
  PieChart 
} from 'lucide-react-native';

export default function AdminDashboard({ onLogout, darkMode, toggleDarkMode, navigation }) {
  const [activeTab, setActiveTab] = useState('users');

  const stats = {
    totalUsers: 1247,
    totalComplaints: 856,
    spamReports: 23,
    bannedUsers: 5
  };

  const users = [
    { id: 1, name: 'Alex Johnson', email: 'alex@email.com', role: 'Citizen', complaints: 12, joinDate: 'Nov 2025', status: 'Active' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@email.com', role: 'Citizen', complaints: 8, joinDate: 'Nov 2025', status: 'Active' },
    { id: 3, name: 'Mike Brown', email: 'mike@email.com', role: 'Authority', complaints: 0, joinDate: 'Oct 2025', status: 'Active' },
    { id: 4, name: 'Lisa Davis', email: 'lisa@email.com', role: 'Citizen', complaints: 5, joinDate: 'Dec 2025', status: 'Active' }
  ];

  const spamReports = [
    { id: 1, complaintId: 'C-042', reporter: 'User #3421', reason: 'Duplicate submission', date: '1 day ago' },
    { id: 2, complaintId: 'C-087', reporter: 'User #5632', reason: 'Inappropriate content', date: '2 days ago' },
    { id: 3, complaintId: 'C-123', reporter: 'User #8765', reason: 'False information', date: '3 days ago' }
  ];

  const bannedUsers = [
    { id: 1, name: 'John Doe', email: 'john@email.com', reason: 'Spam complaints', bannedDate: 'Dec 1, 2025' },
    { id: 2, name: 'Jane Wilson', email: 'jane@email.com', reason: 'Inappropriate content', bannedDate: 'Nov 28, 2025' }
  ];

  const handleUserAction = (userId, action) => {
    Alert.alert(action, `Perform ${action} on user ${userId}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => console.log(action + " confirmed") }
    ]);
  };

  const handleSpamAction = (reportId, action) => {
    Alert.alert(action, `${action} spam report ${reportId}`);
  };

  // Helper component for Stat Cards
  const StatCard = ({ icon: Icon, color, bg, value, label }) => (
    <View className={`w-[48%] mb-4 p-4 rounded-xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <View className={`self-start p-3 rounded-lg mb-2 ${bg}`}>
        <Icon size={24} color={color} />
      </View>
      <Text className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value}</Text>
      <Text className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
    </View>
  );

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Admin Dashboard
          </Text>
          <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage users, complaints, and platform moderation
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <StatCard 
            icon={Users} 
            color="#1E88E5" 
            bg={darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} 
            value={stats.totalUsers} 
            label="Total Users" 
          />
          <StatCard 
            icon={FileText} 
            color="#16A34A" 
            bg={darkMode ? 'bg-green-900/20' : 'bg-green-50'} 
            value={stats.totalComplaints} 
            label="Total Complaints" 
          />
          <StatCard 
            icon={AlertOctagon} 
            color="#EA580C" 
            bg={darkMode ? 'bg-orange-900/20' : 'bg-orange-50'} 
            value={stats.spamReports} 
            label="Spam Reports" 
          />
          <StatCard 
            icon={Ban} 
            color="#DC2626" 
            bg={darkMode ? 'bg-red-900/20' : 'bg-red-50'} 
            value={stats.bannedUsers} 
            label="Banned Users" 
          />
        </View>

        {/* Tabs */}
        <View className={`mb-6 rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'users', label: 'Users', icon: Users },
              { id: 'complaints', label: 'Moderation', icon: FileText },
              { id: 'spam', label: 'Spam', icon: AlertOctagon },
              { id: 'banned', label: 'Banned', icon: Ban },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-row items-center px-6 py-4 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#1E88E5]'
                    : 'border-transparent'
                }`}
              >
                <tab.icon size={20} color={activeTab === tab.id ? '#1E88E5' : (darkMode ? '#9CA3AF' : '#4B5563')} />
                <Text className={`ml-2 font-medium ${
                  activeTab === tab.id
                    ? 'text-[#1E88E5]'
                    : (darkMode ? 'text-gray-400' : 'text-gray-600')
                }`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="p-4">
            {/* User Management Tab */}
            {activeTab === 'users' && (
              <View>
                <Text className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>All Users</Text>
                {users.map((user) => (
                  <View key={user.id} className={`mb-3 p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</Text>
                        <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</Text>
                      </View>
                      <View className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                        <Text className={`text-xs font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{user.role}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <Text className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Joined: {user.joinDate}</Text>
                      <View className="flex-row gap-4">
                        <TouchableOpacity onPress={() => handleUserAction(user.id, 'View')}>
                          <Text className="text-[#1E88E5] font-bold">View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleUserAction(user.id, 'Suspend')}>
                          <Text className="text-red-600 font-bold">Suspend</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Complaint Moderation Tab */}
            {activeTab === 'complaints' && (
              <View className="items-center py-12">
                <Shield size={64} color="#9CA3AF" style={{ marginBottom: 16 }} />
                <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complaint moderation queue is empty</Text>
              </View>
            )}

            {/* Spam Reports Tab */}
            {activeTab === 'spam' && (
              <View>
                <Text className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Spam Reports</Text>
                {spamReports.map((report) => (
                  <View key={report.id} className={`mb-3 p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <Text className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Complaint <Text className="font-bold">{report.complaintId}</Text> reported by {report.reporter}
                    </Text>
                    <Text className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Reason: {report.reason}
                    </Text>
                    <View className="flex-row justify-between items-center mt-2">
                       <Text className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{report.date}</Text>
                       <View className="flex-row gap-2">
                          <TouchableOpacity 
                            onPress={() => handleSpamAction(report.id, 'Review')}
                            className="bg-[#1E88E5] px-3 py-1 rounded"
                          >
                            <Text className="text-white text-xs font-bold">Review</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleSpamAction(report.id, 'Dismiss')}
                            className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                          >
                            <Text className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dismiss</Text>
                          </TouchableOpacity>
                       </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Banned Users Tab */}
            {activeTab === 'banned' && (
              <View>
                <Text className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Banned Users</Text>
                {bannedUsers.map((user) => (
                  <View key={user.id} className={`mb-3 p-4 rounded-lg border flex-row justify-between items-start ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <View className="flex-1 mr-2">
                      <Text className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        <Text className="font-bold">{user.name}</Text>
                      </Text>
                      <Text className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Reason: {user.reason}
                      </Text>
                      <Text className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{user.bannedDate}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Unban', `Unban ${user.name}`)}
                      className="bg-green-500 px-3 py-1 rounded"
                    >
                      <Text className="text-white text-xs font-bold">Unban</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Analytics Section */}
        <View className="mt-2 mb-6">
          <View className={`p-6 rounded-xl border shadow-sm mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Text className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Category Distribution</Text>
            <View className={`p-8 rounded-lg items-center ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
               <PieChart size={64} color="#1E88E5" style={{ marginBottom: 16 }} />
               <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pie chart showing complaint categories</Text>
            </View>
          </View>

          <View className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Text className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Monthly Trends</Text>
            <View className={`p-8 rounded-lg items-center ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
               <BarChart3 size={64} color="#16A34A" style={{ marginBottom: 16 }} />
               <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bar chart showing monthly complaint trends</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}