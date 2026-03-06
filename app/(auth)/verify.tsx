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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { API_URL } from '@/constants/api';

interface ResendData { email: string; }

const Verify: React.FC = () => {
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '', message: '',
  });

  const [error, setError] = useState('');

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

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
      const newCode = [...verificationCode];
      newCode[index] = alphanumericText;
      setVerificationCode(newCode);
      if (error) setError('');
      if (alphanumericText && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendVerificationCode = async (resendData: ResendData) => {
    const response = await fetch(`${API_URL}/accounts/resend-verification/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resendData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.detail || 'Failed to resend code');
    return data;
  };

  const handleVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) { setError('Please enter the complete 6-character verification code'); shakeAnimation(); return; }
    if (!email) { setError('Email address is missing. Please go back and try again.'); return; }
    setIsLoading(true);
    try {
      await verifyEmail(email, code);
      setAlertConfig({ type: 'success', title: 'Email Verified!', message: 'Your email has been successfully verified and you are now logged in!' });
      setAlertVisible(true);
      setTimeout(() => { setAlertVisible(false); router.push('/(tabs)'); }, 2000);
    } catch (error: any) {
      let errorMessage = 'Verification failed. Please try again.';
      if (error.message) {
        if (error.message.includes('invalid') || error.message.includes('incorrect') || error.message.includes('expired')) {
          errorMessage = 'Invalid or expired verification code. Please check your code or request a new one.';
        } else if (error.message.includes('already verified')) {
          errorMessage = 'This email is already verified. You can now sign in.';
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
      shakeAnimation();
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) { setError('Email address is missing. Please go back and try again.'); return; }
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      const response = await resendVerificationCode({ email });
      setAlertConfig({ type: 'success', title: 'Code Sent!', message: response.message || 'A new verification code has been sent to your email.' });
      setAlertVisible(true);
      setResendCooldown(60);
      setVerificationCode(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      let errorMessage = 'Failed to resend verification code. Please try again.';
      if (error.message) {
        if (error.message.includes('already verified')) errorMessage = 'This email is already verified. You can now sign in.';
        else if (error.message.includes('rate limit') || error.message.includes('too many requests')) errorMessage = 'Too many requests. Please wait a moment before requesting another code.';
        else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) errorMessage = 'Network error. Please check your internet connection and try again.';
        else errorMessage = error.message;
      }
      setAlertConfig({ type: 'error', title: 'Resend Failed', message: errorMessage });
      setAlertVisible(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => router.push('/signup');

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'your email';
  const isCodeComplete = verificationCode.every(digit => digit !== '');

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
    title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 10, letterSpacing: -0.4 },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 },
    emailHighlight: { color: '#D4A96A', fontWeight: '700' },
    // ── OTP ──
    formContainer: { marginBottom: 24 },
    codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    codeInput: {
      width: 48, height: 58,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12, textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#FFFFFF',
    },
    codeInputFilled: { borderColor: '#D4A96A', backgroundColor: 'rgba(212,169,106,0.1)' },
    codeInputError: { borderColor: '#FF6B6B', borderWidth: 1.5, backgroundColor: 'rgba(255,107,107,0.06)' },
    errorText: { color: '#FF8F8F', fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
    // ── Verify button ──
    verifyButton: {
      backgroundColor: '#D4A96A', borderRadius: 12, paddingVertical: 16,
      alignItems: 'center', marginBottom: 20,
      shadowColor: '#D4A96A', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    verifyButtonDisabled: { backgroundColor: 'rgba(212,169,106,0.25)', shadowOpacity: 0, elevation: 0 },
    verifyButtonText: { color: '#1A1208', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    // ── Divider ──
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { marginHorizontal: 14, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500' },
    // ── Resend ──
    resendContainer: { alignItems: 'center', marginBottom: 24 },
    resendText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', marginBottom: 8 },
    resendButton: { paddingVertical: 8, paddingHorizontal: 16 },
    resendButtonText: { color: '#D4A96A', fontSize: 15, fontWeight: '700' },
    resendButtonDisabled: { opacity: 0.4 },
    cooldownText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 },
    // ── Back ──
    backContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
    backText: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
    backLink: { color: '#D4A96A', fontSize: 14, fontWeight: '700' },
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
            <Ionicons name="mail-outline" size={12} color="#D4A96A" />
            <Text style={styles.badgeText}>Email Verification</Text>
          </View>

          <View style={styles.iconWrapper}>
            <Ionicons name="mail-outline" size={32} color="#D4A96A" />
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-character code to{'\n'}
              <Text style={styles.emailHighlight}>{maskedEmail}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.codeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  testID={`code-input-${index}`}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : null,
                    error ? styles.codeInputError : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="default"
                  maxLength={1}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  editable={!isLoading}
                  returnKeyType={index === 5 ? 'done' : 'next'}
                  onSubmitEditing={index === 5 ? handleVerification : undefined}
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.verifyButton, (!isCodeComplete || isLoading) && styles.verifyButtonDisabled]}
              onPress={handleVerification}
              disabled={!isCodeComplete || isLoading}
            >
              <Text style={styles.verifyButtonText}>{isLoading ? 'Verifying...' : 'Verify & Sign In'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              style={[styles.resendButton, (resendCooldown > 0 || isResending) && styles.resendButtonDisabled]}
              onPress={handleResendCode}
              disabled={resendCooldown > 0 || isResending}
            >
              <Text style={styles.resendButtonText}>{isResending ? 'Sending...' : 'Resend Code'}</Text>
            </TouchableOpacity>
            {resendCooldown > 0 && (
              <Text style={styles.cooldownText}>Resend available in {resendCooldown}s</Text>
            )}
          </View>

          <View style={styles.backContainer}>
            <Text style={styles.backText}>Wrong email?</Text>
            <TouchableOpacity onPress={handleBackToSignup} disabled={isLoading}>
              <Text style={styles.backLink}>Go Back</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {isLoading && <LoadingSpinner message="Verifying your email..." color="#D4A96A" />}
      <CustomAlert visible={alertVisible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} confirmText="OK" />
    </KeyboardAvoidingView>
  );
};

export default Verify;