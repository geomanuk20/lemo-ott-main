import React, { useState, useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Shield } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { formatImageUrl } from '../config/api';

const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </Svg>
);

const FacebookIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="#1877F2" style={{ marginRight: 8 }}>
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </Svg>
);

export default function RegisterScreen({ navigation }) {
  const { register, socialLoginMobile, socialLoginReal } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [settings, setSettings] = useState(null);
  const [socialSettings, setSocialSettings] = useState(null);

  // Social Login WebView States
  const [showSocialWebView, setShowSocialWebView] = useState(false);
  const [socialAuthUrl, setSocialAuthUrl] = useState('');
  const [socialProvider, setSocialProvider] = useState('');

  useEffect(() => {
    client.get('/general-settings')
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(() => {});

    client.get('/social-login-settings')
      .then(res => {
        if (res.data) setSocialSettings(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSocialLogin = (provider) => {
    setErrorMsg('');
    if (!socialSettings) {
      setErrorMsg('Failed to load social settings.');
      return;
    }

    if (provider === 'Google') {
      const clientId = socialSettings.googleClientId;
      if (!clientId || clientId === 'Hidden in Demo') {
        setErrorMsg('Google Client ID is not configured.');
        return;
      }
      const redirectUri = 'https://lemoott.com';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile%20openid`;
      
      setSocialProvider('Google');
      setSocialAuthUrl(authUrl);
      setShowSocialWebView(true);
    } else if (provider === 'Facebook') {
      const appId = socialSettings.facebookAppId;
      if (!appId || appId === 'Hidden in Demo') {
        setErrorMsg('Facebook App ID is not configured.');
        return;
      }
      const redirectUri = 'https://lemoott.com';
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email,public_profile`;
      
      setSocialProvider('Facebook');
      setSocialAuthUrl(authUrl);
      setShowSocialWebView(true);
    }
  };

  const handleWebViewNavigationStateChange = async (webViewState) => {
    const url = webViewState.url;
    if (url.includes('access_token=')) {
      setShowSocialWebView(false);
      setLoading(true);
      try {
        const match = url.match(/access_token=([^&]+)/);
        if (match && match[1]) {
          const accessToken = match[1];
          const result = await socialLoginReal(accessToken, socialProvider);
          if (!result.success) {
            setErrorMsg(result.error || `Failed to login with ${socialProvider}`);
          } else {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }
        }
      } catch (err) {
        setErrorMsg(`Failed during ${socialProvider} authentication.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const isAdminDomain = trimmedEmail.endsWith('@video.com') || trimmedEmail === 'admin@video.com';
    const isGmailDomain = trimmedEmail.endsWith('@gmail.com');

    if (isAdminDomain) {
      setErrorMsg('Registration is not permitted for admin email accounts.');
      return;
    }
    if (!isGmailDomain) {
      setErrorMsg('Only @gmail.com email addresses are permitted for registration.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const result = await register(name.trim(), trimmedEmail, password);

    setLoading(false);
    if (!result.success) {
      setErrorMsg(result.error);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            {settings?.siteLogo ? (
              <Image 
                source={{ uri: formatImageUrl(settings.siteLogo, 'logo') }} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
            ) : (
              <>
                <View style={styles.badge}>
                  <Shield color="#b3d332" size={32} strokeWidth={2.5} />
                </View>
                <Text style={styles.logoText}>LEMO <Text style={{ color: '#b3d332' }}>OTT</Text></Text>
              </>
            )}
            <Text style={styles.tagline}>Create a new account</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.headerTitle}>Sign Up</Text>
            <Text style={styles.headerSubtitle}>Start streaming premium content</Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#666"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password (Min 6 Characters)</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a secure password"
                placeholderTextColor="#666"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {(!socialSettings || socialSettings.googleLogin?.toUpperCase() !== 'OFF' || socialSettings.facebookLogin?.toUpperCase() !== 'OFF') && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  {(!socialSettings || socialSettings.googleLogin?.toUpperCase() !== 'OFF') && (
                    <TouchableOpacity 
                      style={[
                        styles.socialBtn, 
                        (socialSettings && socialSettings.facebookLogin?.toUpperCase() === 'OFF') && { width: '100%' }
                      ]} 
                      onPress={() => handleSocialLogin('Google')}
                    >
                      <GoogleIcon />
                      <Text style={styles.socialBtnText}>Google</Text>
                    </TouchableOpacity>
                  )}
                  {(!socialSettings || socialSettings.facebookLogin?.toUpperCase() !== 'OFF') && (
                    <TouchableOpacity 
                      style={[
                        styles.socialBtn, 
                        (socialSettings && socialSettings.googleLogin?.toUpperCase() === 'OFF') && { width: '100%' }
                      ]} 
                      onPress={() => handleSocialLogin('Facebook')}
                    >
                      <FacebookIcon />
                      <Text style={styles.socialBtnText}>Facebook</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Social Webview Modal */}
      <Modal
        visible={showSocialWebView}
        animationType="slide"
        onRequestClose={() => setShowSocialWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
          {/* Header Row to Close */}
          <View style={{
            height: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#1f1f1f',
            backgroundColor: '#121212'
          }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Sign In with {socialProvider}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowSocialWebView(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: '#ff4d4d', fontSize: 15, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <WebView
            source={{ uri: socialAuthUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            userAgent={Platform.OS === 'android' 
              ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            }
            renderLoading={() => (
              <ActivityIndicator 
                color="#b3d332" 
                size="large" 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: [{ translateX: -25 }, { translateY: -25 }]
                }} 
              />
            )}
          />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(179, 211, 50, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  logoImage: {
    width: '100%',
    height: 50,
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1f1f1f',
  },
  dividerText: {
    color: '#444446',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1b1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
  },
  socialBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tagline: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 10,
  },
  label: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1b1e',
    borderColor: '#2a2c31',
    borderWidth: 1,
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
  },
  registerBtn: {
    backgroundColor: '#b3d332',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#b3d332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  registerBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    color: '#8e8e93',
    fontSize: 13,
  },
  footerLink: {
    color: '#b3d332',
    fontSize: 13,
    fontWeight: '700',
  },
});
