import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ComplaintProvider } from './src/context/ComplaintContext';
import { NotificationProvider, useNotification } from './src/context/NotificationContext';

// Helper to bridge navigation to context
const NavigationAware = () => {
  const navigation = useNavigation();
  const { setNavigation } = useNotification();

  React.useEffect(() => {
    setNavigation(navigation);
  }, [navigation]);

  return null;
};

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
import UserComplaintListScreen from './src/screens/UserComplaintListScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ComplaintProvider>
      <NotificationProvider>
        <NavigationContainer ref={(ref) => {
          // Dirty hack to access navigation from context without deep passing
          // Ideally we'd use a navigation service, but this works for the context injection pattern
          if (ref) {
            // We need a way to pass this ref to the context. 
            // Since NotificationProvider is inside, we can't pass it as prop easily unless we restructure.
            // Actually, we can use a ref + useEffect inside the provider if we move NavigationContainer *inside* Provider?
            // No, Provider needs to be outside to show Toast *over* everything.
            // But NavigationContainer needs to be ready.
            // Let's use a "NavigationAware" component inside.
          }
        }}>
          <NavigationAware />
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
            <Stack.Screen name="UserComplaintList">{(props) => <UserComplaintListScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="Notifications">{(props) => <NotificationsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
            <Stack.Screen name="Profile">{(props) => <ProfileScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
            <Stack.Screen name="ComplaintDetails">{(props) => <ComplaintDetailsScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}</Stack.Screen>
            <Stack.Screen name="AuthorityDashboard">{(props) => <AuthorityDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
            <Stack.Screen name="AdminDashboard">{(props) => <AdminDashboardScreen {...props} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={() => props.navigation.replace('Login')} />}</Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </NotificationProvider>
    </ComplaintProvider>
  );
}
