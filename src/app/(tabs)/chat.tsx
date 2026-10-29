import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAccessibility } from '@/context/AccessibilityContext';
import type { ChatSession, UserRole } from '@/types/chat';
import { MessagesList } from '@/components/chat/MessagesList';
import { ActiveConversation } from '@/components/chat/ActiveConversation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/api';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();

  const { usuario, token } = useAuth();
  const activeRole: UserRole =
    usuario?.rol === 'PROFESIONAL' ? 'PROFESIONAL' : 'CLIENTE';

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const fetchConversaciones = () => {
    if (!token) {
      setChats([]);
      return;
    }

    apiClient('/api/chat/conversaciones')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.conversaciones) {
          setChats(data.conversaciones);
        } else {
          setChats([]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar conversaciones:', err);
        setChats([]);
      });
  };

  useEffect(() => {
    fetchConversaciones();
  }, [activeRole, token]);

  useEffect(() => {
    if (chatId) {
      setActiveChatId(chatId);
      fetchConversaciones();
    }
  }, [chatId]);

  const activeChat =
    chats.find((c) => c.id === activeChatId) ||
    (activeChatId
      ? ({
        id: activeChatId,
        client: {
          id: usuario?.id || '',
          name: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Cliente',
          profession: 'Cliente',
          avatar: null,
          isVerified: true,
          role: 'CLIENTE',
        },
        professional: {
          id: '',
          name: 'Profesional',
          profession: 'Servicio',
          avatar: null,
          isVerified: true,
          role: 'PROFESIONAL',
        },
        lastMessage: '',
        timestamp: 'Ahora',
        unreadCount: 0,
        status: 'EN PROGRESO',
        escrowStatus: 'HELD',
        escrowAmount: '$0',
        messages: [],
      } as ChatSession)
      : null);

  const handleSendMessage = (targetChatId: string, text: string) => {
  };

  const handleReleaseFunds = (targetChatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? { ...c, escrowStatus: 'RELEASED', status: 'COMPLETADO' }
          : c
      )
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {activeChat ? (
        <ActiveConversation
          chat={activeChat}
          activeRole={activeRole}
          colors={colors}
          isDark={isDark}
          onBack={() => {
            setActiveChatId(null);
            router.setParams({ chatId: '' });
            fetchConversaciones();
          }}
          onSendMessage={handleSendMessage}
          onReleaseFunds={handleReleaseFunds}
        />
      ) : (
        <MessagesList
          chats={chats}
          onSelectChat={(id) => setActiveChatId(id)}
          activeRole={activeRole}
          colors={colors}
          isDark={isDark}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
