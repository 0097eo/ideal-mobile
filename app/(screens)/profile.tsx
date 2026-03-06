import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemes, AppColors } from '@/hooks/themes';
import { API_URL } from '@/constants/api';
import CustomAlert from '@/components/CustomAlert';
import { useRouter } from 'expo-router';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: string;
}

interface ProfileErrors {
  first_name?: string;
  last_name?: string;
  user_type?: string;
  email?: string;
  phone_number?: string;
  general?: string;
}

interface ProfileProps {
  navigation?: any;
}

// ─── Component ───────────────────────────────────────────────────────────────
const Profile: React.FC<ProfileProps> = ({ navigation }) => {
  const router = useRouter();
  const { user, token } = useAuth();
  const { colors } = useThemes();

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    user_type: '',
  });

  const [errors, setErrors] = useState<ProfileErrors>({});
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  const styles = makeStyles(colors);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        user_type: user.user_type || '',
      });
    }
  }, [user]);

  const showAlert = (config: Partial<typeof alertConfig>) => {
    setAlertConfig(prev => ({ ...prev, ...config }));
    setAlertVisible(true);
  };

  const hideAlert = () => setAlertVisible(false);

  const handleBack = () => router.back();

  const validateForm = (): boolean => {
    const newErrors: ProfileErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone_number && formData.phone_number.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone_number.trim())) {
        newErrors.phone_number = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/accounts/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const backendErrors: ProfileErrors = {};
          Object.keys(data).forEach(key => {
            backendErrors[key as keyof ProfileErrors] = Array.isArray(data[key]) ? data[key][0] : data[key];
          });
          setErrors(backendErrors);
        } else {
          throw new Error(data.detail || 'Failed to update profile');
        }
        return;
      }

      showAlert({ type: 'success', title: 'Success', message: 'Profile updated successfully!', onConfirm: hideAlert });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        onConfirm: hideAlert,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingRing}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} testID="profile-back-button">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── General error ── */}
        {errors.general && (
          <View style={styles.generalError}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        )}

        {/* ── Personal Information ── */}
        <View style={styles.section}>
          <View style={styles.sectionAccentLine} />
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={14} color={colors.primary} />
            <Text style={styles.sectionEyebrow}>Personal Information</Text>
          </View>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'first_name' && styles.inputWrapperFocused,
              errors.first_name && styles.inputWrapperError,
            ]}>
              <Ionicons name="person-outline" size={16} color={focusedField === 'first_name' ? colors.primary : colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(value) => handleInputChange('first_name', value)}
                placeholder="Enter your first name"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocusedField('first_name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.first_name && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                <Text style={styles.errorText}>{errors.first_name}</Text>
              </View>
            )}
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'last_name' && styles.inputWrapperFocused,
              errors.last_name && styles.inputWrapperError,
            ]}>
              <Ionicons name="person-outline" size={16} color={focusedField === 'last_name' ? colors.primary : colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(value) => handleInputChange('last_name', value)}
                placeholder="Enter your last name"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocusedField('last_name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.last_name && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                <Text style={styles.errorText}>{errors.last_name}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputWrapperFocused,
              errors.email && styles.inputWrapperError,
            ]}>
              <Ionicons name="mail-outline" size={16} color={focusedField === 'email' ? colors.primary : colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.email && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
            {user?.is_verified && (
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number <Text style={styles.optionalLabel}>(Optional)</Text></Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'phone_number' && styles.inputWrapperFocused,
              errors.phone_number && styles.inputWrapperError,
            ]}>
              <Ionicons name="call-outline" size={16} color={focusedField === 'phone_number' ? colors.primary : colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(value) => handleInputChange('phone_number', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone_number')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.phone_number && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                <Text style={styles.errorText}>{errors.phone_number}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Account Information ── */}
        <View style={styles.section}>
          <View style={styles.sectionAccentLine} />
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-outline" size={14} color={colors.primary} />
            <Text style={styles.sectionEyebrow}>Account Information</Text>
          </View>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.readOnlyCard}>
            <View style={styles.readOnlyIconBadge}>
              <Ionicons name="id-card-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.readOnlyTextGroup}>
              <Text style={styles.readOnlyLabel}>User Type</Text>
              <Text style={styles.readOnlyText}>{formData.user_type || 'Not specified'}</Text>
            </View>
          </View>

          <View style={styles.readOnlyCard}>
            <View style={styles.readOnlyIconBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color={user?.is_verified ? colors.success : colors.primary} />
            </View>
            <View style={styles.readOnlyTextGroup}>
              <Text style={styles.readOnlyLabel}>Account Status</Text>
              <Text style={[styles.readOnlyText, { color: user?.is_verified ? colors.success : colors.textSecondary }]}>
                {user?.is_verified ? 'Active & Verified' : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Save Button ── */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, (isSaving || !user) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || !user}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.primaryText} testID="loading-indicator" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={18} color={colors.primaryText} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Dynamic Styles ──────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Loading ─────────────────────────────────────────────────────────────
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    loadingRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primaryDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },

    // ── Header ─────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 54 : 24,
      paddingBottom: 14,
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.primaryBorder,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerEyebrow: {
      fontSize: 9,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    headerSpacer: { width: 40 },

    // ── Scroll ─────────────────────────────────────────────────────────────
    scrollContainer: {
      padding: 16,
      paddingBottom: 40,
      gap: 0,
    },

    // ── General error ───────────────────────────────────────────────────────
    generalError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: `${colors.error}12`,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
    },
    generalErrorText: {
      color: colors.error,
      fontSize: 14,
      flex: 1,
    },

    // ── Section card ────────────────────────────────────────────────────────
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingBottom: 20,
      marginBottom: 16,
    },
    sectionAccentLine: {
      height: 2,
      backgroundColor: colors.primary,
      opacity: 0.55,
      marginBottom: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    sectionEyebrow: {
      fontSize: 11,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 18,
      letterSpacing: 0.2,
    },

    // ── Input ───────────────────────────────────────────────────────────────
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    optionalLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      textTransform: 'none',
      letterSpacing: 0,
      fontWeight: '400',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 50,
    },
    inputWrapperFocused: {
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primaryDim,
    },
    inputWrapperError: {
      borderColor: `${colors.error}40`,
      backgroundColor: `${colors.error}12`,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      letterSpacing: 0.2,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    verificationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: `${colors.success}14`,
      borderWidth: 1,
      borderColor: `${colors.success}4D`,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    verificationText: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
    },

    // ── Read-only cards ─────────────────────────────────────────────────────
    readOnlyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    readOnlyIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primaryDim,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readOnlyTextGroup: {
      flex: 1,
    },
    readOnlyLabel: {
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.textTertiary,
      fontWeight: '600',
      marginBottom: 3,
    },
    readOnlyText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // ── Save button ─────────────────────────────────────────────────────────
    buttonContainer: {
      marginTop: 8,
      marginBottom: 20,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 12,
      elevation: 8,
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
  });

export default Profile;