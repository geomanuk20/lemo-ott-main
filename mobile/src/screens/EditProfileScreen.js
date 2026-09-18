import React, { useState, useContext, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Camera, 
  Smile, 
  Trash2,
  Image as ImageIcon
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import { formatImageUrl } from '../config/api';
import CustomAlert from '../components/CustomAlert';
import CartoonAvatarPicker from '../components/CartoonAvatarPicker';

export default function EditProfileScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { user, setUser, updateUser } = useContext(AuthContext);
  const { userDetails } = route.params || {};

  const [name, setName] = useState(userDetails?.name || user?.name || '');
  const [email, setEmail] = useState(userDetails?.email || user?.email || '');
  const [phone, setPhone] = useState(userDetails?.phone || user?.phone || '');
  const [password, setPassword] = useState('');
  
  // Avatar states
  const initialAvatar = userDetails?.profileImage || user?.profileImage || '';
  const [avatarUri, setAvatarUri] = useState(initialAvatar);
  const [isLocalFile, setIsLocalFile] = useState(false);
  const [showCartoonPicker, setShowCartoonPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title, message, buttons = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // 1. Pick custom avatar image from gallery
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Please allow camera roll access in settings to upload a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setIsLocalFile(true);
      }
    } catch (err) {
      console.error('[EditProfile] Error picking image:', err);
      showAlert('Error', 'Failed to select image.');
    }
  };

  // 2. Select predefined Cartoon / Character avatar
  const handleSelectCartoonAvatar = (url) => {
    setAvatarUri(url);
    setIsLocalFile(false);
  };

  // 3. Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarUri('');
    setIsLocalFile(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      showAlert('Validation Error', 'Email cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      let updatedUserData = null;

      if (isLocalFile && avatarUri) {
        // Multipart FormData for uploaded local image
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('email', email.trim());
        formData.append('phone', phone.trim());
        if (password.trim() !== '') {
          formData.append('password', password);
        }

        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('profileImage', {
          uri: avatarUri,
          name: filename,
          type: type
        });

        const res = await client.put(`/users/${user.id || user._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updatedUserData = res.data;
      } else {
        // Standard JSON payload with avatar URL or empty
        const payload = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          profileImage: avatarUri
        };
        if (password.trim() !== '') {
          payload.password = password;
        }

        const res = await client.put(`/users/${user.id || user._id}`, payload);
        updatedUserData = res.data;
      }

      if (updatedUserData) {
        const merged = {
          ...user,
          name: updatedUserData.name,
          email: updatedUserData.email,
          phone: updatedUserData.phone,
          profileImage: updatedUserData.profileImage
        };
        setUser(merged);
        if (updateUser) {
          await updateUser(merged);
        }

        showAlert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const previewAvatarUrl = avatarUri
    ? isLocalFile
      ? avatarUri
      : formatImageUrl(avatarUri)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarCard}>
          <Text style={styles.avatarSectionTitle}>Profile Avatar</Text>
          
          <View style={styles.avatarWrapper}>
            {previewAvatarUrl ? (
              <Image source={{ uri: previewAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarPlaceholderText}>{getInitials(name)}</Text>
              </View>
            )}
          </View>

          {/* Avatar Action Buttons */}
          <View style={styles.avatarActionsRow}>
            <TouchableOpacity 
              style={[styles.avatarBtn, styles.cartoonBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.primary }]}
              onPress={() => setShowCartoonPicker(true)}
              activeOpacity={0.75}
            >
              <Smile color={theme.primary} size={16} />
              <Text style={[styles.avatarBtnText, { color: theme.primary }]}>Choose Cartoon</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.avatarBtn, styles.uploadBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}
              onPress={handlePickImage}
              activeOpacity={0.75}
            >
              <Camera color={theme.text} size={16} />
              <Text style={[styles.avatarBtnText, { color: theme.text }]}>Upload Photo</Text>
            </TouchableOpacity>

            {avatarUri ? (
              <TouchableOpacity 
                style={[styles.avatarIconBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}
                onPress={handleRemoveAvatar}
                activeOpacity={0.75}
              >
                <Trash2 color="#ef4444" size={16} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* User Info Form */}
        <View style={styles.formCard}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User color={theme.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail color={theme.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone color={theme.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Password Change Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Change Password</Text>
            <View style={styles.inputWrapper}>
              <Lock color={theme.textSecondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Leave blank to keep current"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={Boolean(loading)}>
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <>
              <Save color="#000000" size={20} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Cartoon Avatar Picker Modal */}
      <CartoonAvatarPicker
        visible={showCartoonPicker}
        selectedAvatarUrl={avatarUri}
        onSelectAvatar={handleSelectCartoonAvatar}
        onClose={() => setShowCartoonPicker(false)}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
  avatarCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: theme.cardSecondary,
    borderWidth: 3,
    borderColor: theme.primary,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '900',
  },
  avatarActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  avatarIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  avatarBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardSecondary,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
