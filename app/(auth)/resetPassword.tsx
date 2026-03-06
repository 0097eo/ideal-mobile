import React, { useState, useEffect, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemes } from '@/hooks/themes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { API_URL } from '@/constants/api';

const ResetPassword = () => {
  const { colors } = useThemes();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [token, setToken] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });

  const [errors, setErrors] = useState({ token: '', newPassword: '', confirmPassword: '' });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleCodeChange = (text: string, index: number) => {
    const alphanumericText = text.replace(/[^a-zA-Z0-9]/g, '');
    if (alphanumericText.length <= 1) {
      const newCode = [...token];
      newCode[index] = alphanumericText;
      setToken(newCode);
      if (errors.token) setErrors(prev => ({ ...prev, token: '' }));
      if (alphanumericText && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'token': return value.length < 6 ? 'Please enter the complete 6-character code' : '';
      case 'newPassword':
        if (!value.trim()) return 'New password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your new password';
        if (value !== formData.newPassword) return 'Passwords do not match';
        return '';
      default: return '';
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const fullToken = token.join('');
    const newErrors = {
      token: validateField('token', fullToken),
      newPassword: validateField('newPassword', formData.newPassword),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleResetPassword = async () => {
    if (!validateForm()) { shakeAnimation(); return; }
    if (!email) {
      setAlertConfig({ type: 'error', title: 'Error', message: 'Email not found. Please start the process again.' });
      setAlertVisible(true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/accounts/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: token.join(''), new_password: formData.newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password. The code may be invalid or expired.');
      setAlertConfig({ type: 'success', title: 'Success!', message: 'Your password has been reset successfully.' });
      setAlertVisible(true);
      setTimeout(() => { setAlertVisible(false); router.replace('/login'); }, 2000);
    } catch (err: any) {
      setAlertConfig({ type: 'error', title: 'Reset Failed', message: err.message });
      setAlertVisible(true);
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0C08' },
    bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.18 },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 },
    // ── Header ──
    badge: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(212, 169, 106, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(212, 169, 106, 0.3)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginBottom: 28,
    },
    badgeText: { fontSize: 11, color: '#D4A96A', letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
    iconWrapper: {
      alignSelf: 'center',
      width: 72, height: 72, borderRadius: 20,
      backgroundColor: 'rgba(212, 169, 106, 0.15)',
      borderWidth: 1.5, borderColor: 'rgba(212, 169, 106, 0.4)',
      justifyContent: 'center', alignItems: 'center', marginBottom: 22,
    },
    headingBlock: { alignItems: 'center', marginBottom: 36 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 10, letterSpacing: -0.4 },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 },
    // ── Form ──
    formContainer: { marginBottom: 16 },
    inputContainer: { marginBottom: 18 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: 0.4 },
    inputWrapper: { position: 'relative' },
    input: {
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 15,
      fontSize: 15, color: '#FFFFFF', paddingRight: 52,
    },
    inputError: { borderColor: '#FF6B6B', borderWidth: 1.5, backgroundColor: 'rgba(255,107,107,0.06)' },
    passwordToggle: { position: 'absolute', right: 14, top: 14, padding: 4 },
    errorText: { color: '#FF8F8F', fontSize: 13, marginTop: 6, marginLeft: 2 },
    // ── OTP inputs ──
    codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    codeInput: {
      width: 48, height: 58,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12,
      textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#FFFFFF',
    },
    codeInputFilled: { borderColor: '#D4A96A', backgroundColor: 'rgba(212,169,106,0.1)' },
    codeInputError: { borderColor: '#FF6B6B', borderWidth: 1.5, backgroundColor: 'rgba(255,107,107,0.06)' },
    tokenErrorText: { color: '#FF8F8F', fontSize: 13, marginTop: 6, textAlign: 'center' },
    // ── CTA ──
    actionButton: {
      backgroundColor: '#D4A96A', borderRadius: 12, paddingVertical: 16,
      alignItems: 'center', marginTop: 8,
      shadowColor: '#D4A96A', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    actionButtonDisabled: { backgroundColor: 'rgba(212,169,106,0.35)', shadowOpacity: 0, elevation: 0 },
    actionButtonText: { color: '#1A1208', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=1200&fit=crop' }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }}>

          <View style={styles.badge}>
            <Ionicons name="lock-closed-outline" size={12} color="#D4A96A" />
            <Text style={styles.badgeText}>Password Reset</Text>
          </View>

          <View style={styles.iconWrapper}>
            <Ionicons name="lock-open-outline" size={32} color="#D4A96A" />
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>Enter the code from your email and create a new password.</Text>
          </View>

          <View style={styles.formContainer}>
            {/* OTP Code */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reset Code</Text>
              <View style={styles.codeContainer}>
                {token.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.codeInput,
                      digit ? styles.codeInputFilled : null,
                      errors.token ? styles.codeInputError : null,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="default"
                    maxLength={1}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                ))}
              </View>
              {errors.token ? <Text style={styles.tokenErrorText}>{errors.token}</Text> : null}
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.newPassword ? styles.inputError : null]}
                  placeholder="Enter your new password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={formData.newPassword}
                  onChangeText={(text) => handleInputChange('newPassword', text)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm your new password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>{isLoading ? 'Resetting...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {isLoading && <LoadingSpinner message="Resetting password..." color="#D4A96A" />}
      <CustomAlert visible={alertVisible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} confirmText="OK" />
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;