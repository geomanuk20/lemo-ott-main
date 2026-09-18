import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Clock, 
  Award, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react-native';
import client from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function CareersScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchCareers = async () => {
    try {
      const res = await client.get('/careers?status=Active');
      if (res && res.data) {
        setCareers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCareers();
  };

  const handleApply = (item) => {
    const email = item.contactEmail || 'hr@lemoott.com';
    const subject = encodeURIComponent(`Application for ${item.title} - LEMO OTT`);
    const body = encodeURIComponent(
      `Hello HR Team,\n\nI am writing to apply for the position of ${item.title} at LEMO OTT.\n\nPlease find my resume attached.\n\nBest regards,`
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(err =>
      console.warn('Could not open email client:', err)
    );
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Careers</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBadge}>
            <Briefcase color={theme.primary} size={26} />
          </View>
          <Text style={styles.heroTitle}>Shape The Future Of Streaming</Text>
          <Text style={styles.heroSubtitle}>
            At LEMO OTT, we build world-class digital media and streaming experiences. Join our passionate team of innovators!
          </Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>OPEN POSITIONS</Text>
          <Text style={styles.sectionCountText}>{careers.length} Available</Text>
        </View>

        {/* List of Careers */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : careers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Sparkles color={theme.primary} size={36} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>No Openings Right Now</Text>
            <Text style={styles.emptyText}>
              We don't have any open vacancies at the moment. Please check back later or send your CV directly to our HR team.
            </Text>
            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={() => Linking.openURL('mailto:hr@lemoott.com?subject=General%20Application%20-%20LEMO%20OTT')}
            >
              <Mail color="#000000" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Send General Application</Text>
            </TouchableOpacity>
          </View>
        ) : (
          careers.map((item) => {
            const isExpanded = expandedId === item._id;
            return (
              <View key={item._id} style={styles.jobCard}>
                <TouchableOpacity
                  style={styles.jobHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(item._id)}
                >
                  <View style={{ flex: 1 }}>
                    {item.department ? (
                      <View style={styles.departmentBadge}>
                        <Text style={styles.departmentText}>{item.department}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      {item.location ? (
                        <View style={styles.metaItem}>
                          <MapPin color={theme.textSecondary} size={12} />
                          <Text style={styles.metaText}>{item.location}</Text>
                        </View>
                      ) : null}
                      {item.jobType ? (
                        <>
                          <Text style={styles.metaDot}>•</Text>
                          <View style={styles.metaItem}>
                            <Clock color={theme.textSecondary} size={12} />
                            <Text style={styles.metaText}>{item.jobType}</Text>
                          </View>
                        </>
                      ) : null}
                      {item.experience ? (
                        <>
                          <Text style={styles.metaDot}>•</Text>
                          <View style={styles.metaItem}>
                            <Award color={theme.textSecondary} size={12} />
                            <Text style={styles.metaText}>{item.experience}</Text>
                          </View>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.expandIcon}>
                    {isExpanded ? (
                      <ChevronUp color={theme.primary} size={20} />
                    ) : (
                      <ChevronDown color={theme.textSecondary} size={20} />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.jobDetails}>
                    {item.description ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailHeading}>About The Role</Text>
                        <Text style={styles.detailParagraph}>{item.description}</Text>
                      </View>
                    ) : null}

                    {item.requirements ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailHeading}>Requirements & Qualifications</Text>
                        <Text style={styles.detailParagraph}>{item.requirements}</Text>
                      </View>
                    ) : null}

                    {item.responsibilities ? (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailHeading}>Key Responsibilities</Text>
                        <Text style={styles.detailParagraph}>{item.responsibilities}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.applyBtn}
                      activeOpacity={0.8}
                      onPress={() => handleApply(item)}
                    >
                      <Mail color="#000000" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.applyBtnText}>Apply For Position</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(179, 211, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionCountText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
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
  jobCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  departmentBadge: {
    backgroundColor: 'rgba(179, 211, 50, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  departmentText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  jobTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  metaDot: {
    color: theme.cardBorder,
    fontSize: 12,
  },
  expandIcon: {
    paddingLeft: 8,
  },
  jobDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
  },
  detailSection: {
    marginTop: 14,
  },
  detailHeading: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailParagraph: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  applyBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  applyBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
