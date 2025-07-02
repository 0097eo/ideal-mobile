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

const ForgotPassword = () => {
  const { colors } = useThemes();
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
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
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
    container: { flex: 1,
        backgroundColor: colors.background 
    },
    scrollContainer: { flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40 
    },
    logoContainer: { 
        alignItems: 'center',
        marginBottom: 48 
    },
    logoIcon: { 
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16 
    },
    title: { 
        fontSize: 28,
        fontWeight: '700', 
        color: colors.text, 
        textAlign: 'center',
        marginBottom: 8 
    },
    subtitle: { 
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center' 
    },
    formContainer: { 
        marginBottom: 32 
    },
    inputContainer: { 
        marginBottom: 20
    },
    inputLabel: { 
        fontSize: 16,
        fontWeight: '600',
        color: colors.text, 
        marginBottom: 8 
    },
    inputWrapper: { 
        position: 'relative' 
    },
    input: { 
        backgroundColor: colors.surface, 
        borderWidth: 1, 
        borderColor: colors.border, 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
        color: colors.text 
    },
    inputError: { 
        borderColor: colors.error, 
        borderWidth: 2 
    },
    errorText: { 
        color: colors.error, 
        fontSize: 14, 
        marginTop: 4, 
        marginLeft: 4 
    },
    actionButton: { 
        backgroundColor: colors.primary, 
        borderRadius: 12, 
        paddingVertical: 16, 
        alignItems: 'center', 
        marginBottom: 24, 
        shadowColor: colors.primary, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 8 
    },
    actionButtonDisabled: { 
        backgroundColor: colors.textTertiary, 
        shadowOpacity: 0, 
        elevation: 0 
    },
    actionButtonText: { 
        color: '#FFFFFF', 
        fontSize: 18, 
        fontWeight: '600' 
    },
    signInContainer: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 20 
    },
    signInText: { 
        color: colors.textSecondary, 
        fontSize: 16 
    },
    signInLink: { 
        color: colors.primary, 
        fontSize: 16, 
        fontWeight: '600', 
        marginLeft: 4 
    },
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="key-outline" size={40} color="#FFFFFF" /></View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
          </View>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={[ styles.input, error && styles.inputError ]} placeholder="john.doe@example.com" placeholderTextColor={colors.textTertiary} value={email} onChangeText={handleInputChange} onBlur={handleBlur} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!isLoading}/>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            <TouchableOpacity style={[ styles.actionButton, isLoading && styles.actionButtonDisabled ]} onPress={requestPasswordReset} disabled={isLoading}>
              <Text style={styles.actionButtonText}>{isLoading ? 'Sending...' : 'Send Reset Instructions'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Remember your password?</Text>
            <TouchableOpacity onPress={handleSignInClick} disabled={isLoading}><Text style={styles.signInLink}>Sign In</Text></TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      {isLoading && (<LoadingSpinner message="Sending request..." color={colors.primary} />)}
      <CustomAlert visible={alertVisible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} confirmText="OK"/>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;