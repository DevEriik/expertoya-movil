
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { apiClient, API_URL } from '@/utils/api';
import { MensajeChatModel } from '@/types/chat';

interface UseChatSocketParams {
  solicitudId: string;
  userId: string;
  token?: string | null;
}

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const useChatSocket = ({ solicitudId, userId, token }: UseChatSocketParams) => {
  const [mensajes, setMensajes] = useState<MensajeChatModel[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [bloqueado, setBloqueado] = useState<boolean>(false);
  const [estadoSolicitud, setEstadoSolicitud] = useState<string>('');
  const [subiendoFoto, setSubiendoFoto] = useState<boolean>(false);
  const [otroUsuarioEscribiendo, setOtroUsuarioEscribiendo] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const typingSafetyTimeoutRef = useRef<any>(null);
  const typingDebounceTimeoutRef = useRef<any>(null);

  const esSolicitudReal = isUUID(solicitudId);

  const cargarHistorial = useCallback(async () => {
    if (!solicitudId) return;

    if (!esSolicitudReal) {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const res = await apiClient(`/api/chat/${solicitudId}/mensajes`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al obtener mensajes');
      }

      const data = await res.json();
      const { mensajes: histMensajes, bloqueado: estaBloqueado, estado_solicitud } = data;

      const formateados: MensajeChatModel[] = (histMensajes || []).map((m: MensajeChatModel) => ({
        ...m,
        status: m.leido ? 'LEIDO' : 'ENTREGADO',
      }));

      setMensajes(formateados);
      setBloqueado(Boolean(estaBloqueado));
      setEstadoSolicitud(estado_solicitud || '');
    } catch (err: any) {
      console.error('Error al cargar historial del chat:', err.message);
    } finally {
      setCargando(false);
    }
  }, [solicitudId, esSolicitudReal]);

  useEffect(() => {
    if (!solicitudId || !token || !userId) {
      setCargando(false);
      return;
    }

    if (!esSolicitudReal) {
      setCargando(false);
      return;
    }

    cargarHistorial();

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Socket conectado a la sala de chat');
      socket.emit('join_solicitud', { solicitud_id: solicitudId });
    });

    socket.on('chat_unido', (data: { solicitud_id: string; bloqueado: boolean; estado_solicitud: string }) => {
      if (data.bloqueado) {
        setBloqueado(true);
      }
      setEstadoSolicitud(data.estado_solicitud);
    });

    socket.on('nuevo_mensaje', (nuevoMsg: MensajeChatModel & { temp_id?: string }) => {
      setMensajes((prev) => {
        if (nuevoMsg.remitente_id === userId) {
          const matchIndex = prev.findIndex(
            (m) =>
              (nuevoMsg.temp_id && m.id === nuevoMsg.temp_id) ||
              m.id === nuevoMsg.id ||
              (m.status === 'ENVIANDO' && m.contenido === nuevoMsg.contenido)
          );

          if (matchIndex !== -1) {
            const updated = [...prev];
            updated[matchIndex] = {
              id: nuevoMsg.id,
              solicitud_id: nuevoMsg.solicitud_id,
              remitente_id: nuevoMsg.remitente_id,
              contenido: nuevoMsg.contenido,
              adjunto_url: nuevoMsg.adjunto_url,
              enviado_en: nuevoMsg.enviado_en,
              leido: nuevoMsg.leido,
              status: nuevoMsg.leido ? 'LEIDO' : 'ENVIADO',
            };
            return updated;
          }

          if (prev.some((m) => m.id === nuevoMsg.id)) return prev;

          return [
            ...prev,
            {
              id: nuevoMsg.id,
              solicitud_id: nuevoMsg.solicitud_id,
              remitente_id: nuevoMsg.remitente_id,
              contenido: nuevoMsg.contenido,
              adjunto_url: nuevoMsg.adjunto_url,
              enviado_en: nuevoMsg.enviado_en,
              leido: nuevoMsg.leido,
              status: 'ENVIADO',
            },
          ];
        }

        setOtroUsuarioEscribiendo(false);
        if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);

        socket.emit('confirmar_entrega', {
          mensaje_id: nuevoMsg.id,
          solicitud_id: solicitudId,
        });

        socket.emit('marcar_leido', { solicitud_id: solicitudId });

        if (prev.some((m) => m.id === nuevoMsg.id)) return prev;

        return [...prev, { ...nuevoMsg, status: 'ENTREGADO' }];
      });
    });

    socket.on('usuario_escribiendo', (data: { solicitud_id: string; usuario_id: string }) => {
      if (data.solicitud_id === solicitudId && data.usuario_id !== userId) {
        setOtroUsuarioEscribiendo(true);
        if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);
        typingSafetyTimeoutRef.current = setTimeout(() => {
          setOtroUsuarioEscribiendo(false);
        }, 4000);
      }
    });

    socket.on('usuario_detuvo_escribiendo', (data: { solicitud_id: string; usuario_id: string }) => {
      if (data.solicitud_id === solicitudId && data.usuario_id !== userId) {
        setOtroUsuarioEscribiendo(false);
        if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);
      }
    });

    socket.on('mensaje_entregado', ({ mensaje_id }: { mensaje_id: string }) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensaje_id && m.status !== 'LEIDO'
            ? { ...m, status: 'ENTREGADO' }
            : m
        )
      );
    });

    socket.on('mensajes_leidos', ({ leido_por }: { solicitud_id: string; leido_por: string }) => {
      if (leido_por !== userId) {
        setMensajes((prev) =>
          prev.map((m) =>
            m.remitente_id === userId ? { ...m, leido: true, status: 'LEIDO' } : m
          )
        );
      }
    });

    socket.on('chat_bloqueado', (data: { solicitud_id: string; motivo: string }) => {
      setBloqueado(true);
      Alert.alert('Chat Cerrado', data.motivo);
    });

    socket.on('propuesta_actualizada', (data: { mensaje_id: string; contenido: string; nuevo_estado: string }) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === data.mensaje_id ? { ...m, contenido: data.contenido } : m
        )
      );
    });

    socket.on('error_chat', (err: { mensaje: string }) => {
      console.warn('Socket error_chat:', err.mensaje);
    });

    return () => {
      if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);
      if (typingDebounceTimeoutRef.current) clearTimeout(typingDebounceTimeoutRef.current);
      socket.disconnect();
    };
  }, [solicitudId, token, userId, esSolicitudReal, cargarHistorial]);

  const notificarEscribiendo = useCallback(() => {
    if (!socketRef.current || bloqueado || !esSolicitudReal) return;

    socketRef.current.emit('escribiendo', { solicitud_id: solicitudId });

    if (typingDebounceTimeoutRef.current) clearTimeout(typingDebounceTimeoutRef.current);
    typingDebounceTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('detener_escribiendo', { solicitud_id: solicitudId });
      }
    }, 2500);
  }, [solicitudId, bloqueado, esSolicitudReal]);

  const notificarDetuvoEscribiendo = useCallback(() => {
    if (typingDebounceTimeoutRef.current) clearTimeout(typingDebounceTimeoutRef.current);
    if (socketRef.current?.connected && esSolicitudReal) {
      socketRef.current.emit('detener_escribiendo', { solicitud_id: solicitudId });
    }
  }, [solicitudId, esSolicitudReal]);

  const enviarMensaje = (texto: string) => {
    if (bloqueado) {
      Alert.alert('Chat Cerrado', 'No se pueden enviar mensajes en este estado.');
      return;
    }

    if (!texto.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const nuevoMensajeLocal: MensajeChatModel = {
      id: tempId,
      solicitud_id: solicitudId,
      remitente_id: userId,
      contenido: texto.trim(),
      adjunto_url: null,
      enviado_en: new Date().toISOString(),
      leido: false,
      status: esSolicitudReal ? 'ENVIANDO' : 'ENVIADO',
    };

    setMensajes((prev) => [...prev, nuevoMensajeLocal]);

    if (!esSolicitudReal || !socketRef.current) return;

    socketRef.current.emit(
      'enviar_mensaje',
      {
        solicitud_id: solicitudId,
        contenido: texto.trim(),
        temp_id: tempId,
      },
      (ack: any) => {
        if (ack?.error) {
          Alert.alert('Error', ack.error);
          setMensajes((prev) => prev.filter((m) => m.id !== tempId));
        } else if (ack?.status === 'ENVIADO') {
          setMensajes((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...ack.mensaje, status: 'ENVIADO' } : m
            )
          );
        }
      }
    );
  };

  const seleccionarYSubirFoto = async () => {
    if (bloqueado) {
      Alert.alert('Chat Cerrado', 'No se pueden adjuntar imágenes.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Se requiere acceso al carrete de fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];

      if (!esSolicitudReal) {
        const nuevoMsg: MensajeChatModel = {
          id: `temp-${Date.now()}`,
          solicitud_id: solicitudId,
          remitente_id: userId,
          contenido: '📷 Fotografía adjunta',
          adjunto_url: asset.uri,
          enviado_en: new Date().toISOString(),
          leido: false,
          status: 'ENVIADO',
        };
        setMensajes((prev) => [...prev, nuevoMsg]);
        return;
      }

      setSubiendoFoto(true);

      const filename = asset.uri.split('/').pop() || 'adjunto.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('foto', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const response = await apiClient(`/api/chat/${solicitudId}/adjunto`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la imagen');
      }

      const data = await response.json();
      const { adjunto_url } = data;

      const tempId = `temp-${Date.now()}`;
      const mensajeOptimista: MensajeChatModel = {
        id: tempId,
        solicitud_id: solicitudId,
        remitente_id: userId,
        contenido: '📷 Fotografía adjunta',
        adjunto_url,
        enviado_en: new Date().toISOString(),
        leido: false,
        status: 'ENVIANDO',
      };
      setMensajes((prev) => [...prev, mensajeOptimista]);

      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'enviar_mensaje',
          {
            solicitud_id: solicitudId,
            contenido: '📷 Fotografía adjunta',
            adjunto_url,
            temp_id: tempId,
          },
          (ack: any) => {
            if (ack?.error) {
              Alert.alert('Error', ack.error);
              setMensajes((prev) => prev.filter((m) => m.id !== tempId));
            } else if (ack?.status === 'ENVIADO' || ack?.status === 'ok') {
              const realMsg = ack.mensaje || ack;
              setMensajes((prev) =>
                prev.map((m) =>
                  m.id === tempId ? { ...m, id: realMsg.id || m.id, status: 'ENVIADO' } : m
                )
              );
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Error al subir adjunto:', err.message);
      Alert.alert('Error', err.message || 'No se pudo subir la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const responderPropuesta = useCallback(
    async (
      mensajeId: string,
      nuevoEstado: 'ACEPTADA' | 'REPROGRAMAR',
      respuestaTexto?: string
    ) => {
      if (!mensajeId || bloqueado) return;

      if (socketRef.current?.connected) {
        socketRef.current.emit('responder_propuesta', {
          solicitud_id: solicitudId,
          mensaje_id: mensajeId,
          nuevo_estado: nuevoEstado,
          respuesta_texto: respuestaTexto,
        });
      }

      try {
        const res = await apiClient(`/api/chat/${solicitudId}/propuesta/${mensajeId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nuevo_estado: nuevoEstado,
            respuesta_texto: respuestaTexto,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.mensaje_actualizado?.contenido) {
            setMensajes((prev) =>
              prev.map((m) =>
                m.id === mensajeId
                  ? { ...m, contenido: data.mensaje_actualizado.contenido }
                  : m
              )
            );
          }
        }
      } catch (err: any) {
        console.warn('Error en fallback REST de responderPropuesta:', err?.message);
      }
    },
    [solicitudId, bloqueado]
  );

  const subirNotaAudio = async (audioUriOrBlob: any, durationSeconds?: number) => {
    if (bloqueado) return;
    try {
      setSubiendoFoto(true);

      const durStr = durationSeconds ? ` (${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')})` : '';
      const msgLabel = `🎤 Mensaje de voz${durStr}`;

      if (!esSolicitudReal) {
        let localAudioUrl = '';
        if (Platform.OS === 'web' && audioUriOrBlob instanceof Blob) {
          localAudioUrl = URL.createObjectURL(audioUriOrBlob);
        } else if (typeof audioUriOrBlob === 'string') {
          localAudioUrl = audioUriOrBlob;
        } else if (audioUriOrBlob?.uri) {
          localAudioUrl = audioUriOrBlob.uri;
        }

        const nuevoMsg: MensajeChatModel = {
          id: `temp-${Date.now()}`,
          solicitud_id: solicitudId,
          remitente_id: userId,
          contenido: msgLabel,
          adjunto_url: localAudioUrl || null,
          enviado_en: new Date().toISOString(),
          leido: false,
          status: 'ENVIADO',
        };
        setMensajes((prev) => [...prev, nuevoMsg]);
        return;
      }

      const formData = new FormData();
      if (Platform.OS === 'web' && audioUriOrBlob instanceof Blob) {
        formData.append('audio', audioUriOrBlob, 'nota-audio.webm');
      } else {
        const filename = typeof audioUriOrBlob === 'string' ? audioUriOrBlob.split('/').pop() || 'audio-nota.m4a' : 'audio-nota.m4a';
        formData.append('audio', {
          uri: typeof audioUriOrBlob === 'string' ? audioUriOrBlob : (audioUriOrBlob?.uri || ''),
          name: filename,
          type: 'audio/m4a',
        } as any);
      }

      const response = await apiClient(`/api/chat/${solicitudId}/adjunto`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la nota de voz');
      }

      const data = await response.json();
      const { adjunto_url } = data;

      const tempId = `temp-${Date.now()}`;
      const mensajeOptimista: MensajeChatModel = {
        id: tempId,
        solicitud_id: solicitudId,
        remitente_id: userId,
        contenido: msgLabel,
        adjunto_url,
        enviado_en: new Date().toISOString(),
        leido: false,
        status: 'ENVIANDO',
      };
      setMensajes((prev) => [...prev, mensajeOptimista]);

      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'enviar_mensaje',
          {
            solicitud_id: solicitudId,
            contenido: msgLabel,
            adjunto_url,
            temp_id: tempId,
          },
          (ack: any) => {
            if (ack?.error) {
              Alert.alert('Error', ack.error);
              setMensajes((prev) => prev.filter((m) => m.id !== tempId));
            } else if (ack?.status === 'ENVIADO' || ack?.status === 'ok') {
              const realMsg = ack.mensaje || ack;
              setMensajes((prev) =>
                prev.map((m) =>
                  m.id === tempId ? { ...m, id: realMsg.id || m.id, status: 'ENVIADO' } : m
                )
              );
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Error al subir nota de audio:', err?.message);
      Alert.alert('Error', err?.message || 'No se pudo enviar la nota de audio.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  return {
    mensajes,
    cargando,
    bloqueado,
    estadoSolicitud,
    subiendoFoto,
    otroUsuarioEscribiendo,
    notificarEscribiendo,
    notificarDetuvoEscribiendo,
    enviarMensaje,
    seleccionarYSubirFoto,
    subirNotaAudio,
    responderPropuesta,
    recargarHistorial: cargarHistorial,
  };
};
