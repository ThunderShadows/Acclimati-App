import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import type { UserProfile } from '@acclimate/engine';

import { SplashScreen }       from './src/screens/SplashScreen';
import { OnboardingScreen }   from './src/screens/OnboardingScreen';
import { HomeScreen }         from './src/screens/HomeScreen';
import { HistoryScreen }      from './src/screens/HistoryScreen';
import { ProfileScreen }      from './src/screens/ProfileScreen';
import { CityPickerScreen }   from './src/screens/CityPickerScreen';
import { QuestionnaireScreen } from './src/screens/QuestionnaireScreen';
import { ResultScreen }       from './src/screens/ResultScreen';
import { Colors, Font } from './src/theme';

// ─── Navigation type definitions ─────────────────────────────────────────────

export type RootStackParamList = {
  Splash:        undefined;
  Onboarding:    undefined;
  Main:          undefined;
  CityPicker:    undefined;
  Questionnaire: {
    originId:   string;
    originName: string;
    destId:     string;
    destName:   string;
    month:      number;
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

// ─── Tab navigator ─────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  Colors.card,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          shadowColor:      '#000',
          shadowOpacity:    0.08,
          shadowRadius:     12,
          shadowOffset:     { width: 0, height: -3 },
          elevation:        8,
          height:           60,
          paddingBottom:    8,
          paddingTop:       4,
        },
        tabBarActiveTintColor:   Colors.mid,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize:   Font.size.xs,
          fontWeight: Font.weight.semibold,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🕐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root stack navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ animation: 'fade' }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CityPicker"
          component={CityPickerScreen}
          options={{
            headerShown:  false,
            presentation: 'modal',
            animation:    'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Questionnaire"
          component={QuestionnaireScreen}
          options={{
            headerShown: false,
            animation:   'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            headerShown: false,
            animation:   'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
