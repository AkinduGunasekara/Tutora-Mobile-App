import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

import api from '@/lib/api';

export type Role = 'student' | 'tutor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  phone?: string;
  university?: string;
  degree?: string;
  year?: string;
  studentId?: string;
  bio?: string;
  subjects?: string[];
  qualifications?: string[];
  hourlyRate?: number;
  onlineSessions?: boolean;
  faceToFaceSessions?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

// Tutors land on their dashboard, students on the existing home screen
export const homeRouteFor = (_role: Role) => '/(tabs)/home' as any;

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore read errors
    } finally {
      setLoading(false);
    }
  };

  const persist = async (t: string, u: AuthUser) => {
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await persist(data.token, data.user);
    router.replace(homeRouteFor(data.user.role));
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    await persist(data.token, data.user);
    router.replace(homeRouteFor(data.user.role));
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
    router.replace('/welcome');
  };

  const updateUser = (data: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    AsyncStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
