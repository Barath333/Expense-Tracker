import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AIInsightsScreen from '../screens/Aiinsightsscreen';

export type TabParamList = {
  Home: undefined;
  Add: undefined;
  Analytics: undefined;
  History: undefined;
  Profile: undefined;
  AIInsights: undefined; 
};

const Tab = createBottomTabNavigator<TabParamList>();

const COLORS = {
  primary: '#1A9B5E',
  white: '#FFFFFF',
  textMuted: '#9CA3AF',
  bg: '#FFFFFF',
};

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Add: '+',
  Analytics: '📊',
  History: '📋',
  Profile: '👤',
  AIInsights: '🤖',
};

function TabBarButton({
  children,
  onPress,
  isAdd,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  isAdd?: boolean;
}) {
  if (isAdd) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.addBtnWrap}
        activeOpacity={0.85}
      >
        <View style={styles.addBtn}>
          <Text style={styles.addBtnIcon}>+</Text>
        </View>
      </TouchableOpacity>
    );
  }
  return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          if (route.name === 'Add') return null; // custom button handles it
          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name]}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: 'Charts' }} />
      <Tab.Screen
        name="Add"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarButton: (props) => (
            <TabBarButton
              onPress={props.onPress as () => void}
              isAdd
            >
              {props.children}
            </TabBarButton>
          ),
        }}
      />
  <Tab.Screen 
  name="History" 
  component={HistoryScreen} 
  options={{ tabBarLabel: 'History',
     freezeOnBlur: true,
   }}
/>
      {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
      <Tab.Screen 
  name="AIInsights" 
  component={AIInsightsScreen} 
  options={{ 
    tabBarLabel: 'AI',
    tabBarIcon: ({ focused }) => (
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🤖</Text>
    )
  }} 
/>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  addBtnWrap: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  addBtnIcon: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});