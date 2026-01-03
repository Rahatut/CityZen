import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ComplaintProvider } from './src/context/ComplaintContext';

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
import CameraScreen from './src/screens/CameraScreen';
import SubmitComplaintDetailsScreen from './src/screens/SubmitComplaintDetailsScreen';
import SubmittedComplaintScreen from './src/screens/SubmittedComplaintScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ComplaintProvider>
      <NavigationContainer>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#1F2937" : "#FFFFFF"} />
        <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: darkMode ? '#111827' : '#F9FAFB' } }}>
          <Stack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={() => props.navigation.replace('HomeScreen')} />}</Stack.Screen>
          <Stack.Screen name="Signup">{(props) => <SignupScreen {...props} onSignup={() => props.navigation.replace('HomeScreen')} />}</Stack.Screen>
          <Stack.Screen name="HomeScreen">{(props) => <HomeScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
          <Stack.Screen name="Feed">{(props) => <FeedScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
          <Stack.Screen name="Camera">{(props) => <CameraScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
          <Stack.Screen name="SubmitComplaintDetails">{(props) => <SubmitComplaintDetailsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
          <Stack.Screen name="SubmitComplaint">{(props) => <SubmitComplaintScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
          <Stack.Screen name="SubmittedComplaint">{(props) => <SubmittedComplaintScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
          <Stack.Screen name="Profile">{(props) => <ProfileScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
          <Stack.Screen name="ComplaintDetails">{(props) => <ComplaintDetailsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
          <Stack.Screen name="AuthorityDashboard">{(props) => <AuthorityDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
          <Stack.Screen name="AdminDashboard">{(props) => <AdminDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </ComplaintProvider>
  );
}
