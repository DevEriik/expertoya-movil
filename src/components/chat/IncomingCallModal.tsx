import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VideoCallInvitation } from '@/types/chat';

const FONT_SANS_BOLD = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans-Bold',
});
const FONT_SANS_MEDIUM = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans-Medium',
});
const FONT_SANS_REGULAR = Platform.select({
  web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans-Regular',
});

interface IncomingCallModalProps {
  visible: boolean;
  invitation: VideoCallInvitation | null;
  onAccept: (invitation: VideoCallInvitation) => void;
  onReject: (invitation: VideoCallInvitation) => void;
}

const RINGTONE_FALLBACK_URI =
  'https://actions.google.com/sounds/v1/telephones/phone_ring_short.ogg';

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  visible,
  invitation,
  onAccept,
  onReject,
}) => {
  const soundRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
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

  useEffect(() => {
    let isCancelled = false;

    const playRingtone = async () => {
      if (!visible) return;

      try {
        const { createAudioPlayer } = require('expo-audio');
        if (createAudioPlayer) {
          const player = createAudioPlayer({ uri: RINGTONE_FALLBACK_URI });
          player.loop = true;
          player.volume = 1.0;
          soundRef.current = player;
          if (!isCancelled) {
            player.play();
          }
        }
      } catch (err) {
        console.warn('[IncomingCallModal] No se pudo reproducir tono con expo-audio:', err);
      }
    };

    const stopRingtone = () => {
      if (soundRef.current) {
        try {
          soundRef.current.pause();
          soundRef.current.release();
        } catch (_) { }
        soundRef.current = null;
      }
    };

    if (visible) {
      playRingtone();
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 1000, 1000], true);
        } catch (_) { }
      }
    } else {
      stopRingtone();
      if (Platform.OS !== 'web') {
        try {
          Vibration.cancel();
        } catch (_) { }
      }
    }

    return () => {
      isCancelled = true;
      stopRingtone();
      if (Platform.OS !== 'web') {
        try {
          Vibration.cancel();
        } catch (_) { }
      }
    };
  }, [visible]);

  if (!visible || !invitation) return null;

  const { caller } = invitation;
  const isPro = caller.role === 'PROFESIONAL';

  const handleReject = () => {
    try {
      Vibration.cancel();
    } catch (_) { }
    onReject(invitation);
  };

  const handleAccept = () => {
    try {
      Vibration.cancel();
    } catch (_) { }
    onAccept(invitation);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => onReject(invitation)}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.badge}>
            <View style={styles.liveDot} />
            <Text style={styles.badgeText}>Diagnóstico Visual en Vivo</Text>
          </View>

          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            {caller.avatar ? (
              <Image source={{ uri: caller.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons
                  name={isPro ? 'construct' : 'person'}
                  size={42}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>

          <Text style={styles.callerName}>{caller.name || 'Usuario ExpertoYa'}</Text>
          <Text style={styles.callerRole}>
            {isPro ? 'Especialista Técnico Verificado' : 'Cliente Solicitante'}
          </Text>

          <Text style={styles.callHint}>
            Invitación para coordinar y revisar el trabajo por cámara en tiempo real.
          </Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={handleReject}
              activeOpacity={0.8}
              accessible
              accessibilityLabel="Rechazar llamada de diagnóstico"
              accessibilityRole="button"
            >
              <View style={styles.iconCircleRed}>
                <Ionicons name="call" size={26} color="#FFFFFF" style={styles.hangupRotate} />
              </View>
              <Text style={styles.rejectBtnText}>Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              activeOpacity={0.8}
              accessible
              accessibilityLabel="Aceptar videollamada y unirse a la sala"
              accessibilityRole="button"
            >
              <View style={styles.iconCircleTeal}>
                <Ionicons name="videocam" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.acceptBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.4)',
    marginBottom: 24,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BFA5',
    marginRight: 8,
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
    backgroundColor: 'rgba(0, 191, 165, 0.25)',
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
  callerName: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 22,
    fontWeight: '800',
    color: '#FDFCF4',
    textAlign: 'center',
    marginBottom: 4,
  },
  callerRole: {
    fontFamily: FONT_SANS_MEDIUM,
    fontSize: 14,
    color: '#00BFA5',
    fontWeight: '600',
    marginBottom: 12,
  },
  callHint: {
    fontFamily: FONT_SANS_REGULAR,
    fontSize: 12,
    color: 'rgba(253, 252, 244, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 30,
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
  },
  rejectBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#00BFA5',
    shadowColor: '#00BFA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircleTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  hangupRotate: {
    transform: [{ rotate: '135deg' }],
  },
  rejectBtnText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  acceptBtnText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 13,
    fontWeight: '700',
    color: '#121826',
  },
});
