import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform, PermissionsAndroid } from 'react-native';

let Daily: any = null;
try {
  Daily = require('@daily-co/react-native-daily-js').default || require('@daily-co/react-native-daily-js');
} catch (e) {
  console.warn('[useVideoCall] @daily-co/react-native-daily-js no está instalado o no se encuentra en Expo Go.');
}

export type NetworkQuality = 'good' | 'low';
export type CallState = 'joining' | 'connected' | 'error' | 'disconnected';

interface UseVideoCallParams {
  roomUrl: string;
  token?: string | null;
  userName?: string;
  userRole?: 'cliente' | 'profesional';
  chatStatus?: string;
  onCallEnd?: (reason?: string) => void;
}

export function useVideoCall({
  roomUrl,
  token,
  userName = 'Usuario ExpertoYa',
  userRole = 'cliente',
  chatStatus = 'active',
  onCallEnd,
}: UseVideoCallParams) {
  const [callState, setCallState] = useState<CallState>('joining');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  const [localParticipant, setLocalParticipant] = useState<any>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<any>(null);

  const callObjectRef = useRef<any>(null);
  const disconnectTimerRef = useRef<any>(null);
  const isHangingUpRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const isChatActive = chatStatus === 'active';

  /**
   * Limpieza exhaustiva de la llamada y liberación de recursos de hardware
   */
  const cleanupCall = useCallback(async () => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }

    const callInstance = callObjectRef.current || (Daily && typeof Daily.getCallInstance === 'function' ? Daily.getCallInstance() : null);

    if (callInstance) {
      try {
        if (typeof callInstance.leave === 'function') {
          await callInstance.leave();
        }
        if (typeof callInstance.destroy === 'function') {
          await callInstance.destroy();
        }
      } catch (e) {
        console.warn('[useVideoCall] Error al liberar instancia Daily:', e);
      }
      callObjectRef.current = null;
    }

    setLocalParticipant(null);
    setRemoteParticipant(null);
    setCallState('disconnected');
  }, []);

  /**
   * Actualiza el estado local de los participantes a partir del callObject
   */
  const syncParticipants = useCallback((call: any) => {
    if (!call || typeof call.participants !== 'function') return;

    try {
      const participants = call.participants();
      if (!participants) return;

      if (participants.local) {
        setLocalParticipant(participants.local);
      }

      const remotes = Object.values(participants).filter((p: any) => !p.local);
      if (remotes.length > 0) {
        setRemoteParticipant(remotes[0]);
      } else {
        setRemoteParticipant(null);
      }
    } catch (err) {
      console.warn('[useVideoCall] Error al sincronizar participantes:', err);
    }
  }, []);

  /**
   * Conmutar micrófono (Mute / Unmute)
   */
  const toggleAudio = useCallback(() => {
    const next = !isAudioMuted;
    const call = callObjectRef.current;
    if (call && typeof call.setLocalAudio === 'function') {
      try {
        call.setLocalAudio(!next);
      } catch (err) {
        console.warn('[useVideoCall] Error toggling audio:', err);
      }
    }
    setIsAudioMuted(next);
  }, [isAudioMuted]);

  /**
   * Conmutar cámara (Activar / Pausar video)
   */
  const toggleVideo = useCallback(() => {
    const next = !isVideoMuted;
    const call = callObjectRef.current;
    if (call && typeof call.setLocalVideo === 'function') {
      try {
        call.setLocalVideo(!next);
      } catch (err) {
        console.warn('[useVideoCall] Error toggling video:', err);
      }
    }
    setIsVideoMuted(next);
  }, [isVideoMuted]);

  /**
   * Alternar entre cámara frontal y trasera usando cycleCamera() de react-native-daily-js
   */
  const toggleCameraFacing = useCallback(async () => {
    const call = callObjectRef.current;
    const targetFacing = cameraFacing === 'user' ? 'environment' : 'user';

    if (call && typeof call.cycleCamera === 'function') {
      try {
        await call.cycleCamera();
        setCameraFacing(targetFacing);
      } catch (err) {
        console.warn('[useVideoCall] Error al ciclar cámara con cycleCamera():', err);
      }
    } else {
      setCameraFacing(targetFacing);
    }
  }, [cameraFacing]);

  /**
   * Cortar llamada activamente
   */
  const handleHangUp = useCallback(async () => {
    isHangingUpRef.current = true;
    await cleanupCall();
    if (onCallEnd) {
      onCallEnd('Llamada finalizada por el usuario');
    }
  }, [cleanupCall, onCallEnd]);

  useEffect(() => {
    if (!isChatActive) return;

    if (!roomUrl) {
      setErrorMessage('URL de sala no proporcionada.');
      setCallState('error');
      return;
    }

    if (Platform.OS === 'android') {
      try {
        PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]).then((statuses) => {
          console.log('[useVideoCall] Permisos Android cámara y mic:', statuses);
        }).catch((pErr) => {
          console.warn('[useVideoCall] Error al solicitar permisos Android:', pErr);
        });
      } catch (err) {
        console.warn('[useVideoCall] Error ejecutando PermissionsAndroid:', err);
      }
    }

    if (!Daily) {
      console.warn('[useVideoCall] Ejecutando sin @daily-co/react-native-daily-js nativo. Se requiere Expo Dev Client.');
      setCallState('connected');
      return;
    }

    let call = typeof Daily.getCallInstance === 'function' ? Daily.getCallInstance() : null;

    if (!call) {
      try {
        call = Daily.createCallObject({
          dailyConfig: {
            useDevicePreferenceStorage: false,
          },
        });
      } catch (createErr) {
        console.warn('[useVideoCall] Daily call object ya instanciado:', createErr);
        call = Daily.getCallInstance();
      }
    }

    callObjectRef.current = call;

    if (call) {
      // Evento: Unido a la sala
      call.on('joined-meeting', () => {
        setCallState('connected');
        setErrorMessage(null);
        syncParticipants(call);
      });

      // Evento: Participante remoto se une
      call.on('participant-joined', (evt: any) => {
        setRemoteParticipant(evt.participant);
        syncParticipants(call);
      });

      // Evento: Actualización de tracks o estado de participantes
      call.on('participant-updated', (evt: any) => {
        syncParticipants(call);
      });

      // Evento: Track de video o audio iniciado
      call.on('track-started', () => {
        syncParticipants(call);
      });

      // Evento: Track detenido
      call.on('track-stopped', () => {
        syncParticipants(call);
      });

      // Evento: Participante remoto sale
      call.on('participant-left', (evt: any) => {
        setRemoteParticipant(null);
        syncParticipants(call);
      });

      // Evento: Estado de la conexión de red
      call.on('network-connection', (evt: any) => {
        if (evt?.event === 'interrupted') {
          setNetworkQuality('low');
          if (!disconnectTimerRef.current) {
            disconnectTimerRef.current = setTimeout(() => {
              console.warn('[useVideoCall] Corte por señal interrumpida prolongada');
              handleHangUp();
            }, 15000);
          }
        } else {
          setNetworkQuality('good');
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
          }
        }
      });

      // Evento: Salida de la reunión
      call.on('left-meeting', () => {
        if (isHangingUpRef.current) {
          cleanupCall();
          if (onCallEnd) onCallEnd('left-meeting');
        }
      });

      // Evento: Error fatal en WebRTC o cámara
      call.on('error', (evt: any) => {
        console.error('[useVideoCall] Error en Daily:', evt);
        const rawMsg = evt?.errorMsg || evt?.error?.msg || '';
        let msg = 'Error de conexión multimedia.';
        if (rawMsg.includes('payment-method') || evt?.errorMsg === 'account-missing-payment-method') {
          msg = 'Daily.co requiere registrar una tarjeta en dashboard.daily.co/billing para activar la cuenta (10.000 min/mes gratis).';
        } else if (evt?.error?.type === 'no-room' || rawMsg.includes('does not exist')) {
          msg = 'La sala Daily.co no existe o expiró.';
        } else if (rawMsg) {
          msg = rawMsg;
        }
        setErrorMessage(msg);
        setCallState('error');
        return;
      });

      const joinOptions: any = {
        url: roomUrl,
        userName: userName || 'Usuario ExpertoYa',
      };

      call.join(joinOptions).catch((err: any) => {
        console.warn('[useVideoCall] Error al unirse a la sala:', err);
        setErrorMessage('No se pudo establecer conexión con la sala de diagnóstico.');
        setCallState('error');
      });
    }

    return () => {
      cleanupCall();
    };
  }, [roomUrl, token, userName, isChatActive, cleanupCall, syncParticipants, handleHangUp, onCallEnd]);

  const backgroundTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (Platform.OS === 'web') return;

      if (nextAppState === 'active') {
        if (backgroundTimerRef.current) {
          clearTimeout(backgroundTimerRef.current);
          backgroundTimerRef.current = null;
          console.log('[useVideoCall] App volvió a primer plano, cancelando corte.');
        }
      } else if (
        appStateRef.current === 'active' &&
        nextAppState === 'background' &&
        !isHangingUpRef.current
      ) {
        console.log('[useVideoCall] App en background -> Iniciando temporizador de corte (10s)');
        if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
        backgroundTimerRef.current = setTimeout(() => {
          console.log('[useVideoCall] Tiempo en background excedido -> Ejecutando teardown automático');
          handleHangUp();
        }, 10000);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
      subscription.remove();
    };
  }, [handleHangUp]);

  return {
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
    callObject: callObjectRef.current,
  };
}

