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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemes } from '@/hooks/themes';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { API_URL } from '@/constants/api';

interface ResendData {
  email: string;
}

const Verify: React.FC = () => {
  const { colors } = useThemes();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();

  // Form state
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
  });
  
  // Form validation state
  const [error, setError] = useState('');
  
  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];
  
  // Refs for input focus management
  const inputRefs = useRef<(TextInput | null)[]>([]);

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

  // Cooldown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCodeChange = (text: string, index: number) => {
    const alphanumericText = text.replace(/[^a-zA-Z0-9]/g, '');
    
    if (alphanumericText.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = alphanumericText;
      setVerificationCode(newCode);
      
      // Clear error when user starts typing
      if (error) {
        setError('');
      }
      
      // Auto-focus next input
      if (alphanumericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendVerificationCode = async (resendData: ResendData) => {
    const response = await fetch(`${API_URL}/accounts/resend-verification/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.detail || 'Failed to resend code');
    }

    return data;
  };

  const handleVerification = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-character verification code');
      shakeAnimation();
      return;
    }

    if (!email) {
      setError('Email address is missing. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(email, code);
      
      // Show success alert
      setAlertConfig({
        type: 'success',
        title: 'Email Verified!',
        message: 'Your email has been successfully verified and you are now logged in!',
      });
      setAlertVisible(true);
      
      setTimeout(() => {
        setAlertVisible(false);
        router.push('/(tabs)');
      }, 2000);

    } catch (error: any) {
      let errorMessage = 'Verification failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('invalid') || 
            error.message.includes('incorrect') ||
            error.message.includes('expired')) {
          errorMessage = 'Invalid or expired verification code. Please check your code or request a new one.';
        } else if (error.message.includes('already verified')) {
          errorMessage = 'This email is already verified. You can now sign in.';
        } else if (error.message.includes('Network') || 
                   error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      shakeAnimation();
      
      // Clear the code on error
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Email address is missing. Please go back and try again.');
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    try {
      const resendData: ResendData = {
        email: email,
      };

      const response = await resendVerificationCode(resendData);
      
      // Show success message
      setAlertConfig({
        type: 'success',
        title: 'Code Sent!',
        message: response.message || 'A new verification code has been sent to your email.',
      });
      setAlertVisible(true);
      
      // Start cooldown
      setResendCooldown(60);
      
      // Clear current code
      setVerificationCode(['', '', '', '', '', '']);
      setError('');
      
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

    } catch (error: any) {
      let errorMessage = 'Failed to resend verification code. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already verified')) {
          errorMessage = 'This email is already verified. You can now sign in.';
        } else if (error.message.includes('rate limit') || 
                   error.message.includes('too many requests')) {
          errorMessage = 'Too many requests. Please wait a moment before requesting another code.';
        } else if (error.message.includes('Network') || 
                   error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAlertConfig({
        type: 'error',
        title: 'Resend Failed',
        message: errorMessage,
      });
      setAlertVisible(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    router.push('/signup');
  };

  const maskedEmail = email ? 
    email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 
    'your email';

  const isCodeComplete = verificationCode.every(digit => digit !== '');

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
      lineHeight: 24,
    },
    emailText: {
      color: colors.primary,
      fontWeight: '600',
    },
    formContainer: {
      marginBottom: 32,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    codeInput: {
      width: 48,
      height: 56,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },
    codeInputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    codeInputError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    verifyButton: {
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
    verifyButtonDisabled: {
      backgroundColor: colors.textTertiary,
      shadowOpacity: 0,
      elevation: 0,
    },
    verifyButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
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
    resendContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    resendText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 8,
    },
    resendButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    resendButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    resendButtonDisabled: {
      opacity: 0.5,
    },
    cooldownText: {
      color: colors.textTertiary,
      fontSize: 14,
      marginTop: 4,
    },
    backContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    backLink: {
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
            transform: [
              { translateY: slideAnim },
              { translateX: shakeAnim }
            ],
          }}
        >
          {/* Logo and Title */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="mail-outline" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We&apos;ve sent a 6-character verification code to{'\n'}
              <Text style={styles.emailText}>{maskedEmail}</Text>
            </Text>
          </View>

          {/* Verification Form */}
          <View style={styles.formContainer}>
            {/* Verification Code Input */}
            <View style={styles.codeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    error && styles.codeInputError,
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

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!isCodeComplete || isLoading) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerification}
              disabled={!isCodeComplete || isLoading}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn&apos;t receive the code?
            </Text>
            <TouchableOpacity
              style={[
                styles.resendButton,
                (resendCooldown > 0 || isResending) && styles.resendButtonDisabled,
              ]}
              onPress={handleResendCode}
              disabled={resendCooldown > 0 || isResending}
            >
              <Text style={styles.resendButtonText}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
            {resendCooldown > 0 && (
              <Text style={styles.cooldownText}>
                Resend available in {resendCooldown}s
              </Text>
            )}
          </View>

          {/* Back to Signup */}
          <View style={styles.backContainer}>
            <Text style={styles.backText}>Wrong email?</Text>
            <TouchableOpacity
              onPress={handleBackToSignup}
              disabled={isLoading}
            >
              <Text style={styles.backLink}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingSpinner message="Verifying your email..." color={colors.primary} />
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

export default Verify;