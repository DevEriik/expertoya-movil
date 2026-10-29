import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ChatSession, UserRole } from '../../types/chat';
import { ChatStatusBadge } from './ChatStatusBadge';

interface Props {
  chats: ChatSession[];
  onSelectChat: (chatId: string) => void;
  activeRole: UserRole;
  colors: any;
  isDark?: boolean;
}

export const MessagesList: React.FC<Props> = ({
  chats,
  onSelectChat,
  activeRole,
  colors,
  isDark = false,
}) => {
  const router = useRouter();
  const [dismissedPromptId, setDismissedPromptId] = useState<string | null>(null);

  // Para el profesional: detectar si hay un chat entrante reciente para mostrar el prompt de respuesta
  const incomingChat =
    activeRole === 'PROFESIONAL' && chats.length > 0
      ? chats.find((c) => c.id !== dismissedPromptId)
      : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Mensajes
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {activeRole === 'CLIENTE'
            ? 'Comunícate de forma segura con profesionales de confianza.'
            : 'Gestiona las consultas y solicitudes de tus clientes.'}
        </Text>
      </View>

      {incomingChat && (
        <View
          style={[
            styles.incomingCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FEF3E0',
              borderColor: isDark ? '#FF8C00' : '#FFB74D',
            },
          ]}
        >
          <View style={styles.incomingHeaderRow}>
            <View style={styles.incomingIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FF8C00" />
            </View>
            <Text style={[styles.incomingHeaderTitle, { color: isDark ? '#FDFCF4' : '#283593' }]}>
              Nueva consulta recibida
            </Text>
          </View>

          <Text style={[styles.incomingBodyText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
            <Text style={{ fontWeight: '700' }}>{incomingChat.client.name}</Text> te ha enviado un
            mensaje:
          </Text>

          <View style={[styles.incomingMessageSnippet, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
            <Text
              style={[styles.incomingMessageText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}
              numberOfLines={2}
            >
              "{incomingChat.lastMessage}"
            </Text>
          </View>

          <Text style={[styles.incomingQuestion, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            ¿Deseas responder ahora?
          </Text>

          <View style={styles.incomingActionsRow}>
            <TouchableOpacity
              style={[styles.incomingLaterBtn, { borderColor: isDark ? '#4B5563' : '#CBD5E1' }]}
              onPress={() => setDismissedPromptId(incomingChat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.incomingLaterBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Más tarde
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.incomingAcceptBtn}
              onPress={() => onSelectChat(incomingChat.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.incomingAcceptBtnText}>Responder</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {chats.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={42} color="#FF8C00" />
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No tienes conversaciones activas
          </Text>

          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {activeRole === 'CLIENTE'
              ? 'Busca un profesional de oficio en la pestaña Búsqueda y presiona "Contactar" para iniciar una conversación segura.'
              : 'Aún no has recibido consultas de clientes. Cuando un cliente te envíe un mensaje, aparecerá aquí.'}
          </Text>

          {activeRole === 'CLIENTE' && (
            <TouchableOpacity
              style={styles.searchRedirectBtn}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.searchRedirectBtnText}>Buscar Profesionales</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {chats.map((chat) => {
            const otherPerson =
              activeRole === 'CLIENTE' ? chat.professional : chat.client;

            const imageSource =
              typeof otherPerson.avatar === 'string' && otherPerson.avatar.trim() !== ''
                ? { uri: otherPerson.avatar }
                : {
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    otherPerson.name || 'Usuario'
                  )}&background=283593&color=fff`,
                };

            return (
              <TouchableOpacity
                key={chat.id}
                activeOpacity={0.8}
                onPress={() => onSelectChat(chat.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: isDark ? '#374151' : '#F1F5F9',
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Conversación con ${otherPerson.name}, último mensaje: ${chat.lastMessage}`}
              >
                <View style={styles.avatarContainer}>
                  <Image source={imageSource} style={styles.avatar} />
                  {chat.unreadCount > 0 && (
                    <View
                      style={[
                        styles.unreadBadge,
                        { borderColor: colors.backgroundElement },
                      ]}
                    >
                      <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.topRow}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.name, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {otherPerson.name}
                      </Text>
                      {otherPerson.isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10B981"
                          style={styles.checkIcon}
                        />
                      )}
                    </View>
                    <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                      {chat.timestamp}
                    </Text>
                  </View>

                  <View style={styles.bottomRow}>
                    <Text
                      style={[styles.lastMessage, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {chat.lastMessage}
                    </Text>
                    <ChatStatusBadge status={chat.status} isDark={isDark} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 4,
    marginBottom: 20,
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  incomingCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
  },
  incomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  incomingIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  incomingHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  incomingBodyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  incomingMessageSnippet: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  incomingMessageText: {
    fontSize: 13.5,
    fontStyle: 'italic',
  },
  incomingQuestion: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  incomingActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  incomingLaterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingLaterBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  incomingAcceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingAcceptBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 140, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  searchRedirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  searchRedirectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF8C00',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
});
