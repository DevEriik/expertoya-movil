import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatSession, UserRole, Message } from '../../types/chat';

interface Props {
  chat: ChatSession;
  activeRole: UserRole;
  colors: any;
  isDark?: boolean;
  onBack: () => void;
  onSendMessage: (chatId: string, text: string) => void;
  onReleaseFunds: (chatId: string) => void;
}

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
  const scrollViewRef = useRef<ScrollView>(null);

  const otherPerson =
    activeRole === 'CLIENTE' ? chat.professional : chat.client;
  const currentPerson =
    activeRole === 'CLIENTE' ? chat.client : chat.professional;

  const imageSource =
    typeof otherPerson.avatar === 'string'
      ? { uri: otherPerson.avatar }
      : otherPerson.avatar;

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(chat.id, inputText.trim());
    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 1. Header Superior */}
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
          <Image
            source={imageSource}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextContainer}>
            <View style={styles.nameVerifiedRow}>
              <Text
                style={[styles.headerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {otherPerson.name}
              </Text>
            </View>
            <Text
              style={[styles.headerProfession, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {otherPerson.profession}
            </Text>
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

      {/* 2. Banner de Fideicomiso / Escrow */}
      <View
        style={[
          styles.escrowBanner,
          {
            backgroundColor:
              chat.escrowStatus === 'RELEASED'
                ? isDark
                  ? 'rgba(16, 185, 129, 0.15)'
                  : '#ECFDF5'
                : isDark
                ? 'rgba(0, 191, 165, 0.15)'
                : '#E8F8F5',
            borderColor:
              chat.escrowStatus === 'RELEASED'
                ? isDark
                  ? 'rgba(16, 185, 129, 0.3)'
                  : '#A7F3D0'
                : isDark
                ? 'rgba(0, 191, 165, 0.3)'
                : '#B2DFDB',
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
                : isDark
                ? '#33EFA5'
                : '#00BFA5'
            }
          />
          <Text
            style={[
              styles.escrowText,
              {
                color:
                  chat.escrowStatus === 'RELEASED'
                    ? '#10B981'
                    : isDark
                    ? '#33EFA5'
                    : '#00897B',
              },
            ]}
          >
            {chat.escrowStatus === 'RELEASED'
              ? `Fondos liberados con éxito (${chat.escrowAmount}).`
              : `Fondos en custodia garantizada (${chat.escrowAmount}).`}
          </Text>
        </View>

        {activeRole === 'CLIENTE' && chat.escrowStatus !== 'RELEASED' && (
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

      {/* 3. Stream de Mensajes */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {/* Date pill */}
        <View style={styles.datePillContainer}>
          <View
            style={[
              styles.datePill,
              {
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
              },
            ]}
          >
            <Text
              style={[
                styles.dateText,
                { color: isDark ? '#9CA3AF' : '#64748B' },
              ]}
            >
              Hoy
            </Text>
          </View>
        </View>

        {/* Mensajes */}
        {chat.messages.map((msg: Message) => {
          const isCurrentUser = msg.senderId === currentPerson.id;

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
              ]}
            >
              {!isCurrentUser && (
                <Image
                  source={imageSource}
                  style={styles.bubbleAvatar}
                />
              )}

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
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 4. Barra Inferior de Entrada */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.backgroundElement,
            borderTopColor: isDark ? '#374151' : '#F1F5F9',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() =>
            Alert.alert('Cámara', 'Seleccionar foto del trabajo realizado para adjuntar.')
          }
          accessible={true}
          accessibilityLabel="Adjuntar fotografía"
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color={isDark ? '#9CA3AF' : '#8A92A6'}
          />
        </TouchableOpacity>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#121826' : '#F8FAFC',
              color: colors.text,
              borderColor: isDark ? '#374151' : '#E2E8F0',
            },
          ]}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSend}
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
      </View>
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  releaseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  datePillContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  datePill: {
    paddingHorizontal: 14,
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
    paddingVertical: 12,
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
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
});
