import React, { useState } from 'react';
import { verifyPhoneNumber, confirmOTP } from '../services/phoneAuth';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { User, Mail, Lock, Building2, ShieldCheck, MapPin } from 'lucide-react-native';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export default function Signup({ onSignup, navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    ward: '',
  });
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [twoFAMethod, setTwoFAMethod] = useState('email'); // default to email, can switch at OTP step
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
    if (!formData.email) {
      Alert.alert('Error', 'Email is required!');
      return;
    }
    if (!formData.phoneNumber) {
      Alert.alert('Error', 'Phone number is required!');
      return;
    }
    // Default: send email OTP first
    setTwoFAMethod('email');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setStep('otp');
      } else {
        Alert.alert('OTP Error', data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      Alert.alert('OTP Error', err.message || 'Failed to send OTP.');
    }
  };

  // Switch to phone OTP at OTP step
  const handleSwitchToPhone = async () => {
    setTwoFAMethod('phone');
    setOtp('');
    setError('');
    // Trigger phone OTP
    const result = await verifyPhoneNumber(formData.phoneNumber, setVerificationId, setError);
    if (result) setOtpSent(true);
  };

  // Switch to email OTP at OTP step
  const handleSwitchToEmail = async () => {
    setTwoFAMethod('email');
    setOtp('');
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) setOtpSent(true);
    } catch {}
  };

  const handleOtpSubmit = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP sent to your ' + (twoFAMethod === 'phone' ? 'phone.' : 'email.'));
      return;
    }
    if (twoFAMethod === 'phone') {
      const userCredential = await confirmOTP(verificationId, otp, setError);
      if (userCredential) {
        const firebaseIdToken = await userCredential.user.getIdToken();
        const payload = { ...formData, firebaseUid: userCredential.user.uid, firebaseIdToken, twoFAMethod };
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (response.ok) {
            onSignup('citizen');
            navigation?.navigate('HomeScreen');
          } else {
            Alert.alert('Registration Error', data.message || 'Registration failed.');
          }
        } catch (err) {
          Alert.alert('Registration Error', err.message || 'Registration failed.');
        }
      }
    } else {
      // TODO: Verify email OTP with backend
      const payload = { ...formData, otp, twoFAMethod };
      try {
          const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          onSignup('citizen');
          navigation?.navigate('HomeScreen');
        } else {
          Alert.alert('Registration Error', data.message || 'Registration failed.');
        }
      } catch (err) {
        Alert.alert('Registration Error', err.message || 'Registration failed.');
      }
    }
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
        {step === 'form' && (
          <View className="space-y-4">
            {/* ...existing code for form fields... */}
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 mb-2">Full Name</Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
                <User size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-900 dark:text-white"
                  keyboardType="email-address"
                />
              </View>
            </View>
            {/* Phone Number */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: 'red', fontWeight: 'bold' }}>DEBUG: Phone Field Here</Text>
              <Text style={{ color: '#374151', marginBottom: 8 }}>Phone Number</Text>
              <View>
                <TextInput
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  placeholder="e.g. +1234567890"
                  placeholderTextColor="#9CA3AF"
                  style={{ borderWidth: 1, borderColor: '#9CA3AF', borderRadius: 8, padding: 12, color: '#111', marginBottom: 4 }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            {/* Ward */}
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 mb-2">Ward</Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800">
                <MapPin size={20} color="#9CA3AF" />
                <TextInput
                  value={formData.ward}
                  onChangeText={(text) => setFormData({ ...formData, ward: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
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
        )}
        {step === 'otp' && (
          <View>
            {twoFAMethod === 'email' ? (
              <>
                <Text className="text-gray-700 dark:text-gray-300 mb-2">An OTP has been sent to your email.</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={handleOtpSubmit}
                  className="bg-[#1E88E5] py-4 rounded-xl items-center shadow-lg mb-4"
                >
                  <Text className="text-white font-bold text-lg">Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSwitchToPhone}>
                  <Text className="text-[#1E88E5] underline text-center">Or verify using SMS instead</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-gray-700 dark:text-gray-300 mb-2">An OTP has been sent to your phone.</Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={handleOtpSubmit}
                  className="bg-[#1E88E5] py-4 rounded-xl items-center shadow-lg mb-4"
                >
                  <Text className="text-white font-bold text-lg">Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSwitchToEmail}>
                  <Text className="text-[#1E88E5] underline text-center">Or verify using Email instead</Text>
                </TouchableOpacity>
              </>
            )}
            {error ? <Text className="text-red-500 mb-4">{error}</Text> : null}
          </View>
        )}
        {/* reCAPTCHA container for Firebase phone auth */}
        <View id="recaptcha-container" />
      </View>
    </ScrollView>
  );
}