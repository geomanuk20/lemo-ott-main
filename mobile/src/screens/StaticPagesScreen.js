import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function StaticPagesScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { title, slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    if (slug === 'careers' || slug === 'career') {
      navigation.replace('Careers');
      return;
    }
    if (slug === 'submission' || slug === 'submissions') {
      navigation.replace('Submission');
      return;
    }

    const fetchPage = async () => {
      try {
        const response = await client.get('/pages');
        if (response.data) {
          let match = response.data.find(p => p.slug === slug);
          if (!match && (slug === 'terms-of-use' || slug === 'terms-of-service' || slug === 'terms')) {
            match = response.data.find(p => p.slug === 'terms-of-use' || p.slug === 'terms-of-service' || p.slug === 'terms');
          }
          if (!match) {
            // Fallbacks for help-center and supported-devices
            if (slug === 'help-center') {
              match = {
                title: 'Help Center',
                content: `
                  <p>Welcome to the Help Center. Here you can find answers and troubleshoot issues.</p>
                  <h3>How to Reset Password</h3>
                  <p>Navigate to the login screen and click on "Forgot Password?". Enter your email address to receive password reset instructions.</p>
                  <h3>Subscription Queries</h3>
                  <p>Go to the Subscription menu inside your profile tab to view available plans and purchase details.</p>
                  <h3>Contact Support</h3>
                  <p>If you need further assistance, please contact us at support@lemoott.com.</p>
                `
              };
            } else if (slug === 'supported-devices') {
              match = {
                title: 'Supported Devices',
                content: `
                  <p>LEMO OTT is compatible with a wide range of devices for streaming in high definition:</p>
                  <ul>
                    <li><strong>Smartphones & Tablets:</strong> Android (version 8.0 and above) & iOS (version 13.0 and above).</li>
                    <li><strong>Smart TVs:</strong> Android TV, Samsung Smart TV, LG WebOS, Apple TV, and Fire TV Stick.</li>
                    <li><strong>Web Browsers:</strong> Chrome, Safari, Firefox, and Edge on macOS, Windows, and Linux.</li>
                  </ul>
                `
              };
            }
          }
          setPageData(match || null);
        }
      } catch (error) {
        console.error('Error fetching static page:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  const htmlBg = theme.background;
  const htmlText = theme.text;
  const htmlTextSecondary = theme.textSecondary;
  const htmlBorder = theme.cardBorder;
  const htmlPrimary = theme.primary;

  const getSanitizedContent = (content, pageTitle) => {
    if (!content) return '';
    let cleaned = content.trim();
    const cleanTitle = (pageTitle || title || '').trim();
    if (cleanTitle) {
      const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const titleRegex = new RegExp(`^\\s*<h[1-3][^>]*>\\s*${escaped}\\s*<\\/h[1-3]>`, 'i');
      cleaned = cleaned.replace(titleRegex, '').trim();
    }
    return cleaned;
  };

  const htmlContent = pageData ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            background-color: ${htmlBg};
            color: ${htmlText};
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 16px;
            font-size: 15px;
            line-height: 1.6;
            margin: 0;
          }
          h1, h2, h3, h4 {
            color: ${htmlText};
            font-weight: 800;
            margin-top: 16px;
            margin-bottom: 12px;
          }
          h1 { font-size: 22px; border-bottom: 1px solid ${htmlBorder}; padding-bottom: 8px; }
          h2 { font-size: 18px; }
          p { margin-bottom: 16px; color: ${htmlTextSecondary}; }
          a { color: ${htmlPrimary}; text-decoration: none; font-weight: 600; }
          ul, ol { padding-left: 20px; margin-bottom: 16px; color: ${htmlTextSecondary}; }
          li { margin-bottom: 8px; }
          strong { color: ${htmlText}; }
        </style>
      </head>
      <body>
        <div>${getSanitizedContent(pageData.content, pageData.title)}</div>
      </body>
    </html>
  ` : '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {pageData ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={[styles.webView, { backgroundColor: theme.background }]}
          containerStyle={{ backgroundColor: theme.background }}
          onShouldStartLoadWithRequest={(request) => {
            // Keep base64 data and internal pages loading in WebView
            if (request.url.startsWith('about:blank') || request.url.startsWith('data:')) {
              // Check if there is an email address inside the about:blank URL (e.g. about:blank/support@lemoott.com)
              const emailMatch = request.url.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
              if (emailMatch) {
                const email = emailMatch[0];
                Linking.openURL(`mailto:${email}`).catch((err) =>
                  console.error('An error occurred trying to open email URL:', err)
                );
                return false;
              }
              return true;
            }
            
            // If mailto: or tel: or sms:
            if (
              request.url.startsWith('mailto:') ||
              request.url.startsWith('tel:') ||
              request.url.startsWith('sms:')
            ) {
              Linking.openURL(request.url).catch((err) =>
                console.error('An error occurred trying to open URL:', err)
              );
              return false;
            }

            // If http:// or https://
            if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
              Linking.openURL(request.url).catch((err) =>
                console.error('An error occurred trying to open web URL:', err)
              );
              return false;
            }

            // Check for fallback raw emails or file:/// urls containing email
            const emailMatch = request.url.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
            if (emailMatch) {
              const email = emailMatch[0];
              Linking.openURL(`mailto:${email}`).catch((err) =>
                console.error('An error occurred trying to open email URL:', err)
              );
              return false;
            }

            return true;
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Page content could not be loaded.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
    backgroundColor: theme.headerBackground,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
  },
  webView: {
    flex: 1,
    backgroundColor: theme.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.background,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

