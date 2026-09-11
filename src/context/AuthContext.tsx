'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';
import api from '@/lib/api';
import { disconnectSocket, getSocket } from '@/lib/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  updateProfile: (profileData: {
    name: string;
    email: string;
    nickname?: string;
    bio?: string;
    livesIn?: string;
    fromCity?: string;
    gender?: string;
    workplace?: string;
    workTitle?: string;
    educationDept?: string;
    educationSchool?: string;
    isLocked?: boolean;
    avatarFile?: File | null;
    coverFile?: File | null;
  }) => Promise<User>;
  activeFont: 'sans' | 'serif' | 'display';
  changeFont: (newFont: 'sans' | 'serif' | 'display') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFont, setActiveFont] = useState<'sans' | 'serif' | 'display'>('sans');
  const router = useRouter();
  const pathname = usePathname();

  const applyFont = (fontName: 'sans' | 'serif' | 'display') => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      body.classList.remove('font-sans-active', 'font-serif-active', 'font-display-active');
      body.classList.add(`font-${fontName}-active`);
    }
  };

  const changeFont = (newFont: 'sans' | 'serif' | 'display') => {
    localStorage.setItem('app-font', newFont);
    setActiveFont(newFont);
    applyFont(newFont);
  };

  useEffect(() => {
    const initAuth = async () => {
      // Initialize font
      const savedFont = localStorage.getItem('app-font') as any;
      if (savedFont && ['sans', 'serif', 'display'].includes(savedFont)) {
        setActiveFont(savedFont);
        applyFont(savedFont);
      } else {
        applyFont('sans');
      }

      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        getSocket(savedToken);
        setLoading(false);
      } else {
        // Try to recover session from HTTP-only cookie using refresh-token
        try {
          const response = await api.post('/auth/refresh-token');
          const newToken = response.data.data.accessToken;
          
          // Get user details
          const profileResponse = await api.get('/user/profile/me', {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          const newUser = profileResponse.data.data;
          
          localStorage.setItem('token', newToken);
          localStorage.setItem('user', JSON.stringify(newUser));
          setToken(newToken);
          setUser(newUser);
          getSocket(newToken);
        } catch (error) {
          console.log('No active session found.');
        } finally {
          setLoading(false);
        }
      }
    };

    initAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname?.startsWith('/auth');
      if (!user && !isAuthPage) {
        router.push('/auth/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    getSocket(newToken);
    router.push('/');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    disconnectSocket();
    router.push('/auth/login');
  };

  const updateUser = (newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const updateProfile = async (profileData: {
    name: string;
    email: string;
    nickname?: string;
    bio?: string;
    livesIn?: string;
    fromCity?: string;
    gender?: string;
    workplace?: string;
    workTitle?: string;
    educationDept?: string;
    educationSchool?: string;
    isLocked?: boolean;
    avatarFile?: File | null;
    coverFile?: File | null;
  }) => {
    const formData = new FormData();
    formData.append('name', profileData.name);
    formData.append('email', profileData.email);
    if (profileData.nickname !== undefined) formData.append('nickname', profileData.nickname);
    if (profileData.bio !== undefined) formData.append('bio', profileData.bio);
    if (profileData.livesIn !== undefined) formData.append('livesIn', profileData.livesIn);
    if (profileData.fromCity !== undefined) formData.append('fromCity', profileData.fromCity);
    if (profileData.gender !== undefined) formData.append('gender', profileData.gender);
    if (profileData.workplace !== undefined) formData.append('workplace', profileData.workplace);
    if (profileData.workTitle !== undefined) formData.append('workTitle', profileData.workTitle);
    if (profileData.educationDept !== undefined) formData.append('educationDept', profileData.educationDept);
    if (profileData.educationSchool !== undefined) formData.append('educationSchool', profileData.educationSchool);
    if (profileData.isLocked !== undefined) formData.append('isLocked', String(profileData.isLocked));
    
    if (profileData.avatarFile) {
      formData.append('avatar', profileData.avatarFile);
    }
    if (profileData.coverFile) {
      formData.append('cover', profileData.coverFile);
    }

    const response = await api.patch('/user/update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const updatedUser = response.data.data;
    updateUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, updateProfile, activeFont, changeFont }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
