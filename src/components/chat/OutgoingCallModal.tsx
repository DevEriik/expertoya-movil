import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Participant } from '@/types/chat';

interface OutgoingCallModalProps {
  visible: boolean;
  targetUser: Participant | null;
  onCancel: () => void;
}

const FONT_SANS_BOLD = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans-Bold',
});

const FONT_SANS_REGULAR = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans-Regular',
});

export const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({
  visible,
  targetUser,
  onCancel,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
      pulseAnim.setValue(1);
    };
  }, [visible, pulseAnim]);

  if (!visible || !targetUser) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.badge}>
            <ActivityIndicator size="small" color="#00BFA5" style={{ marginRight: 8 }} />
            <Text style={styles.badgeText}>Estableciendo enlace seguro Daily.co...</Text>
          </View>

          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            {targetUser.avatar ? (
              typeof targetUser.avatar === 'string' ? (
                <Image source={{ uri: targetUser.avatar }} style={styles.avatar} />
              ) : (
                <Image source={targetUser.avatar} style={styles.avatar} />
              )
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={42} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.callingTitle}>Llamando a {targetUser.name}...</Text>
          <Text style={styles.subtitle}>
            Esperando que conteste para iniciar el diagnóstico visual por cámara.
          </Text>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            activeOpacity={0.8}
            accessible
            accessibilityLabel="Cancelar llamada saliente"
            accessibilityRole="button"
          >
            <Ionicons name="call" size={24} color="#FFFFFF" style={styles.hangupRotate} />
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 38, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121826',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 191, 165, 0.35)',
    shadowColor: '#00BFA5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 191, 165, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.4)',
    marginBottom: 24,
  },
  badgeText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 12,
    color: '#00BFA5',
    fontWeight: '700',
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 191, 165, 0.2)',
    borderWidth: 2,
    borderColor: '#00BFA5',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#00BFA5',
  },
  avatarPlaceholder: {
    backgroundColor: '#283593',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callingTitle: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 22,
    fontWeight: '800',
    color: '#FDFCF4',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_SANS_REGULAR,
    fontSize: 13,
    color: 'rgba(253, 252, 244, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 32,
    lineHeight: 19,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  hangupRotate: {
    transform: [{ rotate: '135deg' }],
  },
  cancelBtnText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
