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

      {/* ── Booking module screens (IT23730656) ── */}
      <Tabs.Screen name="explore"                  options={{ href: null }} />
      <Tabs.Screen name="edit-profile"             options={{ href: null }} />
      <Tabs.Screen name="schedule"                 options={{ href: null }} />
      <Tabs.Screen name="session-details"          options={{ href: null }} />
      <Tabs.Screen name="booking-summary"          options={{ href: null }} />
      <Tabs.Screen name="booking-confirmed"        options={{ href: null }} />
      <Tabs.Screen name="reschedule-session"       options={{ href: null }} />
      <Tabs.Screen name="cancel-session"           options={{ href: null }} />
      <Tabs.Screen name="session-cancelled"        options={{ href: null }} />
      <Tabs.Screen name="reschedule-confirmation"  options={{ href: null }} />

      {/* ── Payment & Session module screens (IT23730892) ── */}
      <Tabs.Screen name="payment-summary"          options={{ href: null }} />
      <Tabs.Screen name="payment-bank-slip"        options={{ href: null }} />
      <Tabs.Screen name="payment-processing"       options={{ href: null }} />
      <Tabs.Screen name="payment-success"          options={{ href: null }} />
      <Tabs.Screen name="session-booking-confirm"  options={{ href: null }} />
      <Tabs.Screen name="session-chat"             options={{ href: null }} />
      <Tabs.Screen name="session-files"            options={{ href: null }} />
      <Tabs.Screen name="session-code"             options={{ href: null }} />
      <Tabs.Screen name="session-video"            options={{ href: null }} />
      <Tabs.Screen name="session-workspace"        options={{ href: null }} />
      <Tabs.Screen name="session-completed"        options={{ href: null }} />
    </Tabs>
  );
}
