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
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });

  const [errors, setErrors] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value.trim()) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default: return '';
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'password' && formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: value !== formData.confirmPassword ? 'Passwords do not match' : '' }));
    }
  };

  const handleBlur = (name: string, value: string) => {
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(e => e === '');
  };

  const signupUser = async (userData: SignupData) => {
    const response = await fetch(`${API_URL}/accounts/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.detail || 'Signup failed');
    return data;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const signupData: SignupData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      const response = await signupUser(signupData);
      setAlertConfig({ type: 'success', title: 'Account Created!', message: response.message || 'Registration successful. Please check your email for verification.' });
      setAlertVisible(true);
      setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
      setTimeout(() => {
        setAlertVisible(false);
        router.push(`/(auth)/verify?email=${encodeURIComponent(signupData.email)}`);
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.message) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setAlertConfig({ type: 'error', title: 'Signup Failed', message: errorMessage });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => router.push('/login');

  const getStrengthColor = () => {
    const len = formData.password.length;
    if (len === 0) return 'rgba(255,255,255,0.2)';
    if (len < 6) return '#FF6B6B';
    if (len < 8) return '#F59E0B';
    return '#10B981';
  };

  const getStrengthText = () => {
    const len = formData.password.length;
    if (len === 0) return '';
    if (len < 6) return 'Weak';
    if (len < 8) return 'Medium';
    return 'Strong';
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0C08' },
    bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.18 },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
    // ── Header ──
    badge: {
      alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(212,169,106,0.12)', borderWidth: 1,
      borderColor: 'rgba(212,169,106,0.3)', borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 6, marginBottom: 28,
    },
    badgeText: { fontSize: 11, color: '#D4A96A', letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
    iconWrapper: {
      alignSelf: 'center', width: 72, height: 72, borderRadius: 20,
      backgroundColor: 'rgba(212,169,106,0.15)', borderWidth: 1.5,
      borderColor: 'rgba(212,169,106,0.4)', justifyContent: 'center',
      alignItems: 'center', marginBottom: 22,
    },
    headingBlock: { alignItems: 'center', marginBottom: 36 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 8, letterSpacing: -0.4 },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
    // ── Form ──
    formContainer: { marginBottom: 24 },
    nameRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
    nameInputContainer: { flex: 1 },
    inputContainer: { marginBottom: 18 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: 0.4 },
    inputWrapper: { position: 'relative' },
    input: {
      backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: '#FFFFFF', paddingRight: 52,
    },
    inputError: { borderColor: '#FF6B6B', borderWidth: 1.5, backgroundColor: 'rgba(255,107,107,0.06)' },
    passwordToggle: { position: 'absolute', right: 14, top: 14, padding: 4 },
    errorText: { color: '#FF8F8F', fontSize: 12, marginTop: 5, marginLeft: 2 },
    // ── Password strength ──
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginLeft: 2 },
    strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
    strengthFill: { height: '100%', borderRadius: 2 },
    strengthText: { fontSize: 11, fontWeight: '600' },
    // ── CTA ──
    signupButton: {
      backgroundColor: '#D4A96A', borderRadius: 12, paddingVertical: 16,
      alignItems: 'center', marginTop: 8, marginBottom: 20,
      shadowColor: '#D4A96A', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    signupButtonDisabled: { backgroundColor: 'rgba(212,169,106,0.35)', shadowOpacity: 0, elevation: 0 },
    signupButtonText: { color: '#1A1208', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    // ── Divider ──
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { marginHorizontal: 14, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500' },
    // ── Login link ──
    loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
    loginText: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
    loginLink: { color: '#D4A96A', fontSize: 14, fontWeight: '700' },
  });

  const strengthWidth = formData.password.length === 0 ? '0%'
    : formData.password.length < 6 ? '33%'
    : formData.password.length < 8 ? '66%' : '100%';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=1200&fit=crop' }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={styles.badge}>
            <Ionicons name="person-add-outline" size={12} color="#D4A96A" />
            <Text style={styles.badgeText}>New Account</Text>
          </View>

          <View style={styles.iconWrapper}>
            <Ionicons name="person-add" size={32} color="#D4A96A" />
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and get started today</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Name row */}
            <View style={styles.nameRow}>
              <View style={styles.nameInputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={[styles.input, errors.firstName ? styles.inputError : null]}
                  placeholder="John"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  onBlur={() => handleBlur('firstName', formData.firstName)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={styles.nameInputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={[styles.input, errors.lastName ? styles.inputError : null]}
                  placeholder="Doe"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  onBlur={() => handleBlur('lastName', formData.lastName)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor="rgba(255,255,255,0.25)"
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

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  onBlur={() => handleBlur('password', formData.password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              {formData.password && !errors.password && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBar}>
                    <View style={[styles.strengthFill, { width: strengthWidth as any, backgroundColor: getStrengthColor() }]} />
                  </View>
                  <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                    Password Strength: {getStrengthText()}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  onBlur={() => handleBlur('confirmPassword', formData.confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>{isLoading ? 'Creating Account...' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLoginClick} disabled={isLoading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {isLoading && <LoadingSpinner message="Creating your account..." color="#D4A96A" />}
      <CustomAlert visible={alertVisible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} confirmText="OK" />
    </KeyboardAvoidingView>
  );
};

export default Signup;