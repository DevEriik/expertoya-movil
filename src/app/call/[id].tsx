import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';
import { API_URL } from '@/utils/api';

let DailyMediaView: any = null;
try {
  const dailyModule = require('@daily-co/react-native-daily-js');
  DailyMediaView = dailyModule.DailyMediaView || dailyModule.default?.DailyMediaView;
} catch (e) {
}


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

export default function CallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { usuario, token } = useAuth();
  const socketRef = useRef<any>(null);

  const {
    id: solicitudId,
    roomUrl,
    otherName,
    otherAvatar,
    role = 'cliente',
  } = useLocalSearchParams<{
    id: string;
    roomUrl: string;
    otherName?: string;
    otherAvatar?: string;
    role?: string;
  }>();

  const userRole = (role === 'PROFESIONAL' || role === 'profesional') ? 'profesional' : 'cliente';
  const userName = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Usuario ExpertoYa';

  const decodedRoomUrl = roomUrl ? decodeURIComponent(roomUrl) : '';

  const [callDuration, setCallDuration] = React.useState<number>(0);
  const callDurationRef = useRef(0);
  callDurationRef.current = callDuration;

  const handleOnCallEnd = React.useCallback((reason?: string) => {
    if (socketRef.current?.connected && solicitudId) {
      socketRef.current.emit('call:end', { solicitud_id: solicitudId, duracion: callDurationRef.current });
    }
    setTimeout(() => {
      router.back();
    }, 250);
  }, [solicitudId, router]);

  const {
    callState,
    errorMessage,
    isAudioMuted,
    isVideoMuted,
    networkQuality,
    cameraFacing,
    localParticipant,
    remoteParticipant,
    toggleAudio,
    toggleVideo,
    toggleCameraFacing,
    handleHangUp,
  } = useVideoCall({
    roomUrl: decodedRoomUrl,
    userName,
    userRole,
    chatStatus: 'active',
    onCallEnd: handleOnCallEnd,
  });

  useEffect(() => {
    if (!token || !solicitudId) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_solicitud', { solicitud_id: solicitudId });
    });

    socket.on('call:ended', (data: { solicitud_id: string; motivo?: string }) => {
      if (data.solicitud_id === solicitudId) {
        Alert.alert(
          'Llamada Finalizada',
          data.motivo || 'El diagnóstico visual ha terminado.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, solicitudId, router]);

  useEffect(() => {
    if (callState !== 'connected') {
      return;
    }
    const startTime = Date.now() - callDuration * 1000;
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  const formatCallDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onHangUpPress = async () => {
    if (socketRef.current?.connected && solicitudId) {
      socketRef.current.emit('call:end', { solicitud_id: solicitudId, duracion: callDuration });
    }
    await handleHangUp();
  };

  const remoteVideoTrack =
    remoteParticipant?.tracks?.video?.persistentTrack ||
    remoteParticipant?.tracks?.video?.track ||
    remoteParticipant?.videoTrack ||
    null;

  const remoteAudioTrack =
    remoteParticipant?.tracks?.audio?.persistentTrack ||
    remoteParticipant?.tracks?.audio?.track ||
    remoteParticipant?.audioTrack ||
    null;

  const localVideoTrack =
    localParticipant?.tracks?.video?.persistentTrack ||
    localParticipant?.tracks?.video?.track ||
    localParticipant?.videoTrack ||
    null;

  const isRemoteVideoActive =
    !!remoteVideoTrack &&
    remoteParticipant?.tracks?.video?.state !== 'off' &&
    remoteParticipant?.tracks?.video?.state !== 'blocked';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121826" translucent />

      {/* ÁREA DE VIDEO REMOTO (PANTALLA COMPLETA) */}
      <View style={styles.remoteVideoContainer}>
        {DailyMediaView && isRemoteVideoActive ? (
          <DailyMediaView
            videoTrack={remoteVideoTrack}
            audioTrack={remoteAudioTrack}
            mirror={false}
            zOrder={0}
            objectFit="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.remotePlaceholder}>
            <View style={styles.avatarBorderGlow}>
              {otherAvatar ? (
                <Image source={{ uri: otherAvatar }} style={styles.placeholderAvatar} />
              ) : (
                <View style={[styles.placeholderAvatar, styles.placeholderIconBg]}>
                  <Ionicons name="person" size={54} color="#00BFA5" />
                </View>
              )}
            </View>

            <Text style={styles.remoteNameText}>
              {otherName || (userRole === 'cliente' ? 'Especialista Técnico' : 'Cliente')}
            </Text>

            <Text style={styles.remoteStatusText}>
              {callState === 'joining'
                ? 'Estableciendo enlace seguro WebRTC...'
                : callState === 'connected' && !remoteParticipant
                  ? 'Conectado a la sala.\nEsperando al interlocutor...'
                  : 'Diagnóstico preliminar visual en vivo.\nUsa tu cámara para mostrar el desperfecto.'}
            </Text>

            {(callState === 'joining' || (callState === 'connected' && !remoteParticipant)) && (
              <ActivityIndicator size="large" color="#00BFA5" style={{ marginTop: 20 }} />
            )}
          </View>
        )}
      </View>

      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.pulseDot,
              callState === 'joining' ? styles.pulseDotJoining : styles.pulseDotActive,
            ]}
          />
          <View>
            <Text style={styles.headerTitle}>ExpertoYa — Diagnóstico</Text>
            <Text style={styles.headerSubtitle}>Canal P2P/SFU Cifrado</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {callState === 'connected' && (
            <View style={styles.timerPill}>
              <View style={styles.timerDot} />
              <Text style={styles.timerText}>{formatCallDuration(callDuration)}</Text>
            </View>
          )}

          <View style={styles.qualityPill}>
            <Text style={styles.qualityLabel}>Señal:</Text>
            <Text
              style={[
                styles.qualityValue,
                networkQuality === 'good' ? styles.qualityGood : styles.qualityLow,
              ]}
            >
              {networkQuality === 'good' ? 'Óptima' : 'Inestable'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeHeaderBtn}
            onPress={onHangUpPress}
            accessible
            accessibilityLabel="Cerrar videollamada"
          >
            <Ionicons name="close" size={22} color="#FDFCF4" />
          </TouchableOpacity>
        </View>
      </View>

      {errorMessage && (
        <View
          style={[
            styles.errorBanner,
            { top: Math.max(insets.top, 16) + 65 },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color="#FF8C00" style={{ marginRight: 8 }} />
          <Text style={styles.errorText} numberOfLines={3}>
            {errorMessage}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.localPipContainer,
          { bottom: Math.max(insets.bottom, 16) + 95 },
        ]}
      >
        {DailyMediaView && localVideoTrack && !isVideoMuted ? (
          <DailyMediaView
            videoTrack={localVideoTrack}
            audioTrack={null}
            mirror={cameraFacing === 'user'}
            zOrder={1}
            objectFit="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.localOffContainer}>
            <Ionicons
              name={isVideoMuted ? 'videocam-off' : 'videocam'}
              size={24}
              color="#94A3B8"
            />
            <Text style={styles.localOffText}>
              {isVideoMuted
                ? 'Cámara Off'
                : callState === 'joining'
                  ? 'Iniciando...'
                  : 'Sin Video'}
            </Text>
          </View>
        )}

        {/* Badge "Tú" */}
        <View style={styles.localBadge}>
          <Text style={styles.localBadgeText}>Tú ({userRole})</Text>
        </View>
      </View>

      {/* BARRA INFERIOR DE CONTROLES MULTIMEDIA */}
      <View
        style={[
          styles.bottomBarContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <View style={styles.controlsRow}>
          {/* Botón Silenciar Micrófono */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              isAudioMuted ? styles.btnActiveMuted : styles.btnNormal,
            ]}
            onPress={toggleAudio}
            activeOpacity={0.8}
            accessible
            accessibilityLabel={isAudioMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isAudioMuted ? 'mic-off' : 'mic'}
              size={24}
              color={isAudioMuted ? '#EF4444' : '#121826'}
            />
            <Text style={[styles.controlBtnText, isAudioMuted && styles.textMuted]}>
              {isAudioMuted ? 'Muteado' : 'Silenciar'}
            </Text>
          </TouchableOpacity>

          {/* Botón Apagar/Encender Cámara */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              isVideoMuted ? styles.btnActiveMuted : styles.btnNormal,
            ]}
            onPress={toggleVideo}
            activeOpacity={0.8}
            accessible
            accessibilityLabel={isVideoMuted ? 'Encender cámara' : 'Apagar cámara'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isVideoMuted ? 'videocam-off' : 'videocam'}
              size={24}
              color={isVideoMuted ? '#EF4444' : '#121826'}
            />
            <Text style={[styles.controlBtnText, isVideoMuted && styles.textMuted]}>
              {isVideoMuted ? 'Cámara Off' : 'Cámara On'}
            </Text>
          </TouchableOpacity>

          {/* Botón Voltear Cámara (Frontal / Trasera) */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.btnFlip]}
            onPress={toggleCameraFacing}
            activeOpacity={0.8}
            accessible
            accessibilityLabel="Cambiar entre cámara frontal y trasera"
            accessibilityRole="button"
          >
            <Ionicons name="camera-reverse" size={24} color="#00BFA5" />
            <Text style={styles.textFlip}>
              {cameraFacing === 'user' ? 'Trasera' : 'Frontal'}
            </Text>
          </TouchableOpacity>

          {/* Botón Colgar / Finalizar */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.btnHangUp]}
            onPress={onHangUpPress}
            activeOpacity={0.8}
            accessible
            accessibilityLabel="Cortar videollamada y salir"
            accessibilityRole="button"
          >
            <Ionicons name="call" size={24} color="#FFFFFF" style={styles.hangupRotate} />
            <Text style={styles.textHangUp}>Cortar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121826',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  remoteVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121826',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(18, 24, 38, 0.85)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  pulseDotActive: {
    backgroundColor: '#00BFA5',
  },
  pulseDotJoining: {
    backgroundColor: '#FF8C00',
  },
  headerTitle: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 15,
    fontWeight: '700',
    color: '#FDFCF4',
  },
  headerSubtitle: {
    fontFamily: FONT_SANS_REGULAR,
    fontSize: 11,
    color: 'rgba(253, 252, 244, 0.7)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 191, 165, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.4)',
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00BFA5',
    marginRight: 6,
  },
  timerText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 12,
    fontWeight: '700',
    color: '#00BFA5',
    letterSpacing: 0.5,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qualityLabel: {
    fontFamily: FONT_SANS_REGULAR,
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 4,
  },
  qualityValue: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  qualityGood: {
    color: '#00BFA5',
  },
  qualityLow: {
    color: '#FF8C00',
  },
  closeHeaderBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
  },
  errorBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 60,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 0, 0.25)',
    borderColor: '#FF8C00',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
  },
  errorText: {
    fontFamily: FONT_SANS_MEDIUM,
    fontSize: 12,
    color: '#FFB74D',
    flex: 1,
  },
  remotePlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#121826',
  },
  avatarBorderGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 191, 165, 0.15)',
    borderWidth: 2,
    borderColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  placeholderIconBg: {
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteNameText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 20,
    fontWeight: '800',
    color: '#FDFCF4',
    textAlign: 'center',
    marginBottom: 8,
  },
  remoteStatusText: {
    fontFamily: FONT_SANS_REGULAR,
    fontSize: 13,
    color: 'rgba(253, 252, 244, 0.65)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  localPipContainer: {
    position: 'absolute',
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00BFA5',
    backgroundColor: '#1F2937',
    zIndex: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  localOffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  localOffText: {
    fontFamily: FONT_SANS_MEDIUM,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  localBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  localBadgeText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: 'rgba(18, 24, 38, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    minWidth: 72,
  },
  btnNormal: {
    backgroundColor: '#FF8C00',
  },
  btnActiveMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  btnFlip: {
    backgroundColor: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#00BFA5',
  },
  btnHangUp: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  controlBtnText: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 10,
    fontWeight: '700',
    color: '#121826',
    marginTop: 4,
  },
  textMuted: {
    color: '#EF4444',
  },
  textFlip: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 10,
    fontWeight: '700',
    color: '#00BFA5',
    marginTop: 4,
  },
  textHangUp: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  hangupRotate: {
    transform: [{ rotate: '135deg' }],
  },
});

