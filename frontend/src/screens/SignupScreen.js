import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  User, Mail, Lock, MapPin, Building2, ShieldCheck,
  CheckSquare, Square, Briefcase, Key, CheckCircle
} from 'lucide-react-native';
import axios from 'axios';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_API_URL = API_URL + '/auth';
console.log('SignupScreen AUTH_API_URL:', AUTH_API_URL);

export default function SignupScreen({ navigation }) {

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('citizen');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    department: '',
    authorityCompanyId: '',
    adminCode: '',
  });
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  // Only declare step/setStep ONCE:
  // const [step, setStep] = useState(1); // Already declared above, keep only one
  const [twoFAMethod, setTwoFAMethod] = useState('email');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/departments`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (Array.isArray(response.data)) setDepartments(response.data);
        else setDepartments([]);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    if (role === 'authority') fetchDepartments();
    else setDepartments([]);
  }, [role]);

  // Send OTP (email by default)
  const handleSendOtp = async () => {
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
    setTwoFAMethod('email');
    setLoading(true);
    try {
      const url = `${API_URL}/api/auth/send-email-otp`;
      console.log('Sending OTP to:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const text = await response.text();
      console.log('OTP raw response:', text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('OTP response is not JSON:', text);
        Alert.alert('OTP Error', 'Server did not return JSON. Check backend logs.');
        setLoading(false);
        return;
      }
      if (response.ok) {
        setOtpSent(true);
        setStep(3);
      } else {
        Alert.alert('OTP Error', data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      Alert.alert('OTP Error', err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to phone OTP at OTP step
  const handleSwitchToPhone = async () => {
    setTwoFAMethod('phone');
    setOtp('');
    setError('');
    setLoading(true);
    try {
      const url = `${API_URL}/api/auth/send-phone-otp`;
      console.log('Sending phone OTP to:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Phone OTP response is not JSON:', text);
        Alert.alert('OTP Error', 'Server did not return JSON. Check backend logs.');
        setLoading(false);
        return;
      }
      if (response.ok) {
        setOtpSent(true);
        setStep(3);
      } else {
        Alert.alert('OTP Error', data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      Alert.alert('OTP Error', err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to email OTP at OTP step
  const handleSwitchToEmail = async () => {
    setTwoFAMethod('email');
    setOtp('');
    setError('');
    await handleSendOtp();
  };

  // Submit OTP and register
  const handleOtpSubmit = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP sent to your ' + (twoFAMethod === 'phone' ? 'phone.' : 'email.'));
      return;
    }
    setLoading(true);
    try {
      // For phone: verify OTP with Firebase, get idToken
      // For email: verify OTP with backend
      const payload = { ...formData, otp, twoFAMethod, role };
      // Add firebaseUid for citizen
      if (!payload.firebaseUid) {
        payload.firebaseUid = 'citizen-' + Date.now(); // fallback if not using Firebase Auth
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          setStep(4);
        } else {
          Alert.alert('Registration Error', data.message || 'Registration failed.');
        }
      } catch (err) {
        Alert.alert('Registration Error', err.message || 'Registration failed.');
      }
    } catch (err) {
      Alert.alert('Registration Error', err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) handleSendOtp();
  };

  const renderRoleSelection = () => (
    <View>
      <Text style={styles.stepTitle}>Choose your Role</Text>
      {['citizen', 'authority', 'admin'].map(r => (
        <TouchableOpacity
          key={r}
          onPress={() => setRole(r)}
          style={[styles.roleCard, role === r && styles.roleCardActive]}
        >
          <View style={[styles.iconCircle, role === r && { backgroundColor: '#1E88E5' }]}>
            {r === 'citizen' && <User size={24} color={role === r ? 'white' : '#6B7280'} />}
            {r === 'authority' && <Briefcase size={24} color={role === r ? 'white' : '#6B7280'} />}
            {r === 'admin' && <ShieldCheck size={24} color={role === r ? 'white' : '#6B7280'} />}
          </View>
          <View>
            <Text style={[styles.roleTitle, role === r && { color: '#1E88E5' }]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
            <Text style={styles.roleDesc}>
              {r === 'citizen' ? 'Report issues & track progress.' :
                r === 'authority' ? 'Resolve complaints in your area.' :
                  'Manage users and moderation.'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={handleNext} style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <View>
      <Text style={styles.stepTitle}>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</Text>

      <View style={styles.inputWrapper}>
        <User size={20} color="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Full Name" onChangeText={t => setFormData({ ...formData, fullName: t })} />
      </View>

      {role === 'admin' && (
        <View style={styles.inputWrapper}>
          <Key size={20} color="#9CA3AF" />
          <TextInput style={styles.input} placeholder="Admin Code (Secure)" secureTextEntry onChangeText={t => setFormData({ ...formData, adminCode: t })} />
        </View>
      )}

      {role === 'authority' && (
        <View style={styles.inputWrapper}>
          <Briefcase size={20} color="#9CA3AF" />
          <Picker
            selectedValue={formData.authorityCompanyId}
            style={{ flex: 1, marginLeft: 12 }}
            enabled={!departmentsLoading}
            onValueChange={v => {
              const dep = departments.find(d => d.id === v);
              setFormData({ ...formData, authorityCompanyId: v, department: dep ? dep.name : '' });
            }}
          >
            <Picker.Item label="Select Department" value="" />
            {departments.map(dep => (
              <Picker.Item key={dep.id} label={dep.name} value={dep.id} />
            ))}
          </Picker>
        </View>
      )}

      {/* Phone Number Field */}
      <View style={styles.inputWrapper}>
        <Mail size={20} color="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Phone Number (e.g. +1234567890)" keyboardType="phone-pad" onChangeText={t => setFormData({ ...formData, phoneNumber: t })} />
      </View>

      <View style={styles.inputWrapper}>
        <Mail size={20} color="#9CA3AF" />
        <TextInput style={styles.input} placeholder={role === 'authority' ? "Official Email / ID" : "Email Address"} keyboardType="email-address" onChangeText={t => setFormData({ ...formData, email: t })} />
      </View>

      <View style={styles.inputWrapper}>
        <Lock size={20} color="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={t => setFormData({ ...formData, password: t })} />
      </View>

      <View style={styles.inputWrapper}>
        <Lock size={20} color="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry onChangeText={t => setFormData({ ...formData, confirmPassword: t })} />
      </View>

      {role === 'citizen' && (
        <Text style={styles.privacyNote}>🔒 Your identity is hidden from public view.</Text>
      )}

      <TouchableOpacity onPress={() => setAgreeTerms(!agreeTerms)} style={styles.checkboxContainer}>
        {agreeTerms ? <CheckSquare size={20} color="#1E88E5" /> : <Square size={20} color="#9CA3AF" />}
        <Text style={styles.checkboxText}>I agree to the Terms & Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNext} style={styles.submitBtn} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep(1)} style={{ alignItems: 'center', marginTop: 16 }} disabled={loading}>
        <Text style={{ color: '#6B7280' }}>Back to Role Selection</Text>
      </TouchableOpacity>
    </View>
  );

  // OTP Step
  const renderOtpStep = () => (
    <View>
      <Text style={styles.stepTitle}>Verify your {twoFAMethod === 'phone' ? 'Phone' : 'Email'}</Text>
      <Text style={{ color: '#6B7280', marginBottom: 16 }}>
        An OTP has been sent to your {twoFAMethod === 'phone' ? 'phone number' : 'email address'}.
      </Text>
      <TextInput
        style={[styles.input, { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 16 }]}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
      />
      <TouchableOpacity onPress={handleOtpSubmit} style={styles.submitBtn} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={twoFAMethod === 'email' ? handleSwitchToPhone : handleSwitchToEmail}>
        <Text style={{ color: '#1E88E5', textAlign: 'center', marginTop: 12 }}>
          Or verify using {twoFAMethod === 'email' ? 'SMS' : 'Email'} instead
        </Text>
      </TouchableOpacity>
      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <CheckCircle size={80} color="#16A34A" />
      <Text style={styles.successTitle}>Account Created!</Text>
      <Text style={styles.successSub}>Your {role} account has been successfully created. You can now log in.</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.submitBtn}>
        <Text style={styles.submitBtnText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white', padding: 24 }}>
        <View style={styles.headerSimple}>
          <Building2 size={40} color="#1E88E5" />
          <Text style={styles.headerSimpleText}>CityZen</Text>
        </View>

        {step === 1 && renderRoleSelection()}
        {step === 2 && renderForm()}
        {step === 3 && renderOtpStep()}
        {step === 4 && renderSuccess()}

        {step !== 4 && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink} disabled={loading}>
            <Text style={{ color: '#6B7280' }}>Already have an account? <Text style={{ color: '#1E88E5', fontWeight: 'bold' }}>Log in</Text></Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, marginTop: 40, gap: 8 },
  headerSimpleText: { fontSize: 24, fontWeight: 'bold', color: '#1E88E5' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 24, textAlign: 'center' },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, gap: 16 },
  roleCardActive: { borderColor: '#1E88E5', backgroundColor: '#EFF6FF' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  roleDesc: { fontSize: 12, color: '#6B7280' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' },
  privacyNote: { fontSize: 12, color: '#6B7280', marginBottom: 16, fontStyle: 'italic', textAlign: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center', gap: 8 },
  checkboxText: { color: '#4B5563' },
  submitBtn: { backgroundColor: '#1E88E5', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 4, width: '100%' },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  successContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 40 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 24, marginBottom: 8 },
  successSub: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
});
