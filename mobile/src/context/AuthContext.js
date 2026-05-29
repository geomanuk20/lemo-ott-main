import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load cached token and user data on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Asynchronously validate session on boot
          validateSession(storedToken);
        }
      } catch (e) {
        console.error('Failed to load cached auth state', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const validateSession = async (authToken) => {
    try {
      const response = await client.get('/auth/validate', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.data && response.data.user) {
        const updatedUser = { ...user, ...response.data.user, id: response.data.user.id };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.warn('Session expired or invalid, logging out', error.message);
      if (error.response && error.response.status === 401) {
        logout();
      }
    }
  };

  const getDeviceId = async () => {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
    } catch (_) {
      return `mobile_${Date.now()}`;
    }
  };

  const login = async (email, password) => {
    try {
      const deviceId = await getDeviceId();
      const response = await client.post('/login', { email, password, deviceId });
      const { token: receivedToken, user: receivedUser } = response.data;

      if (!receivedToken || !receivedUser) {
        throw new Error('Invalid login response from server');
      }

      await AsyncStorage.setItem('token', receivedToken);
      await AsyncStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const deviceId = await getDeviceId();
      const response = await client.post('/register', { name, email: email.trim().toLowerCase(), password, deviceId });
      const { token: receivedToken, user: receivedUser } = response.data;

      if (!receivedToken || !receivedUser) {
        throw new Error('Registration succeeded but auth token was not returned');
      }

      await AsyncStorage.setItem('token', receivedToken);
      await AsyncStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const socialLoginMobile = async (email, name, provider) => {
    try {
      const deviceId = await getDeviceId();
      const response = await client.post('/auth/social-login-mobile', { email, name, provider, deviceId });
      const { token: receivedToken, user: receivedUser } = response.data;

      if (!receivedToken || !receivedUser) {
        throw new Error('Invalid login response from server');
      }

      await AsyncStorage.setItem('token', receivedToken);
      await AsyncStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Social login failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Error logging out', e);
    }
  };

  const updateUser = async (updatedFields) => {
    try {
      const mergedUser = { ...user, ...updatedFields };
      await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
      setUser(mergedUser);
    } catch (e) {
      console.error('Error updating user state & storage', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        user,
        token,
        loading,
        login,
        register,
        socialLoginMobile,
        logout,
        setUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
