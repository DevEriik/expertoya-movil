import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado con el mismo diseño y jerarquía que la pantalla de Ajustes */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Mensajes
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {activeRole === 'CLIENTE'
            ? 'Comunícate de forma segura con profesionales.'
            : 'Gestiona las consultas de tus clientes.'}
        </Text>
      </View>

      {/* Listado de tarjetas de chat */}
      <View style={styles.list}>
        {chats.map((chat) => {
          const otherPerson =
            activeRole === 'CLIENTE' ? chat.professional : chat.client;

          const imageSource =
            typeof otherPerson.avatar === 'string'
              ? { uri: otherPerson.avatar }
              : otherPerson.avatar;

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
              {/* Avatar + Contador de no leídos */}
              <View style={styles.avatarContainer}>
                <Image
                  source={imageSource}
                  style={styles.avatar}
                />
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

              {/* Contenido de la tarjeta */}
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
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: 3,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
  },
});
