import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemes } from '@/hooks/themes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { API_URL } from '@/constants/api';

interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

const Signup: React.FC = () => {
  const { colors } = useThemes();
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });
  
  // Form validation state
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        return '';
      
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        return '';
      
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'password':
        if (!value.trim()) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Validate confirm password when password changes
    if (name === 'password' && formData.confirmPassword) {
      const confirmPasswordError = value !== formData.confirmPassword ? 'Passwords do not match' : '';
      setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
    }
  };

  const handleBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword)
    };
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const signupUser = async (userData: SignupData) => {
    const response = await fetch(`${API_URL}/accounts/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.detail || 'Signup failed');
    }

    return data;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const signupData: SignupData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const response = await signupUser(signupData);
      
      // Show success alert
      setAlertConfig({
        type: 'success',
        title: 'Account Created!',
        message: response.message || 'Registration successful. Please check your email for verification.',
      });
      setAlertVisible(true);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Navigate to email verification after a short delay
      setTimeout(() => {
        setAlertVisible(false);
        router.push(`/(auth)/verify?email=${encodeURIComponent(signupData.email)}`);
      }, 2000);

    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        } else if (error.message.includes('Network') || 
                   error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('validation') || 
                   error.message.includes('invalid')) {
          errorMessage = 'Please check your information and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAlertConfig({
        type: 'error',
        title: 'Signup Failed',
        message: errorMessage,
      });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const getPasswordStrengthColor = () => {
    const password = formData.password;
    if (password.length === 0) return colors.textTertiary;
    if (password.length < 6) return colors.error;
    if (password.length < 8) return '#FFA500'; // Orange
    return '#10B981'; // Green
  };

  const getPasswordStrengthText = () => {
    const password = formData.password;
    if (password.length === 0) return '';
    if (password.length < 6) return 'Weak';
    if (password.length < 8) return 'Medium';
    return 'Strong';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logoIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    formContainer: {
      marginBottom: 32,
    },
    nameRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    nameInputContainer: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      paddingRight: 50,
    },
    inputError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: 14,
      padding: 4,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      marginTop: 4,
      marginLeft: 4,
    },
    passwordStrengthContainer: {
      marginTop: 8,
      marginLeft: 4,
    },
    passwordStrengthText: {
      fontSize: 12,
      fontWeight: '500',
    },
    signupButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    signupButtonDisabled: {
      backgroundColor: colors.textTertiary,
      shadowOpacity: 0,
      elevation: 0,
    },
    signupButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      marginHorizontal: 16,
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    loginContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    loginLink: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 4,
    },
  });


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="person-add" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and get started today</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.formContainer}>
            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={styles.nameInputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.firstName && styles.inputError,
                    ]}
                    placeholder="John"
                    placeholderTextColor={colors.textTertiary}
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    onBlur={() => handleBlur('firstName', formData.firstName)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={styles.nameInputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.lastName && styles.inputError,
                    ]}
                    placeholder="Doe"
                    placeholderTextColor={colors.textTertiary}
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    onBlur={() => handleBlur('lastName', formData.lastName)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                  ]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  onBlur={() => handleBlur('email', formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  onBlur={() => handleBlur('password', formData.password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              {formData.password && !errors.password && (
                <View style={styles.passwordStrengthContainer}>
                  <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                    Password Strength: {getPasswordStrengthText()}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textTertiary}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  onBlur={() => handleBlur('confirmPassword', formData.confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={handleLoginClick}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner message="Creating your account..." color={colors.primary} />
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        confirmText="OK"
      />
    </KeyboardAvoidingView>
  );
};

export default Signup;