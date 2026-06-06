import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, Modal } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import client from './src/api/client';
import ErrorBoundary from './src/components/ErrorBoundary';
import Constants from 'expo-constants';


const MobileCountdown = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    let timer;
    const calculateTimeLeft = () => {
      const diff = +new Date(targetDate) - +new Date();
      if (diff <= 0) {
        setTimeLeft('Maintenance is completing...');
        clearInterval(timer);
        if (onComplete) {
          setTimeout(onComplete, 1500);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(`Estimated completion in: ${parts.join(' ')}`);
    };

    calculateTimeLeft();
    timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <Text style={{
      color: '#b3d332',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.5
    }}>
      ⏱️ {timeLeft}
    </Text>
  );
};

function AppContent() {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState(null);

  // App Update States
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  useEffect(() => {
    client.get('/maintenance-settings')
      .then(res => {
        if (res.data) {
          setMaintenanceData(res.data);
          // Status is stored as Boolean true/false in the DB schema
          setMaintenance(res.data.status === true);
        }
      })
      .catch(() => {
        // If maintenance check fails, proceed normally
        setMaintenance(false);
      });

    // Check for App Updates from settings
    console.log('[AppUpdateCheck] Fetching settings from backend...');
    client.get('/android-app/settings')
      .then(res => {
        console.log('[AppUpdateCheck] Response data:', res.data);
        if (res.data) {
          const serverVersion = res.data.appVersion;
          const updateStatus = res.data.appUpdateStatus; // 'ON' / 'OFF'
          const localVersion = Constants.expoConfig?.version || '1.0.5';
          console.log('[AppUpdateCheck] Server Version:', serverVersion, 'Local Version:', localVersion, 'Status:', updateStatus);

          if (updateStatus?.toUpperCase() === 'ON' && serverVersion !== localVersion) {
            console.log('[AppUpdateCheck] Showing update modal!');
            setUpdateData(res.data);
            setUpdateAvailable(true);
          } else {
            console.log('[AppUpdateCheck] No update required or update status is OFF');
          }
        }
      })
      .catch(err => {
        console.warn('[AppUpdateCheck] Failed to check app update settings:', err.message || err);
      });

    // Check for App Notification configurations & Initialize OneSignal
    console.log('[OneSignal] Fetching notification configurations from backend...');
    client.get('/android-app/notification')
      .then(res => {
        if (res.data && res.data.onesignalAppId) {
          const onesignalAppId = res.data.onesignalAppId;
          
          // OneSignal relies on native code which is not in Expo Go by default
          const isExpoGo = Constants.appOwnership === 'expo';
          if (isExpoGo) {
            console.log('[OneSignal] Running in Expo Go. Skipping native OneSignal initialization.');
            return;
          }

          try {
            const { OneSignal } = require('react-native-onesignal');
            console.log('[OneSignal] Initializing with App ID:', onesignalAppId);
            
            OneSignal.initialize(onesignalAppId);
            OneSignal.Notifications.requestPermission(true);

            // Listen to notification clicks
            OneSignal.Notifications.addEventListener('click', (event) => {
              console.log('[OneSignal] Notification click event received:', event);
              const data = event.notification.additionalData;
              if (data?.externalLink) {
                console.log('[OneSignal] Redirecting user to:', data.externalLink);
                Linking.openURL(data.externalLink).catch(err => {
                  console.error('[OneSignal] Failed to open external link URL:', err);
                });
              }
            });
          } catch (error) {
            console.warn('[OneSignal] Native OneSignal library was not found in binary (Expo Go environment):', error.message || error);
          }
        }
      })
      .catch(err => {
        console.warn('[OneSignal] Failed to initialize OneSignal SDK:', err.message || err);
      });
  }, []);

  const handleUpdatePress = () => {
    if (updateData?.appUpdateUrl) {
      Linking.openURL(updateData.appUpdateUrl).catch(err => {
        console.error('Failed to open update URL:', err);
      });
    }
  };

  // Show maintenance screen if admin has enabled it
  if (maintenance === true) {
    const hasActiveTimer = maintenanceData?.endTime && new Date(maintenanceData.endTime) > new Date();
    
    const refreshMaintenance = () => {
      client.get('/maintenance-settings')
        .then(res => {
          if (res.data) {
            setMaintenanceData(res.data);
            setMaintenance(res.data.status === true);
          }
        })
        .catch(() => {
          setMaintenance(false);
        });
    };

    return (
      <View style={styles.maintenanceContainer}>
        <Text style={styles.maintenanceIcon}>🛠️</Text>
        <Text style={styles.maintenanceTitle}>
          {maintenanceData?.title || 'Under Maintenance'}
        </Text>
        <Text style={styles.maintenanceText}>
          {maintenanceData?.description || 'We are currently performing scheduled maintenance. Please check back soon.'}
        </Text>
        {hasActiveTimer && (
          <View style={{
            marginTop: 25,
            paddingVertical: 12,
            paddingHorizontal: 20,
            backgroundColor: 'rgba(179, 211, 50, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(179, 211, 50, 0.3)',
            borderRadius: 8,
            alignItems: 'center',
          }}>
            <MobileCountdown targetDate={maintenanceData.endTime} onComplete={refreshMaintenance} />
          </View>
        )}
      </View>
    );
  }

  const isForcedUpdate = updateData?.appCancelBtn?.toUpperCase() === 'OFF';

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#000000" />
        </AuthProvider>
      </View>

      {/* App Update Overlay Modal */}
      <Modal
        visible={updateAvailable}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isForcedUpdate) setUpdateAvailable(false);
        }}
      >
        <View style={styles.updateModalOverlay}>
          <View style={styles.updateCard}>
            <Text style={styles.updateIcon}>🚀</Text>
            <Text style={styles.updateTitle}>New Update Available!</Text>
            <Text style={styles.updateVersion}>Version {updateData?.appVersion}</Text>
            
            <Text style={styles.updateMsg}>
              {updateData?.appUpdateMsg || 'We have released a new version of the app with improvements and new features.'}
            </Text>

            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdatePress}>
              <Text style={styles.updateBtnText}>Update Now</Text>
            </TouchableOpacity>

            {!isForcedUpdate && (
              <TouchableOpacity 
                style={styles.cancelUpdateBtn} 
                onPress={() => setUpdateAvailable(false)}
              >
                <Text style={styles.cancelUpdateBtnText}>Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
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
  updateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  updateCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  updateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  updateTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  updateVersion: {
    color: '#b3d332',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  updateMsg: {
    color: '#8e8e93',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  updateBtn: {
    backgroundColor: '#b3d332',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  updateBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelUpdateBtn: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  cancelUpdateBtnText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '700',
  },
});



