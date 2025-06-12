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
import { useAuth } from '@/context/AuthContext';
import { useThemes } from '@/hooks/themes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';

interface LoginPageProps {
  onNavigateToForgotPassword?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToForgotPassword,
}) => {
  const { login, isLoading: authLoading } = useAuth();
  const { colors } = useThemes();
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });
  
  // Form validation state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      
      // Show success alert
      setAlertConfig({
        type: 'success',
        title: 'Welcome Back!',
        message: 'You have successfully logged in.',
      });
      setAlertVisible(true);
    } catch (error: any) {
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid credentials') || 
            error.message.includes('Login failed')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAlertConfig({
        type: 'error',
        title: 'Login Failed',
        message: errorMessage,
      });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    router.push('/signup');
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
    loginButton: {
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
    loginButtonDisabled: {
      backgroundColor: colors.textTertiary,
      shadowOpacity: 0,
      elevation: 0,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    forgotPasswordContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
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
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signupText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    signupLink: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 4,
    },
  });

  const isFormValid = email.trim() && password.trim() && !emailError && !passwordError;

  if (authLoading) {
    return <LoadingSpinner message="Loading..." color={colors.primary} />;
  }

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
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    emailError && styles.inputError,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  onBlur={() => validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    passwordError && styles.inputError,
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  onBlur={() => validatePassword(password)}
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
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (!isFormValid || isLoading) && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isFormValid || isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={onNavigateToForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={handleSignupClick}
              disabled={isLoading}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner message="Signing you in..." color={colors.primary} />
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

export default LoginPage;