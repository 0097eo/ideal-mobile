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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';

const LoginPage: React.FC = () => {
  const { login, isLoading: authLoading } = useAuth();

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) { setEmailError('Email is required'); return false; }
    if (!emailRegex.test(email)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) { setPasswordError('Password is required'); return false; }
    if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); return false; }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      setAlertConfig({ type: 'success', title: 'Welcome Back!', message: 'You have successfully logged in.' });
      setAlertVisible(true);
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.message) {
        if (error.message.includes('Invalid credentials') || error.message.includes('Login failed')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setAlertConfig({ type: 'error', title: 'Login Failed', message: errorMessage });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => router.push('/signup');
  const handleForgotPasswordClick = () => router.push('/forgotPassword');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F0C08',
    },
    bgImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      opacity: 0.18,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 48,
    },
    // ── Brand block ──
    brandBlock: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoRing: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: 'rgba(212, 169, 106, 0.15)',
      borderWidth: 1.5,
      borderColor: 'rgba(212, 169, 106, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 22,
    },
    eyebrow: {
      fontSize: 11,
      letterSpacing: 3,
      color: '#D4A96A',
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: 8,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
    },
    // ── Form ──
    formContainer: {
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 18,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 8,
      letterSpacing: 0.4,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 15,
      fontSize: 15,
      color: '#FFFFFF',
      paddingRight: 52,
    },
    inputError: {
      borderColor: '#FF6B6B',
      borderWidth: 1.5,
      backgroundColor: 'rgba(255,107,107,0.06)',
    },
    passwordToggle: {
      position: 'absolute',
      right: 14,
      top: 14,
      padding: 4,
    },
    errorText: {
      color: '#FF8F8F',
      fontSize: 13,
      marginTop: 6,
      marginLeft: 2,
    },
    // ── Login button ──
    loginButton: {
      backgroundColor: '#D4A96A',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 18,
      shadowColor: '#D4A96A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    loginButtonDisabled: {
      backgroundColor: 'rgba(212, 169, 106, 0.35)',
      shadowOpacity: 0,
      elevation: 0,
    },
    loginButtonText: {
      color: '#1A1208',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    // ── Forgot password ──
    forgotPasswordContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    forgotPasswordText: {
      color: '#D4A96A',
      fontSize: 14,
      fontWeight: '600',
    },
    // ── Divider ──
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
      marginHorizontal: 14,
      color: 'rgba(255,255,255,0.35)',
      fontSize: 13,
      fontWeight: '500',
    },
    // ── Sign up ──
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
    },
    signupText: {
      color: 'rgba(255,255,255,0.45)',
      fontSize: 14,
    },
    signupLink: {
      color: '#D4A96A',
      fontSize: 14,
      fontWeight: '700',
    },
  });

  if (authLoading) {
    return <LoadingSpinner message="Loading..." color="#D4A96A" />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=1200&fit=crop' }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Brand Block */}
          <View style={styles.brandBlock}>
            <View style={styles.logoRing}>
              <Ionicons name="person" size={32} color="#D4A96A" />
            </View>
            <Text style={styles.eyebrow}>Ideal Furniture</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={email}
                  onChangeText={(text) => { setEmail(text); if (emailError) validateEmail(text); }}
                  onBlur={() => validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, passwordError ? styles.inputError : null]}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={password}
                  onChangeText={(text) => { setPassword(text); if (passwordError) validatePassword(text); }}
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
                  testID="password-toggle-button"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPasswordClick} disabled={isLoading}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleSignupClick} disabled={isLoading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {isLoading && <LoadingSpinner message="Signing you in..." color="#D4A96A" />}

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