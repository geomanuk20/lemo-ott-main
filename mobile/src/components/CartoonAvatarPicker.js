import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { X, Check, Smile } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { CARTOON_CATEGORIES, CARTOON_AVATARS } from '../constants/avatars';

const { width } = Dimensions.get('window');

export default function CartoonAvatarPicker({
  visible,
  selectedAvatarUrl,
  onSelectAvatar,
  onClose
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredAvatars = useMemo(() => {
    if (activeCategory === 'all') return CARTOON_AVATARS;
    return CARTOON_AVATARS.filter(a => a.category === activeCategory);
  }, [activeCategory]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Smile color={theme.primary} size={20} />
              <Text style={styles.headerTitle}>Choose Cartoon Avatar</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X color={theme.text} size={22} />
            </TouchableOpacity>
          </View>

          {/* Categories Horizontal Scroll */}
          <View style={styles.categoryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CARTOON_CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isActive && styles.categoryChipActive
                    ]}
                    onPress={() => setActiveCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isActive && styles.categoryChipTextActive
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Avatar Grid */}
          <FlatList
            data={filteredAvatars}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedAvatarUrl === item.url;
              return (
                <TouchableOpacity
                  style={[
                    styles.avatarItem,
                    isSelected && styles.avatarItemSelected
                  ]}
                  onPress={() => {
                    onSelectAvatar(item.url);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.avatarImgWrapper}>
                    <Image
                      source={{ uri: item.url }}
                      style={styles.avatarImg}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check color="#000000" size={14} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.avatarName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderColor: theme.cardBorder,
      maxHeight: '82%',
      minHeight: 450,
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
    },
    closeBtn: {
      padding: 4,
    },
    categoryContainer: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.cardSecondary,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    categoryChipTextActive: {
      color: '#000000',
      fontWeight: '800',
    },
    gridContent: {
      padding: 16,
      paddingBottom: 32,
    },
    avatarItem: {
      flex: 1 / 3,
      alignItems: 'center',
      padding: 8,
      margin: 4,
      borderRadius: 16,
      backgroundColor: theme.cardSecondary,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    avatarItemSelected: {
      borderColor: theme.primary,
      backgroundColor: 'rgba(179, 211, 50, 0.12)',
    },
    avatarImgWrapper: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#1a1a1a',
      overflow: 'hidden',
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImg: {
      width: 76,
      height: 76,
      borderRadius: 38,
    },
    checkBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: theme.primary,
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#000',
    },
    avatarName: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
  });
