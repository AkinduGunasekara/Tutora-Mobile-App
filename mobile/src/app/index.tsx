import { Redirect } from 'expo-router';

import { homeRouteFor, useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return <Redirect href={user ? homeRouteFor(user.role) : '/welcome'} />;
}
