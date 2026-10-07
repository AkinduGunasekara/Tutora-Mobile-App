import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';

const TEAL  = '#008C91';
const MUTED = '#78809A';
const PAGE  = '#EFEDDC';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  nameFocused,
  focused,
}: {
  name: IoniconName;
  nameFocused: IoniconName;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? nameFocused : name}
      size={22}
      color={focused ? TEAL : MUTED}
    />
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const isTutor = user?.role === 'tutor';
  // Tabs shown only to one role; the other role gets href: null (hidden, still routable)
  const studentTab = isTutor ? null : undefined;
  const tutorTab = isTutor ? undefined : null;

  // Wait for the saved session so the navigator is created with the right role
  if (loading) return null;

  return (
    <Tabs
      // Tutors go back through their screen history; students keep the default behaviour
      backBehavior={isTutor ? 'history' : 'firstRoute'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   TEAL,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          borderTopWidth:    1,
          borderTopColor:    '#E4E1D2',
          backgroundColor:   PAGE,
          paddingBottom:     Platform.OS === 'ios' ? 20 : 8,
          paddingTop:        6,
          height:            Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      }}>

      {/* ── Visible tabs: students and tutors each see five ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: studentTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" nameFocused="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutor/dashboard"
        options={{
          title: 'Home',
          href: tutorTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" nameFocused="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          href: studentTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search-outline" nameFocused="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Calendar',
          href: studentTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-outline" nameFocused="calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutor/calendar"
        options={{
          title: 'Calendar',
          href: tutorTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-outline" nameFocused="calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutor/requests"
        options={{
          title: 'Requests',
          href: tutorTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="cube-outline" nameFocused="cube" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          href: studentTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-outline" nameFocused="chatbubble" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutor/messages"
        options={{
          title: 'Messages',
          href: tutorTab,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-outline" nameFocused="chatbubble" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" nameFocused="person" focused={focused} />
          ),
        }}
      />

      {/* ── Tutor module screens (IT23722286) ── */}
      <Tabs.Screen name="tutor/request-details"    options={{ href: null }} />
      <Tabs.Screen name="tutor/session-details"    options={{ href: null }} />
      <Tabs.Screen name="tutor/reschedule"         options={{ href: null }} />
      <Tabs.Screen name="tutor/availability"       options={{ href: null }} />
      <Tabs.Screen name="tutor/payments"           options={{ href: null }} />
      <Tabs.Screen name="tutor/reviews"            options={{ href: null }} />
      <Tabs.Screen name="tutor/chat"               options={{ href: null }} />

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

      {/* ── Chat module screens (IT23730892) ── */}
      <Tabs.Screen name="chat-conversation"         options={{ href: null }} />

      {/* ── Discovery module screens (IT23732254) ── */}
      <Tabs.Screen name="tutor-filters"            options={{ href: null }} />
      <Tabs.Screen name="tutor-profile"            options={{ href: null }} />
      <Tabs.Screen name="tutor-reviews"            options={{ href: null }} />
      <Tabs.Screen name="request-custom-session"   options={{ href: null }} />
      <Tabs.Screen name="request-sent"             options={{ href: null }} />
      <Tabs.Screen name="write-review"             options={{ href: null }} />
    </Tabs>
  );
}
