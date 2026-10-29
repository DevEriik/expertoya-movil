import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useAuth } from '@/context/AuthContext';
import { useChatSocket } from '@/hooks/useChatSocket';
import { apiClient } from '@/utils/api';
import { renderPortal } from '@/utils/portal';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import {
  isPropuestaVisita,
  parsePropuestaVisita,
  formatPropuestaVisita,
  isAudioAttachment,
  buildGoogleCalendarUrl,
  type PropuestaVisitaData,
  type ChatSession,
  type UserRole,
} from '../../types/chat';
import { analizarSeguridadMensaje } from '../../utils/security';

const TypingDots = ({ color = '#FF8C00' }: { color?: string }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (val: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: -4,
              duration: 250,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(val, {
              toValue: 0,
              duration: 250,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.delay(250),
          ])
        ),
      ]);

    const anim1 = createAnim(dot1, 0);
    const anim2 = createAnim(dot2, 120);
    const anim3 = createAnim(dot3, 240);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingDotsContainer}>
      <Animated.View
        style={[styles.typingDot, { backgroundColor: color, transform: [{ translateY: dot1 }] }]}
      />
      <Animated.View
        style={[styles.typingDot, { backgroundColor: color, transform: [{ translateY: dot2 }] }]}
      />
      <Animated.View
        style={[styles.typingDot, { backgroundColor: color, transform: [{ translateY: dot3 }] }]}
      />
    </View>
  );
};

interface Props {
  chat: ChatSession;
  activeRole: UserRole;
  colors: any;
  isDark?: boolean;
  onBack: () => void;
  onSendMessage: (chatId: string, text: string) => void;
  onReleaseFunds: (chatId: string) => void;
}

const getDefaultSuggestions = (role: UserRole) =>
  role === 'CLIENTE'
    ? [
      '¿A qué hora podrías pasar a revisar?',
      '¿Qué repuestos o materiales necesitarías?',
      '¡Genial, te espero entonces! Muchas gracias.',
    ]
    : [
      '¡Genial, la espero entonces!',
      'Estoy en camino al domicilio 🚗',
      'Llego en aproximadamente 15 minutos.',
    ];

