import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import client from './src/api/client';

export default function App() {
  const [maintenance, setMaintenance] = useState(null); // null = loading
  const [maintenanceData, setMaintenanceData] = useState(null);

  useEffect(() => {
    client.get('/maintenance-settings')
      .then(res => {
        setMaintenanceData(res.data);
        // Status is stored as Boolean true/false in the DB schema
        setMaintenance(res.data?.status === true);
      })
      .catch(() => {
        // If maintenance check fails, proceed normally
        setMaintenance(false);
      });
  }, []);

  // Show app loading indicator while checking maintenance
  if (maintenance === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  // Show maintenance screen if admin has enabled it
  if (maintenance === true) {
    return (
      <View style={styles.maintenanceContainer}>
        <Text style={styles.maintenanceIcon}>🛠️</Text>
        <Text style={styles.maintenanceTitle}>
          {maintenanceData?.title || 'Under Maintenance'}
        </Text>
        <Text style={styles.maintenanceText}>
          {maintenanceData?.description || 'We are currently performing scheduled maintenance. Please check back soon.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#000000" />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintenanceContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  maintenanceIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  maintenanceTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  maintenanceText: {
    color: '#8e8e93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
