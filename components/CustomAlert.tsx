import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemes, AppColors } from '@/hooks/themes';

const { width: screenWidth } = Dimensions.get('window');

// ─── Props ────────────────────────────────────────────────────────────────────
interface CustomAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

// ─── Per-type palette (derived from theme colors) ─────────────────────────────
const getTypePalette = (colors: AppColors) => ({
  success: {
    icon: 'checkmark-circle' as const,
    fg:      colors.success,
    bg:      `${colors.success}1A`,
    border:  `${colors.success}4D`,
    btnBg:   colors.success,
    btnText: '#0F2015',
  },
  error: {
    icon: 'close-circle' as const,
    fg:      colors.error,
    bg:      `${colors.error}1A`,
    border:  `${colors.error}4D`,
    btnBg:   colors.error,
    btnText: '#FFFFFF',
  },
  warning: {
    icon: 'warning' as const,
    fg:      colors.warning,
    bg:      `${colors.warning}1A`,
    border:  `${colors.warning}4D`,
    btnBg:   colors.warning,
    btnText: '#2A1A00',
  },
  info: {
    icon: 'information-circle' as const,
    fg:      '#60A5FA',
    bg:      'rgba(96,165,250,0.10)',
    border:  'rgba(96,165,250,0.30)',
    btnBg:   '#60A5FA',
    btnText: '#FFFFFF',
  },
});

// ─── Component ────────────────────────────────────────────────────────────────
const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const { colors } = useThemes();
  const styles = makeStyles(colors);
  const typePalette = getTypePalette(colors);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const palette = typePalette[type] ?? typePalette.info;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} testID="custom-alert">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>

              {/* Gold top accent */}
              <View style={styles.topAccentLine} />

              {/* Icon ring */}
              <View style={[styles.iconRingOuter, { borderColor: palette.border }]}>
                <View style={[styles.iconRingInner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                  <Ionicons name={palette.icon} size={30} color={palette.fg} />
                </View>
              </View>

              {/* Text */}
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {showCancel && (
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: palette.btnBg },
                    !showCancel && styles.fullWidthButton,
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.confirmButtonText, { color: palette.btnText }]}>{confirmText}</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: screenWidth - 48,
    maxWidth: 340,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  topAccentLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  iconRingOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 6,
  },
  iconRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    color: colors.textSecondary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.divider,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 16,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  fullWidthButton: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default CustomAlert;