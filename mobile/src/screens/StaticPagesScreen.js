import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';
import client from '../api/client';

export default function StaticPagesScreen({ route, navigation }) {
  const { title, slug } = route.params;
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await client.get('/pages');
        if (response.data) {
          let match = response.data.find(p => p.slug === slug);
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

  const htmlContent = pageData ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            background-color: #000000;
            color: #e5e5ea;
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 16px;
            font-size: 15px;
            line-height: 1.6;
          }
          h1, h2, h3, h4 {
            color: #ffffff;
            font-weight: 800;
            margin-top: 24px;
            margin-bottom: 12px;
          }
          h1 { font-size: 22px; border-bottom: 1px solid #1f1f1f; padding-bottom: 8px; }
          h2 { font-size: 18px; }
          p { margin-bottom: 16px; color: #a1a1a6; }
          a { color: #b3d332; text-decoration: none; font-weight: 600; }
          ul, ol { padding-left: 20px; margin-bottom: 16px; color: #a1a1a6; }
          li { margin-bottom: 8px; }
          strong { color: #ffffff; }
        </style>
      </head>
      <body>
        <h1>${pageData.title}</h1>
        <div>${pageData.content}</div>
      </body>
    </html>
  ` : '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b3d332" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {pageData ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={[styles.webView, { backgroundColor: '#000000' }]}
          containerStyle={{ backgroundColor: '#000000' }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Page content could not be loaded.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
  },
});
