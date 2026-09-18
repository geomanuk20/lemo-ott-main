import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Film, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PlusCircle, 
  List, 
  User, 
  Video, 
  FileText 
} from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import CustomAlert from '../components/CustomAlert';

const CONTENT_TYPES = [
  'Movie',
  'Short Film',
  'Web Series',
  'Pocket Reel Series',
  'Documentary',
  'Music Video',
  'Other'
];

export default function SubmissionScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'history'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);
  
  // Custom Alert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title, message, buttons = [{ text: 'OK', style: 'default' }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const [formData, setFormData] = useState({
    name: user?.name || user?.username || '',
    email: user?.email || '',
    phone: '',
    contentName: '',
    contentType: 'Short Film',
    language: 'English',
    genres: 'Drama',
    videoLink: '',
    trailerLink: '',
    posterLink: '',
    description: '',
    actors: '',
    directors: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || user.username || '',
        email: prev.email || user.email || ''
      }));
      fetchMySubmissions();
    }
  }, [user]);

  const fetchMySubmissions = async () => {
    if (!user || !user.email) return;
    setLoading(true);
    try {
      const res = await client.get(`/submissions?email=${encodeURIComponent(user.email)}`);
      if (res && res.data) {
        setMySubmissions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMySubmissions();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showAlert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      showAlert('Required Field', 'Please enter your email address.');
      return;
    }
    if (!formData.contentName.trim()) {
      showAlert('Required Field', 'Please enter your content title.');
      return;
    }
    if (!formData.videoLink.trim()) {
      showAlert('Required Field', 'Please provide a video streaming/drive link.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        contentName: formData.contentName.trim(),
        contentType: formData.contentType,
        language: formData.language.trim(),
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        videoLink: formData.videoLink.trim(),
        trailerLink: formData.trailerLink.trim(),
        posterLink: formData.posterLink.trim(),
        description: formData.description.trim(),
        actors: formData.actors.trim(),
        directors: formData.directors.trim(),
        paymentStatus: 'free',
        status: 'Pending'
      };

      const res = await client.post('/submissions', payload);
      if (res.status === 200 || res.status === 201) {
        showAlert(
          'Submission Received!',
          'Your content has been successfully submitted to the LEMO OTT curation team. We will review your submission and contact you soon.',
          [
            {
              text: 'View Submissions',
              onPress: () => {
                setActiveTab('history');
                fetchMySubmissions();
                setFormData(prev => ({
                  ...prev,
                  contentName: '',
                  videoLink: '',
                  trailerLink: '',
                  posterLink: '',
                  description: '',
                  actors: '',
                  directors: ''
                }));
              }
            }
          ]
        );
      }
    } catch (err) {
      console.error('Submission error:', err);
      showAlert('Submission Failed', err.response?.data?.message || 'Could not submit content. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'approved') return '#b3d332';
    if (s === 'rejected') return '#ff4d4d';
    if (s === 'under review') return '#0088ff';
    return '#ff9800'; // pending
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Submission</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'submit' && styles.tabItemActive]}
          onPress={() => setActiveTab('submit')}
        >
          <PlusCircle color={activeTab === 'submit' ? theme.primary : theme.textSecondary} size={16} />
          <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>
            Submit Content
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
          onPress={() => {
            setActiveTab('history');
            fetchMySubmissions();
          }}
        >
          <List color={activeTab === 'history' ? theme.primary : theme.textSecondary} size={16} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            My Submissions ({mySubmissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          activeTab === 'history' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          ) : undefined
        }
      >
        {!user ? (
          /* Sign In Required */
          <View style={styles.authCard}>
            <User color={theme.textSecondary} size={48} style={{ marginBottom: 12 }} />
            <Text style={styles.authTitle}>Sign In Required</Text>
            <Text style={styles.authSubtext}>
              Please sign in to submit your movie, series, or short film to LEMO OTT and track submission status.
            </Text>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryBtnText}>Sign In To Submit</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'submit' ? (
          /* Submission Form */
          <View>
            <View style={styles.heroCard}>
              <Film color={theme.primary} size={24} style={{ marginBottom: 8 }} />
              <Text style={styles.heroTitle}>Submit Your Content</Text>
              <Text style={styles.heroSubtitle}>
                Showcase your movies, short films, web series, and pocket reel dramas to millions of viewers on LEMO OTT.
              </Text>
            </View>

            {/* Creator Info */}
            <Text style={styles.groupLabel}>CREATOR DETAILS</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Your Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(val) => handleChange('name', val)}
                placeholder="Enter creator name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(val) => handleChange('email', val)}
                placeholder="Enter contact email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(val) => handleChange('phone', val)}
                placeholder="+91 98765 43210"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            {/* Content Details */}
            <Text style={[styles.groupLabel, { marginTop: 16 }]}>CONTENT DETAILS</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Content Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.contentName}
                onChangeText={(val) => handleChange('contentName', val)}
                placeholder="e.g. Inception / Mutta Puffs"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Content Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {CONTENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pill, formData.contentType === type && styles.pillActive]}
                    onPress={() => handleChange('contentType', type)}
                  >
                    <Text style={[styles.pillText, formData.contentType === type && styles.pillTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Language *</Text>
              <TextInput
                style={styles.input}
                value={formData.language}
                onChangeText={(val) => handleChange('language', val)}
                placeholder="e.g. Malayalam, Tamil, English"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Genres (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.genres}
                onChangeText={(val) => handleChange('genres', val)}
                placeholder="e.g. Drama, Thriller, Comedy"
                placeholderTextColor="#666"
              />
            </View>

            {/* Media Links */}
            <Text style={[styles.groupLabel, { marginTop: 16 }]}>VIDEO & MEDIA LINKS</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Main Video URL / Google Drive Link *</Text>
              <TextInput
                style={styles.input}
                value={formData.videoLink}
                onChangeText={(val) => handleChange('videoLink', val)}
                placeholder="https://drive.google.com/... or Vimeo / YouTube"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Trailer Video Link</Text>
              <TextInput
                style={styles.input}
                value={formData.trailerLink}
                onChangeText={(val) => handleChange('trailerLink', val)}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Poster / Thumbnail Image Link</Text>
              <TextInput
                style={styles.input}
                value={formData.posterLink}
                onChangeText={(val) => handleChange('posterLink', val)}
                placeholder="https://..."
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Description / Synopsis</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formData.description}
                onChangeText={(val) => handleChange('description', val)}
                placeholder="Brief summary of your film or series..."
                placeholderTextColor="#666"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Cast & Crew</Text>
              <TextInput
                style={styles.input}
                value={formData.actors}
                onChangeText={(val) => handleChange('actors', val)}
                placeholder="Key actors, director, crew..."
                placeholderTextColor="#666"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={Boolean(submitting)}
            >
              {submitting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Send color="#000" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Submit Content For Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Submissions History */
          <View>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#b3d332" />
              </View>
            ) : mySubmissions.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText color="#666" size={44} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                <Text style={styles.emptyText}>
                  You haven't submitted any content yet. Use the "Submit Content" tab to send your creative works to LEMO OTT!
                </Text>
                <TouchableOpacity 
                  style={styles.primaryBtn} 
                  onPress={() => setActiveTab('submit')}
                >
                  <Text style={styles.primaryBtnText}>Submit New Content</Text>
                </TouchableOpacity>
              </View>
            ) : (
              mySubmissions.map((sub) => {
                const statusColor = getStatusColor(sub.status);
                const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

                return (
                  <View key={sub._id} style={styles.subCard}>
                    <View style={styles.subCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subTitle}>{sub.contentName || 'Untitled Project'}</Text>
                        <Text style={styles.subType}>{sub.contentType || 'Film'} • {sub.language || 'English'}</Text>
                      </View>
                      <View style={[styles.statusTag, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
                        <Text style={[styles.statusTagText, { color: statusColor }]}>
                          {sub.status || 'Pending'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.subMetaRow}>
                      <View style={styles.subMetaItem}>
                        <Clock color="#8e8e93" size={13} />
                        <Text style={styles.subMetaText}>Submitted: {dateStr}</Text>
                      </View>
                      {sub.phone ? (
                        <Text style={styles.subMetaText}>📞 {sub.phone}</Text>
                      ) : null}
                    </View>

                    {sub.description ? (
                      <Text style={styles.subDesc} numberOfLines={2}>
                        {sub.description}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: theme.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  groupLabel: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 14,
  },
  pillScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  pill: {
    backgroundColor: theme.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  pillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  pillText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  authCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  authTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  authSubtext: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  subCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  subType: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: theme.cardBorder,
    marginVertical: 10,
  },
  subMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subMetaText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  subDesc: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
});

