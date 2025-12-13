import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Mail, Lock, LogIn, Building2 } from 'lucide-react-native';

export default function Login({ onLogin, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Mobile login logic
  const handleLogin = () => {
    // In a real app, you would validate here
    onLogin('citizen'); // Mock login
    navigation?.navigate('Home'); // Navigate to Home
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white dark:bg-gray-900">
      {/* Header / Illustration Placeholder */}
      <View className="h-64 bg-[#1E88E5] items-center justify-center rounded-b-[40px] mb-8">
        <Building2 size={64} color="white" />
        <Text className="text-white text-3xl font-bold mt-4">CityZen</Text>
        <Text className="text-blue-100 mt-2">Welcome Back</Text>
      </View>

      <View className="px-6">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Login to your account</Text>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Email Address</Text>
          <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
            <Mail size={20} color="#9CA3AF" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-gray-900 dark:text-white"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-300 mb-2">Password</Text>
          <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
            <Lock size={20} color="#9CA3AF" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-gray-900 dark:text-white"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity className="items-end mb-6">
          <Text className="text-[#1E88E5]">Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          className="bg-[#1E88E5] py-4 rounded-xl flex-row justify-center items-center shadow-lg"
        >
          <LogIn size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Login</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600 dark:text-gray-400">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Signup')}>
            <Text className="text-[#1E88E5] font-bold">Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}