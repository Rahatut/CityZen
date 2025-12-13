import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SubmitComplaintScreen from './src/screens/SubmitComplaintScreen';
import ComplaintDetailsScreen from './src/screens/ComplaintDetailsScreen';
import AuthorityDashboardScreen from './src/screens/AuthorityDashboardScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <NavigationContainer>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#1F2937" : "#FFFFFF"} />
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: darkMode ? '#111827' : '#F9FAFB' } }}>
        <Stack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={() => props.navigation.replace('HomeScreen')} />}</Stack.Screen>
        <Stack.Screen name="Signup">{(props) => <SignupScreen {...props} onSignup={() => props.navigation.replace('HomeScreen')} />}</Stack.Screen>
        <Stack.Screen name="HomeScreen">{(props) => <HomeScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
        <Stack.Screen name="Feed">{(props) => <FeedScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
        <Stack.Screen name="SubmitComplaint">{(props) => <SubmitComplaintScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
        <Stack.Screen name="Profile">{(props) => <ProfileScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
        <Stack.Screen name="ComplaintDetails">{(props) => <ComplaintDetailsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
        <Stack.Screen name="AuthorityDashboard">{(props) => <AuthorityDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
        <Stack.Screen name="AdminDashboard">{(props) => <AdminDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}