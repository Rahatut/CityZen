import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { Mail, Lock, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react-native';

// NEW IMPORTS for Firebase and API calls
import axios from 'axios';
import { auth } from '../config/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen({ navigation }) {
  // NOTE: Role state is kept for UI only; actual login role is fetched from DB
  const [role, setRole] = useState('citizen'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    // Basic Validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Fetch User Profile & Role from your Express Backend
      const response = await axios.get(`${API_URL}/api/users/${firebaseUser.uid}`, {
        headers: {
          'bypass-tunnel-reminder': 'true', // CRITICAL: Localtunnel fix
          'Content-Type': 'application/json'
        }
      });

      const userData = response.data; // This object contains the stored role, fullName, etc.

      // 3. Navigation based on Role fetched from the database
      // Check App.js for the exact screen names
      if (userData.role === 'admin') {
        // Navigates to <Stack.Screen name="AdminDashboard" />
        navigation.replace('AdminDashboard');
      } else if (userData.role === 'authority') {
        // Navigates to <Stack.Screen name="AuthorityDashboard" />
        navigation.replace('AuthorityDashboard');
      } else {
        // ✅ FIX: Navigates to <Stack.Screen name="HomeScreen" />
        navigation.replace('HomeScreen'); 
      }

    } catch (error) {
      console.error('Login Error:', error);
      let message = 'Login failed. Please check your credentials.';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (error.message.includes('Network Error') || error.response === undefined) {
        message = 'Server connection failed. Is your backend and Localtunnel running?';
      } else if (error.response && error.response.status === 404) {
        message = 'User profile not found in database. Please contact support.';
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: 'white' }}>
        <View style={styles.header}>
          <Building2 size={64} color="white" />
          <Text style={styles.headerTitle}>CityZen</Text>
          <Text style={styles.headerSubtitle}>Better City, Better Life</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Login</Text>

          {/* Error Box */}
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={20} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Role Selector (Kept for UI look, but not used for navigation) */}
          <View style={styles.roleContainer}>
            {['citizen', 'authority', 'admin'].map((r) => (
              <TouchableOpacity 
                key={r} 
                onPress={() => setRole(r)}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              >
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === 'citizen' && (
            <Text style={styles.noteText}>
              <Text style={{fontWeight: 'bold'}}>Note:</Text> Citizen identity remains hidden from other users.
            </Text>
          )}

          {/* Inputs */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#9CA3AF" />
            <TextInput 
              style={styles.input} 
              placeholder="Enter email" 
              placeholderTextColor="#9CA3AF"
              value={email} 
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#9CA3AF" />
            <TextInput 
              style={styles.input} 
              placeholder="Enter password" 
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword} 
              value={password} 
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => console.log('Forgot')} style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
            <Text style={{ color: '#1E88E5', fontWeight: '500' }}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            onPress={handleLogin}
            style={[styles.loginBtn, isLoading && styles.btnDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Don't have an account?</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.secondaryBtn}>
             <Text style={styles.secondaryBtnText}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { height: 240, backgroundColor: '#1E88E5', alignItems: 'center', justifyContent: 'center', borderBottomRightRadius: 40, borderBottomLeftRadius: 40 },
  headerTitle: { fontSize: 36, fontWeight: 'bold', color: 'white', marginTop: 10 },
  headerSubtitle: { color: '#BFDBFE', fontSize: 16 },
  formContainer: { padding: 24, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  errorBox: { flexDirection: 'row', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center', gap: 8 },
  errorText: { color: '#B91C1C', fontSize: 14 },
  roleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 12 },
  roleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  roleBtnActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  roleText: { color: '#6B7280', fontWeight: '600', fontSize: 12 },
  roleTextActive: { color: '#1E88E5', fontWeight: 'bold' },
  noteText: { fontSize: 12, color: '#6B7280', marginBottom: 16, textAlign: 'center', fontStyle: 'italic' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 16 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' },
  loginBtn: { backgroundColor: '#1E88E5', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E88E5', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { backgroundColor: '#93C5FD' },
  loginBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 10, color: '#9CA3AF' },
  secondaryBtn: { borderWidth: 1, borderColor: '#1E88E5', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#1E88E5', fontSize: 16, fontWeight: '600' }
});