import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import type { UserProfile } from '@acclimate/engine';

import { SplashScreen }          from './src/screens/SplashScreen';
import { OnboardingScreen }      from './src/screens/OnboardingScreen';
import { HomeScreen }            from './src/screens/HomeScreen';
import { HistoryScreen }         from './src/screens/HistoryScreen';
import { ProfileScreen }         from './src/screens/ProfileScreen';
import { CityPickerScreen }      from './src/screens/CityPickerScreen';
import { QuestionnaireScreen }   from './src/screens/QuestionnaireScreen';
import { ResultScreen }          from './src/screens/ResultScreen';
import { NotificationsScreen }   from './src/screens/NotificationsScreen';
import { Colors } from './src/theme';

// ─── Navigation types ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash:        undefined;
  Onboarding:    undefined;
  Main:          undefined;
  Notifications: undefined;
  CityPicker: {
    prefillOriginId?:   string;
    prefillOriginName?: string;
    prefillDestId?:     string;
    prefillDestName?:   string;
    prefillMonth?:      number;
  } | undefined;
  Questionnaire: {
    originId:    string;
    originName:  string;
    destId:      string;
    destName:    string;
    month:       number;
    profileOnly?: boolean;
  };
  Result: {
    originId:   string;
    originName: string;
    destId:     string;
    destName:   string;
    month:      number;
    profile:    UserProfile;
  };
};

export type TabParamList = {
  Home:    undefined;
  History: undefined;
  Profile: undefined;
};

// ─── Bottom tab navigator ──────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>;
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  Colors.surface,
          borderTopColor:   Colors.line,
          borderTopWidth:   1,
          height:           60,
          paddingBottom:    8,
          paddingTop:       6,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.inkFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused}/>, tabBarLabel: 'Home' }}/>
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🕐" focused={focused}/>, tabBarLabel: 'Trips' }}/>
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused}/>, tabBarLabel: 'You' }}/>
    </Tab.Navigator>
  );
}

// ─── Root stack navigator ──────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar style="auto"/>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ animation: 'fade' }}>
        <Stack.Screen name="Splash"      component={SplashScreen}      options={{ headerShown: false }}/>
        <Stack.Screen name="Onboarding"  component={OnboardingScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Main"        component={MainTabNavigator}  options={{ headerShown: false }}/>
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false, animation: 'slide_from_right' }}/>
        <Stack.Screen name="CityPicker"  component={CityPickerScreen}  options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}/>
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} options={{ headerShown: false, animation: 'slide_from_right' }}/>
        <Stack.Screen name="Result"      component={ResultScreen}      options={{ headerShown: false, animation: 'slide_from_right' }}/>
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
