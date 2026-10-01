import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

import { Primary } from '@/constants/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#fff',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      {/* Hide old explore screen from tab bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      {/* Hide edit-profile from tab bar */}
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      {/* Schedule is opened from tutor selection, not from the tab bar. */}
      <Tabs.Screen name="schedule" options={{ href: null }} />
      {/* Session details follow schedule selection and stay off the tab bar. */}
      <Tabs.Screen name="session-details" options={{ href: null }} />
      {/* Booking summary follows the session details step. */}
      <Tabs.Screen name="booking-summary" options={{ href: null }} />
      {/* Confirmation follows a successful booking save. */}
      <Tabs.Screen name="booking-confirmed" options={{ href: null }} />
    </Tabs>
  );
}
