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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemes } from '@/hooks/themes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { API_URL } from '@/constants/api';

const ResetPassword = () => {
  const { colors } = useThemes();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  // Form state
  const [token, setToken] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
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

  // Validation state
  const [errors, setErrors] = useState({ token: '', newPassword: '', confirmPassword: '' });

  // Animation and Refs
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
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
      
      if (alphanumericText && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'token':
        if (value.length < 6) return 'Please enter the complete 6-character code';
        return '';
      case 'newPassword':
        if (!value.trim()) return 'New password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your new password';
        if (value !== formData.newPassword) return 'Passwords do not match';
        return '';
      default:
        return '';
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
    if (!validateForm()) {
      shakeAnimation();
      return;
    }
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
        body: JSON.stringify({
          email: email,
          token: token.join(''),
          new_password: formData.newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password. The code may be invalid or expired.');
      }

      setAlertConfig({ type: 'success', title: 'Success!', message: 'Your password has been reset successfully.' });
      setAlertVisible(true);
      setTimeout(() => {
        setAlertVisible(false);
        router.replace('/login');
      }, 2000);

    } catch (err: any) {
      setAlertConfig({ type: 'error', title: 'Reset Failed', message: err.message });
      setAlertVisible(true);
      shakeAnimation();
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    scrollContainer: { 
      flexGrow: 1, 
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
    formContainer: { marginBottom: 32 },
    inputContainer: { marginBottom: 20 },
    inputLabel: { 
      fontSize: 16, 
      fontWeight: '600', 
      color: colors.text, 
      marginBottom: 8 
    },
    inputWrapper: { position: 'relative' },
    input: { 
      backgroundColor: colors.surface, 
      borderWidth: 1, 
      borderColor: colors.border, 
      borderRadius: 12, 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      fontSize: 16, 
      color: colors.text, 
      paddingRight: 50 
    },
    inputError: { 
      borderColor: colors.error, 
      borderWidth: 2 
    },
    passwordToggle: { 
      position: 'absolute', 
      right: 16, 
      top: 14, 
      padding: 4 
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
      alignItems: 'center' 
    },
    actionButtonDisabled: { backgroundColor: colors.textTertiary },
    actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
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
    codeInputError: {
      borderColor: colors.error,
    },
    tokenErrorText: {
      color: colors.error,
      fontSize: 14,
      marginTop: 4,
      marginLeft: 4,
      textAlign: 'center',
    }
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}><Ionicons name="lock-open-outline" size={40} color="#FFFFFF" /></View>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>Enter the code from your email and create a new password.</Text>
          </View>

          <View style={styles.formContainer}>
            {/* --- NEW: Individual Code Input Section --- */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reset Code</Text>
              <View style={styles.codeContainer}>
                {token.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[ styles.codeInput, errors.token && styles.codeInputError ]}
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
            {/* --- END OF NEW SECTION --- */}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={[styles.input, errors.newPassword && styles.inputError]} placeholder="Enter your new password" placeholderTextColor={colors.textTertiary} value={formData.newPassword} onChangeText={(text) => handleInputChange('newPassword', text)} secureTextEntry={!showPassword} editable={!isLoading}/>
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textSecondary}/></TouchableOpacity>
              </View>
              {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={[styles.input, errors.confirmPassword && styles.inputError]} placeholder="Confirm your new password" placeholderTextColor={colors.textTertiary} value={formData.confirmPassword} onChangeText={(text) => handleInputChange('confirmPassword', text)} secureTextEntry={!showConfirmPassword} editable={!isLoading}/>
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirmPassword(!showConfirmPassword)}><Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={colors.textSecondary}/></TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            <TouchableOpacity style={[styles.actionButton, isLoading && styles.actionButtonDisabled]} onPress={handleResetPassword} disabled={isLoading}>
              <Text style={styles.actionButtonText}>{isLoading ? 'Resetting...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      {isLoading && (<LoadingSpinner message="Resetting password..." color={colors.primary} />)}
      <CustomAlert visible={alertVisible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} confirmText="OK"/>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;