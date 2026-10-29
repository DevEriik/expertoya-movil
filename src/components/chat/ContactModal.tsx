import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface ContactModalProps {
  visible: boolean;
  professionalId: string;
  professionalName: string;
  professionalPhoto?: string;
  profession?: string;
  onClose: () => void;
  onSuccess: (solicitudId: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  visible,
  professionalId,
  professionalName,
  professionalPhoto,
  profession,
  onClose,
  onSuccess,
}) => {
  const { usuario } = useAuth();
  const isSelf = usuario?.id === professionalId;

  const [primerMensaje, setPrimerMensaje] = useState(
    '¡Hola! Me gustaría consultar por la disponibilidad de tu servicio.'
  );
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (usuario?.id === professionalId) {
      Alert.alert('Acción no permitida', 'No puedes enviarte mensajes a ti mismo.');
      onClose();
      return;
    }

    if (!primerMensaje.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un mensaje para iniciar la conversación.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient('/api/chat/iniciar', {
        method: 'POST',
        body: JSON.stringify({
          profesional_id: professionalId,
          primer_mensaje: primerMensaje.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar la conversación');
      }

      onClose();
      onSuccess(data.solicitud_id);
    } catch (error: any) {
      console.error('Error al iniciar conversación:', error.message);
      Alert.alert('Error', error.message || 'Ocurrió un error al contactar al profesional.');
    } finally {
      setLoading(false);
    }
  };

  const avatarUri =
    professionalPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professionalName)}&background=FF8C00&color=fff`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <View style={styles.badgeShield}>
              <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>¿Deseas contactarte con {professionalName}?</Text>
          {profession ? <Text style={styles.professionText}>{profession}</Text> : null}
          <Text style={styles.subtitle}>
            Envía un mensaje para coordinar los detalles del servicio de forma directa y segura.
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={primerMensaje}
              onChangeText={setPrimerMensaje}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleStartChat}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="chatbubble" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmButtonText}>Comenzar charla</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
  },
  badgeShield: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00BFA5',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#283593',
    textAlign: 'center',
    marginBottom: 4,
  },
  professionText: {
    fontSize: 13,
    color: '#FF8C00',
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 20,
  },
  textInput: {
    fontSize: 14,
    color: '#1E293B',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1.4,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
