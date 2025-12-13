import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { Search, Filter, MapPin, Heart, Calendar } from 'lucide-react-native'; 

export default function ComplaintsFeed({ onLogout, darkMode, toggleDarkMode, navigation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const complaints = [
    {
      id: 1,
      title: 'Pothole on Main Street',
      category: 'Roads & Infrastructure',
      area: 'Ward 3 - South District',
      status: 'In Progress',
      image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?w=1080',
      upvotes: 24,
      date: '2 days ago'
    },
    {
      id: 2,
      title: 'Garbage Collection Delay',
      category: 'Waste Management',
      area: 'Ward 1 - Central',
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1580767114670-c778cc443675?w=1080',
      upvotes: 18,
      date: '3 days ago'
    },
    {
      id: 3,
      title: 'Broken Street Light',
      category: 'Street Lights',
      area: 'Ward 2 - North',
      status: 'Resolved',
      image: 'https://images.unsplash.com/photo-1685992830281-2eef1f9bd3e8?w=1080',
      upvotes: 12,
      date: '5 days ago'
    },
    {
      id: 4,
      title: 'Water Pipe Leak',
      category: 'Water Supply',
      area: 'Ward 4 - East',
      status: 'In Review',
      image: 'https://images.unsplash.com/photo-1720889589894-497c4f4f569e?w=1080',
      upvotes: 31,
      date: '1 week ago'
    },
    {
      id: 5,
      title: 'Drainage Blockage',
      category: 'Drainage',
      area: 'Ward 5 - West',
      status: 'In Progress',
      image: 'https://images.unsplash.com/photo-1580767114670-c778cc443675?w=1080',
      upvotes: 15,
      date: '1 week ago'
    },
    {
      id: 6,
      title: 'Park Maintenance Needed',
      category: 'Parks & Recreation',
      area: 'Ward 3 - South District',
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?w=1080',
      upvotes: 8,
      date: '2 weeks ago'
    }
  ];

  const categories = ['All', 'Roads & Infrastructure', 'Waste Management', 'Street Lights', 'Water Supply', 'Drainage', 'Parks & Recreation'];
  const statuses = ['All', 'Pending', 'In Review', 'In Progress', 'Resolved'];

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

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          complaint.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || complaint.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || complaint.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="mb-6">
          <Text className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Complaints Feed</Text>
          <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Browse all reported issues in your city
          </Text>
        </View>

        {/* Search and Filters */}
        <View className="mb-6">
          {/* Search Bar */}
          <View className={`flex-row items-center border rounded-lg px-3 py-2 mb-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
            <Search size={20} color={darkMode ? '#9CA3AF' : '#9CA3AF'} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by category or location..."
              placeholderTextColor={darkMode ? '#9CA3AF' : '#6B7280'}
              className={`flex-1 ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            />
          </View>

          {/* Filter Toggle */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`flex-row items-center self-start px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          >
            <Filter size={20} color={darkMode ? '#D1D5DB' : '#374151'} />
            <Text className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filters</Text>
          </TouchableOpacity>

          {/* Filter Options */}
          {showFilters && (
            <View className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <Text className={`text-sm mb-2 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full ${
                      selectedCategory === category
                        ? 'bg-[#1E88E5]'
                        : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                    }`}
                  >
                    <Text className={`text-xs ${selectedCategory === category ? 'text-white' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                        {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className={`text-sm mb-2 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setSelectedStatus(status)}
                    className={`px-3 py-1 rounded-full ${
                      selectedStatus === status
                        ? 'bg-[#1E88E5]'
                        : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                    }`}
                  >
                     <Text className={`text-xs ${selectedStatus === status ? 'text-white' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                        {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Results Count */}
        <Text className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''}
        </Text>

        {/* Complaints Grid */}
        <View className="gap-6">
          {filteredComplaints.map((complaint) => (
            <TouchableOpacity
              key={complaint.id}
              onPress={() => navigation?.navigate('Complaint', { id: complaint.id })}
              className={`rounded-xl shadow-md overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              {/* Image */}
              <View className="h-48 relative">
                <Image
                  source={{ uri: complaint.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className={`absolute top-3 right-3 px-3 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                  <Text className={`text-xs font-bold ${getStatusTextColor(complaint.status)}`}>{complaint.status}</Text>
                </View>
              </View>

              {/* Content */}
              <View className="p-4">
                <Text className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {complaint.title}
                </Text>

                <View className="self-start px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3">
                   <Text className="text-[#1E88E5] text-xs">{complaint.category}</Text>
                </View>

                <View className="flex-row items-center gap-2 mb-2">
                  <MapPin size={16} color={darkMode ? '#9CA3AF' : '#4B5563'} />
                  <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.area}</Text>
                </View>

                <View className={`flex-row justify-between pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <View className="flex-row items-center gap-2">
                    <Heart size={16} color={darkMode ? '#9CA3AF' : '#4B5563'} />
                    <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.upvotes} upvotes</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Calendar size={16} color={darkMode ? '#9CA3AF' : '#4B5563'} />
                    <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{complaint.date}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* No Results */}
        {filteredComplaints.length === 0 && (
          <View className="items-center py-12">
            <Text className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No complaints found matching your criteria</Text>
          </View>
        )}
      </ScrollView>

      <BottomNav navigation={navigation} />
    </View>
  );
}