export const ActiveConversation: React.FC<Props> = ({
  chat,
  activeRole,
  colors,
  isDark = false,
  onBack,
  onSendMessage,
  onReleaseFunds,
}) => {
  const [inputText, setInputText] = useState('');
  const [sugerencias, setSugerencias] = useState<string[]>(() =>
    getDefaultSuggestions(activeRole)
  );
  const [cargandoSugerencias, setCargandoSugerencias] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [mostrarModalSeguridad, setMostrarModalSeguridad] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const { voiceDictation, scaleFont } = useAccessibility();
  const { usuario, token } = useAuth();

  const otherPerson =
    activeRole === 'CLIENTE' ? chat.professional : chat.client;
  const currentPerson =
    activeRole === 'CLIENTE' ? chat.client : chat.professional;

  const currentUserId = usuario?.id || currentPerson.id;

  const {
    mensajes: socketMensajes,
    cargando: cargandoSocket,
    bloqueado: socketBloqueado,
    estadoSolicitud,
    subiendoFoto,
    otroUsuarioEscribiendo,
    notificarEscribiendo,
    notificarDetuvoEscribiendo,
    enviarMensaje: enviarMensajeSocket,
    seleccionarYSubirFoto,
    subirNotaAudio,
    responderPropuesta,
  } = useChatSocket({
    solicitudId: chat.id,
    userId: currentUserId,
    token,
  });

  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const timerGrabacionRef = useRef<any>(null);
  const webMediaRecorderRef = useRef<any>(null);
  const webAudioChunksRef = useRef<any[]>([]);
  const nativeRecorderRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
      if (webMediaRecorderRef.current && webMediaRecorderRef.current.state !== 'inactive') {
        webMediaRecorderRef.current.stream?.getTracks?.().forEach((t: any) => t.stop());
      }
    };
  }, []);

  const iniciarGrabacionAudio = async () => {
    if (estaBloqueado) {
      Alert.alert('Chat Cerrado', 'No se pueden enviar mensajes de voz en este estado.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          Alert.alert('No soportado', 'Tu navegador no soporta captura de audio directa.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new (window as any).MediaRecorder(stream);
        webMediaRecorderRef.current = mediaRecorder;
        webAudioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            webAudioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start();
        setGrabandoAudio(true);
        setSegundosGrabacion(0);
        timerGrabacionRef.current = setInterval(() => {
          setSegundosGrabacion((prev) => prev + 1);
        }, 1000);
      } else {
        const { AudioModule, requestRecordingPermissionsAsync } = require('expo-audio');
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permiso requerido', 'Se requiere acceso al micrófono para grabar notas de voz.');
          return;
        }

        const recorder = new AudioModule.AudioRecorder({
          extension: '.m4a',
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        nativeRecorderRef.current = recorder;

        setGrabandoAudio(true);
        setSegundosGrabacion(0);
        timerGrabacionRef.current = setInterval(() => {
          setSegundosGrabacion((prev) => prev + 1);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error al iniciar grabación de audio:', err);
      Alert.alert('Micrófono', err?.message || 'No se pudo acceder al micrófono.');
      setGrabandoAudio(false);
      if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
    }
  };

  const detenerYEnviarAudio = async () => {
    if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
    const duracionFinal = segundosGrabacion;
    setGrabandoAudio(false);
    setSegundosGrabacion(0);

    try {
      if (Platform.OS === 'web') {
        const recorder = webMediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') return;

        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(webAudioChunksRef.current, { type: mimeType });
          subirNotaAudio(audioBlob, duracionFinal);

          recorder.stream?.getTracks?.().forEach((track: any) => track.stop());
          webMediaRecorderRef.current = null;
          webAudioChunksRef.current = [];
        };

        recorder.stop();
      } else {
        const recorder = nativeRecorderRef.current;
        if (!recorder) return;
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          await subirNotaAudio(uri, duracionFinal);
        }
        nativeRecorderRef.current = null;
      }
    } catch (err: any) {
      console.error('Error al detener y enviar audio:', err);
      Alert.alert('Error', 'No se pudo procesar la nota de voz.');
    }
  };

  const cancelarGrabacionAudio = () => {
    if (timerGrabacionRef.current) clearInterval(timerGrabacionRef.current);
    if (Platform.OS === 'web') {
      if (webMediaRecorderRef.current) {
        webMediaRecorderRef.current.onstop = null;
        if (webMediaRecorderRef.current.state !== 'inactive') {
          webMediaRecorderRef.current.stop();
        }
        webMediaRecorderRef.current.stream?.getTracks?.().forEach((track: any) => track.stop());
        webMediaRecorderRef.current = null;
      }
      webAudioChunksRef.current = [];
    } else {
      if (nativeRecorderRef.current) {
        try {
          nativeRecorderRef.current.stop();
        } catch (_) { }
        nativeRecorderRef.current = null;
      }
    }
    setGrabandoAudio(false);
    setSegundosGrabacion(0);
  };

  const estaBloqueado =
    socketBloqueado ||
    estadoSolicitud === 'FINALIZADO' ||
    estadoSolicitud === 'DISPUTA' ||
    chat.status === 'COMPLETADO';

  const [variacion, setVariacion] = useState(0);

  const cargarSugerencias = useCallback(async (vOffset?: number) => {
    if (!chat.id || estaBloqueado) return;
    try {
      setCargandoSugerencias(true);
      const v = typeof vOffset === 'number' ? vOffset : variacion;
      const res = await apiClient(`/api/chat/${chat.id}/sugerencias-ia?variacion=${v}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.sugerencias) && data.sugerencias.length > 0) {
          setSugerencias(data.sugerencias);
        }
      }
    } catch (err: any) {
      console.warn('Error al cargar sugerencias en móvil:', err?.message);
    } finally {
      setCargandoSugerencias(false);
    }
  }, [chat.id, estaBloqueado, variacion]);

  useEffect(() => {
    cargarSugerencias();
  }, [cargarSugerencias, socketMensajes.length]);

  const handleRefreshSuggestions = () => {
    const nextVar = variacion + 1;
    setVariacion(nextVar);
    cargarSugerencias(nextVar);
  };

  const [mostrarModalPropuesta, setMostrarModalPropuesta] = useState(false);
  const [formPropuesta, setFormPropuesta] = useState<{
    fecha: string;
    hora: string;
    presupuesto: string;
    materiales: string;
    nota: string;
  }>({
    fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora: '14:00 a 16:00 hs',
    presupuesto: chat.escrowAmount || '',
    materiales: '',
    nota: '',
  });

  const handleEnviarPropuesta = () => {
    if (!formPropuesta.fecha || !formPropuesta.hora) {
      Alert.alert('Datos requeridos', 'Por favor ingresa la fecha y el horario estimado.');
      return;
    }
    const payload = formatPropuestaVisita({
      fecha: formPropuesta.fecha,
      hora: formPropuesta.hora,
      presupuesto: formPropuesta.presupuesto.trim() || undefined,
      materiales: formPropuesta.materiales.trim() || undefined,
      nota: formPropuesta.nota.trim() || undefined,
      estado: 'PENDIENTE',
    });
    enviarMensajeSocket(payload);
    setMostrarModalPropuesta(false);
    setFormPropuesta({
      fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      hora: '14:00 a 16:00 hs',
      presupuesto: chat.escrowAmount || '',
      materiales: '',
      nota: '',
    });
  };

  const handleConfirmarVisita = async (mensajeId: string, propuesta: PropuestaVisitaData) => {
    const confirmText = `✅ ¡Visita técnica confirmada! Acordamos para el ${propuesta.fecha} (${propuesta.hora}). Presupuesto acordado: ${propuesta.presupuesto || 'A convenir'}.`;
    await responderPropuesta(mensajeId, 'ACEPTADA', confirmText);
    Alert.alert(
      '¡Visita Confirmada!',
      `La visita técnica fue confirmada para el ${propuesta.fecha} (${propuesta.hora}). ¿Deseas agregar el recordatorio a tu Google Calendar?`,
      [
        { text: 'Más tarde', style: 'cancel' },
        {
          text: '📅 Agregar a Calendar',
          onPress: () => handleAgregarGoogleCalendar(propuesta),
        },
      ]
    );
  };

  const handleAgregarGoogleCalendar = (propuesta: PropuestaVisitaData) => {
    const url = buildGoogleCalendarUrl(
      propuesta,
      otherPerson.name,
      otherPerson.profession
    );
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      Linking.openURL(url).catch((err) => {
        console.warn('Error al abrir Google Calendar:', err);
        Alert.alert('Error', 'No se pudo abrir Google Calendar.');
      });
    }
  };

  const handlePedirReprogramacion = async (mensajeId: string, propuesta: PropuestaVisitaData) => {
    const reprogramText = `🔄 Hola, he visto la propuesta para el ${propuesta.fecha} (${propuesta.hora}), pero necesitaría coordinar otro horario si es posible.`;
    await responderPropuesta(mensajeId, 'REPROGRAMAR', reprogramText);
  };

  const avatarSource =
    typeof otherPerson.avatar === 'string' && otherPerson.avatar.trim() !== ''
      ? { uri: otherPerson.avatar }
      : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          otherPerson.name || 'Usuario'
        )}&background=283593&color=fff`,
      };

  const listaMensajes =
    socketMensajes.length > 0
      ? socketMensajes.map((sm) => ({
        id: sm.id,
        senderId: sm.remitente_id,
        text: sm.contenido,
        adjunto_url: sm.adjunto_url,
        timestamp: new Date(sm.enviado_en).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        leido: sm.leido,
        status: sm.status,
      }))
      : (chat.messages || []);

  const handleSend = () => {
    if (!inputText.trim() || estaBloqueado) return;

    notificarDetuvoEscribiendo();

    const riesgo = analizarSeguridadMensaje(inputText);
    if (riesgo.esRiesgoso) {
      Alert.alert(
        `⚠️ ${riesgo.titulo}`,
        `${riesgo.mensaje}\n\n${riesgo.consejo}\n\n¿Deseas enviar el mensaje de todos modos? Recuerda que los acuerdos y pagos fuera de ExpertoYa pierden la Garantía de Pago Protegido (Escrow).`,
        [
          { text: 'Modificar Mensaje', style: 'cancel' },
          {
            text: 'Enviar de todos modos',
            style: 'destructive',
            onPress: () => ejecutarEnvio(inputText.trim()),
          },
        ]
      );
      return;
    }

    ejecutarEnvio(inputText.trim());
  };

  const ejecutarEnvio = (texto: string) => {
    if (token && usuario) {
      enviarMensajeSocket(texto);
    } else {
      onSendMessage(chat.id, texto);
    }

    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    if (otroUsuarioEscribiendo) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [otroUsuarioEscribiendo]);

  const handleCameraPress = () => {
    if (estaBloqueado) {
      Alert.alert(
        'Chat Cerrado',
        'No se pueden enviar fotografías en un trabajo finalizado o en disputa.'
      );
      return;
    }

    if (token && usuario) {
      seleccionarYSubirFoto();
    } else {
      Alert.alert('Cámara', 'Seleccionar foto del trabajo realizado para adjuntar.');
    }
  };

  const handleReleasePress = () => {
    Alert.alert(
      'Liberar Fondos en Custodia',
      `¿Deseas confirmar la liberación de ${chat.escrowAmount} a ${otherPerson.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar y Liberar',
          style: 'default',
          onPress: () => onReleaseFunds(chat.id),
        },
      ]
    );
  };

  const renderStatusTicks = (msg: any, isCurrentUser: boolean) => {
    if (!isCurrentUser) return null;

    if (msg.leido || msg.status === 'LEIDO') {
      return (
        <Ionicons
          name="checkmark-done"
          size={15}
          color="#FFFFFF"
          style={styles.tickIcon}
        />
      );
    }
    if (msg.status === 'ENTREGADO') {
      return (
        <Ionicons
          name="checkmark-done"
          size={15}
          color="#FDE047"
          style={styles.tickIcon}
        />
      );
    }
    if (msg.status === 'ENVIADO') {
      return (
        <Ionicons
          name="checkmark"
          size={15}
          color="#FDE047"
          style={styles.tickIcon}
        />
      );
    }
    if (msg.status === 'ENVIANDO') {
      return (
        <Ionicons
          name="time-outline"
          size={13}
          color="#CBD5E1"
          style={styles.tickIcon}
        />
      );
    }

    return (
      <Ionicons
        name="checkmark-done"
        size={15}
        color="#FFFFFF"
        style={styles.tickIcon}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.backgroundElement,
            borderBottomColor: isDark ? '#374151' : '#F1F5F9',
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessible={true}
          accessibilityLabel="Volver al historial de chats"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          <Image source={avatarSource} style={styles.headerAvatar} />
          <View style={styles.headerTextContainer}>
            <View style={styles.nameVerifiedRow}>
              <Text
                style={[styles.headerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {otherPerson.name}
              </Text>
            </View>
            {otroUsuarioEscribiendo ? (
              <Text
                style={[
                  styles.headerProfession,
                  { color: '#FF8C00', fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                escribiendo...
              </Text>
            ) : (
              <Text
                style={[styles.headerProfession, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {otherPerson.profession}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.videoButton}
          onPress={() =>
            Alert.alert('Videollamada', `Iniciando llamada segura con ${otherPerson.name}...`)
          }
          accessible={true}
          accessibilityLabel="Iniciar videollamada"
        >
          <Ionicons name="videocam-outline" size={26} color="#00BFA5" />
        </TouchableOpacity>
      </View>

      {estaBloqueado && (
        <View style={styles.blockedBanner}>
          <Ionicons name="lock-closed" size={18} color="#D97706" />
          <Text style={styles.blockedBannerText}>
            Chat cerrado. La solicitud se encuentra en estado{' '}
            <Text style={{ fontWeight: '700' }}>
              {estadoSolicitud || chat.status}
            </Text>
            . No se pueden enviar más mensajes.
          </Text>
        </View>
      )}

      {(() => {
        const hasEscrow = Boolean(chat.escrowAmount && chat.escrowAmount !== '$0' && chat.escrowAmount !== '0');
        return (
          <View
            style={[
              styles.escrowBanner,
              {
                backgroundColor:
                  chat.escrowStatus === 'RELEASED'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.15)'
                      : '#ECFDF5'
                    : hasEscrow
                      ? isDark
                        ? 'rgba(0, 191, 165, 0.15)'
                        : '#E8F8F5'
                      : isDark
                        ? '#1e293b'
                        : '#F0FDF4',
                borderColor:
                  chat.escrowStatus === 'RELEASED'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.3)'
                      : '#A7F3D0'
                    : hasEscrow
                      ? isDark
                        ? 'rgba(0, 191, 165, 0.3)'
                        : '#B2DFDB'
                      : isDark
                        ? '#334155'
                        : '#BBF7D0',
              },
            ]}
          >
            <View style={styles.escrowStatusRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={
                  chat.escrowStatus === 'RELEASED'
                    ? '#10B981'
                    : hasEscrow
                      ? isDark
                        ? '#33EFA5'
                        : '#00BFA5'
                      : '#10B981'
                }
              />
              <Text
                style={[
                  styles.escrowText,
                  {
                    color:
                      chat.escrowStatus === 'RELEASED'
                        ? '#10B981'
                        : hasEscrow
                          ? isDark
                            ? '#33EFA5'
                            : '#00897B'
                          : '#047857',
                  },
                ]}
                numberOfLines={1}
              >
                {chat.escrowStatus === 'RELEASED'
                  ? `Fondos liberados con éxito (${chat.escrowAmount}).`
                  : hasEscrow
                    ? `Fondos en custodia garantizada (${chat.escrowAmount}).`
                    : 'Chat protegido por Garantía Escrow ExpertoYa.'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setMostrarModalSeguridad(true)}
                style={styles.securityTipsBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="information-circle-outline" size={13} color="#FF8C00" />
                <Text style={styles.securityTipsBtnText}>Seguridad</Text>
              </TouchableOpacity>

              {activeRole === 'CLIENTE' && hasEscrow && chat.escrowStatus !== 'RELEASED' && (
                <TouchableOpacity
                  style={styles.releaseButton}
                  onPress={handleReleasePress}
                  activeOpacity={0.85}
                  accessible={true}
                  accessibilityLabel="Liberar fondos retenidos en fideicomiso"
                >
                  <Text style={styles.releaseButtonText}>Liberar Fondos</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })()}

      {cargandoSocket ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF8C00" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Sincronizando mensajes...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {listaMensajes.length === 0 ? (
            <View style={styles.emptyConversationContainer}>
              <View style={styles.emptyConversationIconCircle}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={36}
                  color="#FF8C00"
                />
              </View>
              <Text
                style={[styles.emptyConversationTitle, { color: colors.text }]}
              >
                Comienza la conversación
              </Text>
              <Text
                style={[
                  styles.emptyConversationSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {activeRole === 'CLIENTE'
                  ? `Escribe tu mensaje a ${otherPerson.name} para coordinar los detalles del servicio.`
                  : `Inicia la respuesta para coordinar con ${otherPerson.name}.`}
              </Text>
            </View>
          ) : (
            listaMensajes.map((msg: any) => {
              const isCurrentUser = msg.senderId === currentUserId;

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  {!isCurrentUser && (
                    <Image source={avatarSource} style={styles.bubbleAvatar} />
                  )}

                  {isPropuestaVisita(msg.text) ? (
                    (() => {
                      const propuesta = parsePropuestaVisita(msg.text);
                      if (!propuesta) return null;
                      return (
                        <View
                          style={[
                            styles.propuestaCard,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                              borderColor: '#F59E0B',
                            },
                          ]}
                        >
                          <View style={styles.propuestaCardHeader}>
                            <View style={styles.propuestaIconCircle}>
                              <Ionicons name="calendar" size={18} color="#FF8C00" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.propuestaTitle, { color: '#FF8C00' }]}>
                                Visita Técnica & Presupuesto
                              </Text>
                              <Text style={styles.propuestaSubtitle}>
                                {isCurrentUser ? 'Propuesta enviada por ti' : `Propuesta de ${otherPerson.name}`}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.propuestaBadge,
                                propuesta.estado === 'ACEPTADA'
                                  ? styles.propuestaBadgeAceptada
                                  : propuesta.estado === 'REPROGRAMAR'
                                    ? styles.propuestaBadgeReprogramar
                                    : styles.propuestaBadgePendiente,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.propuestaBadgeText,
                                  propuesta.estado === 'ACEPTADA'
                                    ? styles.propuestaBadgeTextAceptada
                                    : propuesta.estado === 'REPROGRAMAR'
                                      ? styles.propuestaBadgeTextReprogramar
                                      : styles.propuestaBadgeTextPendiente,
                                ]}
                              >
                                {propuesta.estado === 'ACEPTADA'
                                  ? 'Confirmada'
                                  : propuesta.estado === 'REPROGRAMAR'
                                    ? 'Reprogramar'
                                    : 'Pendiente'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.propuestaGrid}>
                            <View style={[styles.propuestaGridItem, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                              <Ionicons name="calendar-outline" size={15} color="#FF8C00" />
                              <View>
                                <Text style={styles.propuestaLabel}>Fecha</Text>
                                <Text style={[styles.propuestaVal, { color: colors.text }]}>{propuesta.fecha}</Text>
                              </View>
                            </View>

                            <View style={[styles.propuestaGridItem, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                              <Ionicons name="time-outline" size={15} color="#FF8C00" />
                              <View>
                                <Text style={styles.propuestaLabel}>Horario</Text>
                                <Text style={[styles.propuestaVal, { color: colors.text }]}>{propuesta.hora}</Text>
                              </View>
                            </View>

                            <View style={[styles.propuestaGridItem, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                              <Ionicons name="cash-outline" size={15} color="#10B981" />
                              <View>
                                <Text style={styles.propuestaLabel}>Presupuesto Est.</Text>
                                <Text style={[styles.propuestaVal, { color: '#10B981', fontWeight: '700' }]}>
                                  {propuesta.presupuesto || 'A convenir'}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.propuestaGridItem, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                              <Ionicons name="construct-outline" size={15} color="#283593" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.propuestaLabel}>Herramientas / Insumos</Text>
                                <Text style={[styles.propuestaVal, { color: colors.text }]} numberOfLines={1}>
                                  {propuesta.materiales || 'Herramientas estándar'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {Boolean(propuesta.nota) && (
                            <View style={styles.propuestaNotaBox}>
                              <Text style={styles.propuestaNotaTitle}>Observaciones:</Text>
                              <Text style={[styles.propuestaNotaText, { color: colors.text }]}>{propuesta.nota}</Text>
                            </View>
                          )}

                          {propuesta.estado === 'PENDIENTE' ? (
                            !isCurrentUser ? (
                              <View style={styles.propuestaActionsRow}>
                                <TouchableOpacity
                                  style={styles.propuestaAcceptBtn}
                                  onPress={() => handleConfirmarVisita(msg.id, propuesta)}
                                >
                                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                  <Text style={styles.propuestaAcceptBtnText}>Aceptar y Confirmar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.propuestaReprogramBtn}
                                  onPress={() => handlePedirReprogramacion(msg.id, propuesta)}
                                >
                                  <Text style={styles.propuestaReprogramBtnText}>Pedir Cambio</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <Text style={styles.propuestaWaitText}>
                                Esperando respuesta de {otherPerson.name}...
                              </Text>
                            )
                          ) : propuesta.estado === 'ACEPTADA' ? (
                            <View style={styles.propuestaConfirmedContainer}>
                              <View style={styles.propuestaConfirmedBanner}>
                                <Ionicons name="checkmark-done" size={16} color="#10B981" />
                                <Text style={styles.propuestaConfirmedText}>
                                  Visita confirmada por ambas partes
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.googleCalendarBtn}
                                onPress={() => handleAgregarGoogleCalendar(propuesta)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="calendar" size={15} color="#FF8C00" />
                                <Text style={styles.googleCalendarBtnText}>
                                  Agregar a Google Calendar
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.propuestaReprogramBanner}>
                              <Ionicons name="refresh" size={16} color="#3B82F6" />
                              <Text style={styles.propuestaReprogramText}>
                                Reprogramación solicitada en la conversación
                              </Text>
                            </View>
                          )}

                          <View style={styles.bubbleFooter}>
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                              {msg.timestamp}
                            </Text>
                            {isCurrentUser && (
                              <Ionicons
                                name={
                                  msg.status === 'LEIDO' || msg.leido
                                    ? 'checkmark-done'
                                    : msg.status === 'ENTREGADO'
                                      ? 'checkmark-done-outline'
                                      : 'checkmark-outline'
                                }
                                size={14}
                                color={
                                  msg.status === 'LEIDO' || msg.leido
                                    ? '#FF8C00'
                                    : '#94A3B8'
                                }
                                style={styles.tickIcon}
                              />
                            )}
                          </View>
                        </View>
                      );
                    })()
                  ) : (
                    <View
                      style={[
                        styles.bubble,
                        isCurrentUser
                          ? styles.bubbleUser
                          : [
                            styles.bubbleOther,
                            {
                              backgroundColor: colors.backgroundElement,
                              borderColor: isDark ? '#374151' : '#F1F5F9',
                            },
                          ],
                      ]}
                    >
                      {isAudioAttachment(msg.adjunto_url, msg.text) ? (
                        <VoiceNotePlayer
                          audioUrl={msg.adjunto_url || ''}
                          isCurrentUser={isCurrentUser}
                          isDark={isDark}
                        />
                      ) : Boolean(msg.adjunto_url) ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            setSelectedImage(msg.adjunto_url || null);
                            setIsZoomed(false);
                          }}
                          {...(Platform.OS === 'web'
                            ? {
                              onClick: (e: any) => {
                                e?.stopPropagation?.();
                                setSelectedImage(msg.adjunto_url || null);
                                setIsZoomed(false);
                              },
                            }
                            : {})}
                          style={styles.attachedImageContainer}
                          accessible={true}
                          accessibilityLabel="Ver foto adjunta en pantalla completa"
                        >
                          <Image
                            source={{ uri: msg.adjunto_url || '' }}
                            style={styles.attachedImage}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlayBadge}>
                            <Ionicons name="expand" size={13} color="#FFFFFF" />
                            <Text style={styles.imageOverlayText}>Ver foto</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}

                      {Boolean(msg.text) && !isAudioAttachment(msg.adjunto_url, msg.text) && (
                        <View>
                          <Text
                            style={[
                              styles.messageText,
                              {
                                color: isCurrentUser
                                  ? '#FFFFFF'
                                  : isDark
                                    ? '#FDFCF4'
                                    : '#283593',
                              },
                            ]}
                          >
                            {msg.text}
                          </Text>

                          {(() => {
                            const riesgo = analizarSeguridadMensaje(msg.text);
                            if (riesgo.esRiesgoso) {
                              return (
                                <View
                                  style={[
                                    styles.msgSecurityWarning,
                                    isCurrentUser
                                      ? styles.msgSecurityWarningUser
                                      : isDark
                                        ? styles.msgSecurityWarningDark
                                        : styles.msgSecurityWarningLight,
                                  ]}
                                >
                                  <Ionicons
                                    name="warning-outline"
                                    size={13}
                                    color={isCurrentUser ? '#FFFFFF' : '#D97706'}
                                    style={{ marginTop: 1 }}
                                  />
                                  <View style={{ flex: 1 }}>
                                    <Text
                                      style={[
                                        styles.msgSecurityWarningTitle,
                                        { color: isCurrentUser ? '#FFFFFF' : isDark ? '#FCD34D' : '#92400E' },
                                      ]}
                                    >
                                      Aviso de seguridad:
                                    </Text>
                                    <Text
                                      style={[
                                        styles.msgSecurityWarningText,
                                        { color: isCurrentUser ? 'rgba(255,255,255,0.9)' : isDark ? '#FDE68A' : '#78350F' },
                                      ]}
                                    >
                                      {riesgo.mensaje} Recuerda mantener pagos y acuerdos en ExpertoYa para contar con la Garantía Escrow.
                                    </Text>
                                  </View>
                                </View>
                              );
                            }
                            return null;
                          })()}
                        </View>
                      )}

                      <View style={styles.bubbleFooter}>
                        <Text
                          style={[
                            styles.timeText,
                            {
                              color: isCurrentUser
                                ? 'rgba(255,255,255,0.85)'
                                : isDark
                                  ? '#9CA3AF'
                                  : '#94A3B8',
                            },
                          ]}
                        >
                          {msg.timestamp}
                        </Text>
                        {renderStatusTicks(msg, isCurrentUser)}
                      </View>
                    </View>
                  )}
                </View>
              );
            }))}

          {otroUsuarioEscribiendo && (
            <View style={[styles.messageRow, styles.messageRowLeft]}>
              <Image source={avatarSource} style={styles.bubbleAvatar} />
              <View
                style={[
                  styles.bubble,
                  styles.bubbleOther,
                  styles.typingBubble,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: isDark ? '#374151' : '#F1F5F9',
                  },
                ]}
              >
                <TypingDots color="#FF8C00" />
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {!estaBloqueado && sugerencias.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: isDark ? '#1A2234' : '#FFF7ED',
              borderTopColor: isDark ? '#374151' : '#FED7AA',
            },
          ]}
        >
          <View style={styles.suggestionsHeader}>
            <Ionicons name="sparkles" size={13} color="#FF8C00" />
            <Text style={styles.suggestionsLabel}>IA:</Text>
            <TouchableOpacity
              onPress={handleRefreshSuggestions}
              disabled={cargandoSugerencias}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.refreshSuggestionsButton}
            >
              {cargandoSugerencias ? (
                <ActivityIndicator size="small" color="#FF8C00" />
              ) : (
                <Ionicons name="reload" size={13} color="#FF8C00" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.suggestionsScrollContent}
          >
            {sugerencias.map((sug, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: isDark ? '#121826' : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#FFD8A8',
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setInputText(sug);
                  textInputRef.current?.focus();
                }}
              >
                <Text
                  style={[
                    styles.suggestionChipText,
                    { color: isDark ? '#F1F5F9' : '#334155' },
                  ]}
                >
                  {sug}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!estaBloqueado && Boolean(inputText.trim()) && (() => {
        const riesgo = analizarSeguridadMensaje(inputText);
        if (!riesgo.esRiesgoso) return null;
        return (
          <View
            style={[
              styles.liveSecurityAlert,
              {
                backgroundColor: isDark ? 'rgba(120, 53, 15, 0.3)' : '#FFFBEB',
                borderTopColor: isDark ? '#78350F' : '#FDE68A',
              },
            ]}
          >
            <Ionicons name="warning-outline" size={17} color="#D97706" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.liveSecurityAlertTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                ⚠️ {riesgo.titulo}
              </Text>
              <Text style={[styles.liveSecurityAlertText, { color: isDark ? '#FDE68A' : '#78350F' }]}>
                {riesgo.mensaje} {riesgo.consejo}
              </Text>
            </View>
          </View>
        );
      })()}

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: estaBloqueado
              ? isDark
                ? '#1A202C'
                : '#F1F5F9'
              : colors.backgroundElement,
            borderTopColor: isDark ? '#374151' : '#F1F5F9',
          },
        ]}
      >
        {grabandoAudio ? (
          <View style={styles.recordingBar}>
            <View style={styles.recordingInfo}>
              <View style={styles.recordingDot} />
              <Text
                style={[
                  styles.recordingTimerText,
                  { color: isDark ? '#FFFFFF' : '#1E293B' },
                ]}
              >
                Grabando {Math.floor(segundosGrabacion / 60)}:
                {String(segundosGrabacion % 60).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity
                onPress={cancelarGrabacionAudio}
                style={styles.cancelRecordButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancelar grabación"
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={detenerYEnviarAudio}
                style={styles.sendRecordButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Enviar nota de voz"
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleCameraPress}
              disabled={estaBloqueado || subiendoFoto}
              accessible={true}
              accessibilityLabel="Adjuntar fotografía"
            >
              {subiendoFoto ? (
                <ActivityIndicator size="small" color="#FF8C00" />
              ) : (
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={
                    estaBloqueado
                      ? '#94A3B8'
                      : isDark
                        ? '#9CA3AF'
                        : '#8A92A6'
                  }
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setMostrarModalPropuesta(true)}
              disabled={estaBloqueado}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Coordinar Visita Técnica y Presupuesto"
            >
              <Ionicons name="calendar-outline" size={24} color="#FF8C00" />
            </TouchableOpacity>

            <TextInput
              ref={textInputRef}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                if (text.trim().length > 0) {
                  notificarEscribiendo();
                } else {
                  notificarDetuvoEscribiendo();
                }
              }}
              onBlur={() => notificarDetuvoEscribiendo()}
              placeholder={
                estaBloqueado
                  ? 'Chat deshabilitado por estado finalizado'
                  : 'Escribe un mensaje...'
              }
              placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
              editable={!estaBloqueado}
              style={[
                styles.input,
                {
                  backgroundColor: estaBloqueado
                    ? isDark
                      ? '#111827'
                      : '#E2E8F0'
                    : isDark
                      ? '#121826'
                      : '#F8FAFC',
                  color: estaBloqueado ? '#94A3B8' : colors.text,
                  borderColor: isDark ? '#374151' : '#E2E8F0',
                  fontSize: scaleFont(15),
                },
              ]}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />

            {voiceDictation && !estaBloqueado && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark ? '#3A2200' : '#FEF3E0',
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    marginRight: 4,
                  },
                ]}
                onPress={() => {
                  Alert.alert(
                    'Dictado por Voz',
                    'Dicta tu mensaje para añadirlo a la conversación.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Insertar dictado',
                        onPress: () =>
                          setInputText((prev) =>
                            prev
                              ? `${prev} Muchas gracias por la pronta respuesta.`
                              : 'Muchas gracias por la respuesta.'
                          ),
                      },
                    ]
                  );
                }}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Dictar por voz"
              >
                <Ionicons name="mic-circle" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                estaBloqueado && { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
              ]}
              onPress={() => {
                if (estaBloqueado) return;
                if (!inputText.trim()) {
                  iniciarGrabacionAudio();
                } else {
                  handleSend();
                }
              }}
              disabled={estaBloqueado}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel={
                inputText.trim() ? 'Enviar mensaje' : 'Grabar mensaje de voz'
              }
            >
              <Ionicons
                name={inputText.trim() ? 'send' : 'mic'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {Boolean(selectedImage) &&
        (Platform.OS === 'web' ? (
          renderPortal(
            <div
              id="image-lightbox-modal"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99999999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                boxSizing: 'border-box',
              }}
              onClick={() => setSelectedImage(null)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsZoomed((prev) => !prev)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {isZoomed ? '🔍 Ajustar' : '🔍 Zoom 2x'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                  }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'auto',
                  cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                  padding: '16px',
                  boxSizing: 'border-box',
                }}
                onClick={() => setIsZoomed((prev) => !prev)}
              >
                <img
                  src={selectedImage!}
                  alt="Adjunto en pantalla completa"
                  style={{
                    maxHeight: isZoomed ? 'none' : '75vh',
                    maxWidth: isZoomed ? 'none' : '92vw',
                    width: isZoomed ? '135vw' : 'auto',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.7)',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '8px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '20px',
                    padding: '8px 22px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  ✕ Toca aquí para cerrar
                </button>
              </div>
            </div>
          )
        ) : (
          <Modal
            visible={Boolean(selectedImage)}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedImage(null)}
            statusBarTranslucent
          >
            <View style={styles.lightboxBackdrop}>
              <View style={styles.lightboxHeader}>
                <TouchableOpacity
                  onPress={() => setIsZoomed((prev) => !prev)}
                  style={styles.lightboxButton}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isZoomed ? 'contract-outline' : 'scan-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.lightboxButtonText}>
                    {isZoomed ? 'Ajustar' : 'Zoom 2x'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={[styles.lightboxButton, styles.lightboxCloseButton]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                  <Text style={[styles.lightboxButtonText, { fontWeight: '700' }]}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.lightboxImageScrollContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                centerContent
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setIsZoomed((prev) => !prev)}
                >
                  <Image
                    source={{ uri: selectedImage || undefined }}
                    style={[
                      styles.lightboxFullImage,
                      isZoomed && styles.lightboxFullImageZoomed,
                    ]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.lightboxFooter}>
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={styles.lightboxFooterCloseBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.lightboxFooterText}>Toca aquí para cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ))}

      <Modal
        visible={mostrarModalPropuesta}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMostrarModalPropuesta(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={20} color="#FF8C00" />
                <View>
                  <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                    Coordinar Visita Técnica
                  </Text>
                  <Text style={styles.modalHeaderSubtitle}>
                    Propuesta formal en el chat
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMostrarModalPropuesta(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                Fecha estimada (AAAA-MM-DD) *
              </Text>
              <TextInput
                value={formPropuesta.fecha}
                onChangeText={(text) =>
                  setFormPropuesta((prev) => ({ ...prev, fecha: text }))
                }
                placeholder="2026-10-28"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                  },
                ]}
              />

              <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                Rango horario de llegada *
              </Text>
              <TextInput
                value={formPropuesta.hora}
                onChangeText={(text) =>
                  setFormPropuesta((prev) => ({ ...prev, hora: text }))
                }
                placeholder="Ej: 14:00 a 16:00 hs"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                  },
                ]}
              />

              <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                Presupuesto estimado ($)
              </Text>
              <TextInput
                value={formPropuesta.presupuesto}
                onChangeText={(text) =>
                  setFormPropuesta((prev) => ({ ...prev, presupuesto: text }))
                }
                placeholder="Ej: $35.000"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                  },
                ]}
              />

              <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                Herramientas y materiales
              </Text>
              <TextInput
                value={formPropuesta.materiales}
                onChangeText={(text) =>
                  setFormPropuesta((prev) => ({ ...prev, materiales: text }))
                }
                placeholder="Ej: Llaves, cinta teflón, repuestos"
                placeholderTextColor="#94A3B8"
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                  },
                ]}
              />

              <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                Observaciones adicionales
              </Text>
              <TextInput
                value={formPropuesta.nota}
                onChangeText={(text) =>
                  setFormPropuesta((prev) => ({ ...prev, nota: text }))
                }
                placeholder="Ej: Aviso antes de salir hacia el domicilio."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                    backgroundColor: isDark ? '#111827' : '#F8FAFC',
                    height: 55,
                  },
                ]}
              />
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setMostrarModalPropuesta(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEnviarPropuesta}
                style={styles.modalSubmitBtn}
              >
                <Ionicons name="send" size={14} color="#FFFFFF" />
                <Text style={styles.modalSubmitBtnText}>Enviar Propuesta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={mostrarModalSeguridad}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMostrarModalSeguridad(false)}
      >
        <View style={styles.securityModalOverlay}>
          <View style={[styles.securityModalContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.securityModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={[styles.securityModalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Garantía y Seguridad
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMostrarModalSeguridad(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginTop: 12 }}>
              <View style={[styles.securityCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0' }]}>
                <Text style={styles.securityCardIcon}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.securityCardTitle, { color: isDark ? '#6EE7B7' : '#065F46' }]}>
                    1. Pago Protegido (Escrow)
                  </Text>
                  <Text style={[styles.securityCardDesc, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    Tu dinero queda resguardado de forma segura en la plataforma y solo se libera al profesional cuando confirmás que el trabajo fue completado a tu satisfacción.
                  </Text>
                </View>
              </View>

              <View style={[styles.securityCard, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.1)' : '#FFFBEB', borderColor: isDark ? 'rgba(217, 119, 6, 0.25)' : '#FDE68A', marginTop: 10 }]}>
                <Text style={styles.securityCardIcon}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.securityCardTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                    2. Nunca abones por fuera
                  </Text>
                  <Text style={[styles.securityCardDesc, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    No realices transferencias directas a CBU/alias personales ni entregues pagos en efectivo fuera de la app. Hacerlo anula la garantía y el reembolso.
                  </Text>
                </View>
              </View>

              <View style={[styles.securityCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#BFDBFE', marginTop: 10 }]}>
                <Text style={styles.securityCardIcon}>⚖️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.securityCardTitle, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                    3. Mediación y Soporte 24/7
                  </Text>
                  <Text style={[styles.securityCardDesc, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    Todos los mensajes, fotos y notas de voz registrados en este chat constituyen respaldo oficial para que nuestro equipo de mediación intervenga ante cualquier disconformidad.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.securityModalCloseBtn}
              onPress={() => setMostrarModalSeguridad(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.securityModalCloseBtnText}>Entendido, mantener chat protegido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  headerTextContainer: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerProfession: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  videoButton: {
    padding: 6,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  blockedBannerText: {
    marginLeft: 8,
    fontSize: 12.5,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  escrowBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  escrowStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  escrowText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  releaseButton: {
    marginTop: 10,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  releaseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  datePillContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
    marginRight: 48,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
    marginLeft: 48,
  },
  bubbleAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '85%',
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#FF8C00',
    borderBottomRightRadius: 4,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 16,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  attachedImageContainer: {
    width: 210,
    height: 145,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
    cursor: Platform.OS === 'web' ? ('pointer' as any) : undefined,
  },
  attachedImage: {
    width: 210,
    height: 145,
    borderRadius: 12,
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  lightboxBackdrop: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    zIndex: 999999,
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  lightboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lightboxCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  lightboxButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lightboxImageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxFullImage: {
    width: '100%',
    height: 480,
  },
  lightboxFullImageZoomed: {
    width: 650,
    height: 650,
  },
  lightboxFooter: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 8,
  },
  lightboxFooterCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  lightboxFooterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10.5,
  },
  tickIcon: {
    marginLeft: 4,
  },
  suggestionsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF8C00',
  },
  refreshSuggestionsButton: {
    padding: 2,
    marginLeft: 2,
  },
  suggestionsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  cameraButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingTimerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelRecordButton: {
    padding: 6,
  },
  sendRecordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyConversationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 50,
  },
  emptyConversationIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 140, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyConversationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyConversationSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  calendarButton: {
    padding: 6,
  },
  propuestaCard: {
    width: '90%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  propuestaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 140, 0, 0.2)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  propuestaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propuestaTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  propuestaSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  propuestaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  propuestaBadgePendiente: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  propuestaBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  propuestaBadgeTextPendiente: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '700',
  },
  propuestaBadgeAceptada: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  propuestaBadgeTextAceptada: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '700',
  },
  propuestaBadgeReprogramar: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  propuestaBadgeTextReprogramar: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  propuestaGrid: {
    gap: 8,
    marginBottom: 8,
  },
  propuestaGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  propuestaLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  propuestaVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  propuestaNotaBox: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 140, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.2)',
    marginBottom: 8,
  },
  propuestaNotaTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  propuestaNotaText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  propuestaActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  propuestaAcceptBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  propuestaAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  propuestaReprogramBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propuestaReprogramBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  propuestaWaitText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 4,
  },
  propuestaConfirmedContainer: {
    gap: 6,
    marginVertical: 4,
  },
  googleCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  googleCalendarBtnText: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: '700',
  },
  propuestaConfirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    marginVertical: 4,
  },
  propuestaConfirmedText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '700',
  },
  propuestaReprogramBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    marginVertical: 4,
  },
  propuestaReprogramText: {
    color: '#2563EB',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  securityTipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
  },
  securityTipsBtnText: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '700',
  },
  liveSecurityAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  liveSecurityAlertTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveSecurityAlertText: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2,
  },
  msgSecurityWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  msgSecurityWarningUser: {
    backgroundColor: 'rgba(217, 119, 6, 0.35)',
    borderColor: 'rgba(253, 230, 138, 0.4)',
  },
  msgSecurityWarningDark: {
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  msgSecurityWarningLight: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  msgSecurityWarningTitle: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  msgSecurityWarningText: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  securityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  securityModalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  securityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  securityModalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  securityCardIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  securityCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityCardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  securityModalCloseBtn: {
    marginTop: 18,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityModalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
