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

const ForgotPassword = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });
  const [error, setError] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (error) setError('');
  };

  const handleBlur = () => {
    setError(validateEmail(email));
  };

  const requestPasswordReset = async () => {
    if (validateEmail(email) !== '') {
      setError(validateEmail(email));
      return;
    }

    setIsLoading(true);
    try {
      const userEmail = email.trim().toLowerCase();
      const response = await fetch(`${API_URL}/accounts/request-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        router.push(`/resetPassword?email=${encodeURIComponent(userEmail)}`);
      } else {
        throw new Error('Failed to send request. Please try again.');
      }
    } catch (err: any) {
      setAlertConfig({
        type: 'error',
        title: 'Request Failed',
        message: err.message || 'An unexpected error occurred.',
      });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInClick = () => {
    router.push('/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F0C08',
    },
    // ── Background image ──
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
    // ── Top badge ──
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
      marginBottom: 32,
    },
    badgeText: {
      fontSize: 11,
      color: '#D4A96A',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    // ── Icon ──
    iconWrapper: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: 'rgba(212, 169, 106, 0.15)',
      borderWidth: 1.5,
      borderColor: 'rgba(212, 169, 106, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    // ── Heading ──
    headingBlock: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.55)',
      textAlign: 'center',
      lineHeight: 22,
    },
    // ── Form ──
    formContainer: {
      marginBottom: 28,
    },
    inputContainer: {
      marginBottom: 20,
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
    },
    inputError: {
      borderColor: '#FF6B6B',
      borderWidth: 1.5,
      backgroundColor: 'rgba(255,107,107,0.06)',
    },
    inputFocused: {
      borderColor: '#D4A96A',
      borderWidth: 1.5,
    },
    errorText: {
      color: '#FF8F8F',
      fontSize: 13,
      marginTop: 6,
      marginLeft: 2,
    },
    // ── CTA Button ──
    actionButton: {
      backgroundColor: '#D4A96A',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#D4A96A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    actionButtonDisabled: {
      backgroundColor: 'rgba(212, 169, 106, 0.35)',
      shadowOpacity: 0,
      elevation: 0,
    },
    actionButtonText: {
      color: '#1A1208',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    // ── Back to sign in ──
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    signInText: {
      color: 'rgba(255,255,255,0.45)',
      fontSize: 14,
    },
    signInLink: {
      color: '#D4A96A',
      fontSize: 14,
      fontWeight: '700',
    },
  });

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
            <Ionicons name="shield-checkmark-outline" size={12} color="#D4A96A" />
            <Text style={styles.badgeText}>Account Recovery</Text>
          </View>

          <View style={styles.iconWrapper}>
            <Ionicons name="key-outline" size={32} color="#D4A96A" />
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  placeholder="john.doe@example.com"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={email}
                  onChangeText={handleInputChange}
                  onBlur={handleBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={requestPasswordReset}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Remember your password?</Text>
            <TouchableOpacity onPress={handleSignInClick} disabled={isLoading}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {isLoading && <LoadingSpinner message="Sending request..." color="#D4A96A" />}

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

export default ForgotPassword;