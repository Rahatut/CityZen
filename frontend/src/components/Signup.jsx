import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { User, Mail, Lock, Building2, ShieldCheck, MapPin } from 'lucide-react-native';

export default function Signup({ onSignup, navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    ward: '',
  });

  const handleSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
    // Mock Signup
    onSignup('citizen');
    navigation?.navigate('Home');
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white dark:bg-gray-900">
      <View className="px-6 py-8">
        
        {/* Header */}
        <View className="items-center mb-8">
          <Building2 size={48} color="#1E88E5" />
          <Text className="text-3xl font-bold text-gray-800 dark:text-white mt-2">Create Account</Text>
          <Text className="text-gray-500 dark:text-gray-400">Join CityZen to make your city better</Text>
        </View>

        {/* Form Fields */}
        <View className="space-y-4">
          
          {/* Full Name */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Full Name</Text>
            <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
              <User size={20} color="#9CA3AF" />
              <TextInput
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-900 dark:text-white"
              />
            </View>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Email</Text>
            <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-900 dark:text-white"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Ward (Simple Input for now, could be Picker) */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Ward</Text>
            <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
              <MapPin size={20} color="#9CA3AF" />
              <TextInput
                value={formData.ward}
                onChangeText={(text) => setFormData({...formData, ward: text})}
                placeholder="e.g. Ward 3"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-900 dark:text-white"
              />
            </View>
          </View>

          {/* Passwords */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Password</Text>
            <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                placeholder="Create password"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-900 dark:text-white"
                secureTextEntry
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Confirm Password</Text>
            <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                placeholder="Confirm password"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-900 dark:text-white"
                secureTextEntry
              />
            </View>
          </View>

          {/* Privacy Note */}
          <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex-row gap-3 mb-6">
            <ShieldCheck size={20} color="#1E88E5" />
            <Text className="flex-1 text-sm text-gray-600 dark:text-gray-300">
              <Text className="font-bold">Privacy Protected:</Text> Your identity is hidden from public view. Only your anonymous user ID will be visible.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-[#1E88E5] py-4 rounded-xl items-center shadow-lg mb-4"
          >
            <Text className="text-white font-bold text-lg">Create Account</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center pb-8">
            <Text className="text-gray-600 dark:text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
              <Text className="text-[#1E88E5] font-bold">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}