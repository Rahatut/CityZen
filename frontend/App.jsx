// App.js (React Native / Expo entry)
import 'react-native-gesture-handler'; // Must be first
import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screen components (native-friendly screens)
// Native (JS) screen implementations
import LoginScreenNative from './src/screens/LoginScreen';
import HomeScreenNative from './src/screens/HomeScreen';
import SubmitComplaintScreenNative from './src/screens/SubmitComplaintScreen';
import FeedScreenNative from './src/screens/FeedScreen';
import ProfileScreenNative from './src/screens/ProfileScreen';
import ReportPotholeScreen from "./src/screens/ReportPotholeScreen";

// Web (JSX) components
import LoginComponent from './src/components/Login.jsx';
import HomeComponent from './src/components/Home.jsx';
import SubmitComplaintComponent from './src/components/SubmitComplaint.jsx';
import ComplaintsFeedComponent from './src/components/ComplaintsFeed.jsx';
import ProfileComponent from './src/components/Profile.jsx';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

// Choose implementations depending on platform
const LoginScreen = Platform.OS === 'web' ? LoginComponent : LoginScreenNative;
const HomeScreen = Platform.OS === 'web' ? HomeComponent : HomeScreenNative;
const SubmitComplaintScreen = Platform.OS === 'web' ? SubmitComplaintComponent : SubmitComplaintScreenNative;
const FeedScreen = Platform.OS === 'web' ? ComplaintsFeedComponent : FeedScreenNative;
const ProfileScreen = Platform.OS === 'web' ? ProfileComponent : ProfileScreenNative;

function AuthNavigator({ onLogin }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={onLogin} />}</AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <AppStack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Home' }} />
      <AppStack.Screen name="Complaint" component={SubmitComplaintScreen} options={{ title: 'Complaint Details' }} />
    </AppStack.Navigator>
  );
}

function AppTabNavigator({ onLogout }) {
  return (
    <BottomTab.Navigator
      screenOptions={{ headerShown: true, tabBarStyle: { paddingBottom: 8, height: 60 } }}
    >
      <BottomTab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home', headerShown: false }} />
      <BottomTab.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <BottomTab.Screen name="Submit" component={SubmitComplaintScreen} options={{ title: 'Submit' }} />
      <BottomTab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </BottomTab.Screen>
    </BottomTab.Navigator>
  );
}

function RootNavigator({ isAuthenticated, onLogin, onLogout }) {
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabNavigator onLogout={onLogout} /> : <AuthNavigator onLogin={onLogin} />}
    </NavigationContainer>
  );
}

export default function App() {
  return <ReportPotholeScreen />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('citizen');
  const [darkMode, setDarkMode] = useState(false);

  // Load web storage
  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
      const savedRole = localStorage.getItem('userRole') || 'citizen';
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';

      setIsAuthenticated(savedAuth);
      setUserRole(savedRole);
      setDarkMode(savedDarkMode);

      if (savedDarkMode) document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (Platform.OS === 'web') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', role);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('citizen');
    if (Platform.OS === 'web') {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (Platform.OS === 'web') {
      localStorage.setItem('darkMode', (!darkMode).toString());
      document.documentElement.classList.toggle('dark');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator isAuthenticated={isAuthenticated} onLogin={handleLogin} onLogout={handleLogout} />
    </GestureHandlerRootView>
  );
}
