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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemes } from '@/hooks/themes';
import { API_URL } from '@/constants/api';
import CustomAlert from '@/components/CustomAlert';
import { useRouter } from 'expo-router';


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
  navigation?: any; // Add navigation prop
}

const Profile: React.FC<ProfileProps> = ({ navigation }) => {
  const router = useRouter()
  const { user, token } = useAuth();
  const { colors, createStyles } = useThemes();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    user_type: '',
  });
  
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [ isLoading ] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Alert states
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

  // Initialize form with user data
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

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const handleBack = () => {
    router.back()
  };

  const validateForm = (): boolean => {
    const newErrors: ProfileErrors = {};

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation (optional but if provided, should be valid)
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
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

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
          // Handle validation errors from backend
          const backendErrors: ProfileErrors = {};
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              backendErrors[key as keyof ProfileErrors] = data[key][0];
            } else {
              backendErrors[key as keyof ProfileErrors] = data[key];
            }
          });
          setErrors(backendErrors);
        } else {
          throw new Error(data.detail || 'Failed to update profile');
        }
        return;
      }

      showAlert({
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully!',
        onConfirm: hideAlert
      });
      
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        onConfirm: hideAlert
      });
    } finally {
      setIsSaving(false);
    }
  };

  

  const styles = createStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: 20
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    generalError: {
      backgroundColor: colors.error + '20',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    generalErrorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
    readOnlyContainer: {
      backgroundColor: colors.border,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    readOnlyLabel: {
      fontSize: 12,
      color: colors.textTertiary,
      marginBottom: 4,
    },
    readOnlyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    verificationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    verificationText: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '500',
    },
    buttonContainer: {
      marginTop: 20,
    },
    saveButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  }));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.headerSubtitle, { marginTop: 16 }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account information</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {errors.general && (
          <View style={styles.generalError}>
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              placeholder="Enter your first name"
              placeholderTextColor={colors.textTertiary}
            />
            {errors.first_name && (
              <Text style={styles.errorText}>{errors.first_name}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              placeholder="Enter your last name"
              placeholderTextColor={colors.textTertiary}
            />
            {errors.last_name && (
              <Text style={styles.errorText}>{errors.last_name}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
            {user?.is_verified && (
              <View style={[styles.verificationBadge, { marginTop: 8 }]}>
                <Text style={styles.verificationText}>✓ Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <TextInput
              style={[styles.input, errors.phone_number && styles.inputError]}
              value={formData.phone_number}
              onChangeText={(value) => handleInputChange('phone_number', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
            {errors.phone_number && (
              <Text style={styles.errorText}>{errors.phone_number}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>User Type</Text>
            <Text style={styles.readOnlyText}>
              {formData.user_type || 'Not specified'}
            </Text>
          </View>

          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Account Status</Text>
            <Text style={styles.readOnlyText}>
              {user?.is_verified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || !user) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isSaving || !user}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Custom Alert */}
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
  );
};

export default Profile;