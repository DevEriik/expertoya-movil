import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from '@/navigation/routerCompat';
import { useTheme } from '@/hooks/use-theme';
import { useAccessibility } from '@/context/AccessibilityContext';
import type { ChatSession, UserRole } from '@/types/chat';
import { MessagesList } from '@/components/chat/MessagesList';
import { ActiveConversation } from '@/components/chat/ActiveConversation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/api';
import { getToken, saveToken } from '@/utils/secureStore';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();

  const { usuario, token } = useAuth();
  const activeRole: UserRole =
    (usuario?.rol === 'PROFESIONAL' || usuario?.profesional != null)
      ? 'PROFESIONAL'
      : 'CLIENTE';

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [hiddenChatIds, setHiddenChatIds] = useState<string[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario?.id) {
      setHiddenChatIds([]);
      return;
    }
    getToken(`hidden_chats_${usuario.id}`)
      .then((raw) => {
        if (!raw) return setHiddenChatIds([]);
        const parsed = JSON.parse(raw);
        setHiddenChatIds(Array.isArray(parsed) ? parsed : []);
      })
      .catch(() => setHiddenChatIds([]));
  }, [usuario?.id]);

  const handleDeleteChat = async (id: string) => {
    const next = Array.from(new Set([...hiddenChatIds, id]));
    setHiddenChatIds(next);
    if (usuario?.id) {
      await saveToken(`hidden_chats_${usuario.id}`, JSON.stringify(next)).catch(() => {});
    }
  };

  const visibleChats = chats.filter((c) => !hiddenChatIds.includes(c.id));

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

  const isProRole = activeRole === 'PROFESIONAL';
  const activeChat =
    chats.find((c) => c.id === activeChatId) ||
    (activeChatId
      ? ({
        id: activeChatId,
        client: isProRole
          ? {
            id: '',
            name: 'Cliente',
            profession: 'Cliente',
            avatar: null,
            isVerified: true,
            role: 'CLIENTE',
          }
          : {
            id: usuario?.id || '',
            name: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Cliente',
            profession: 'Cliente',
            avatar: null,
            isVerified: true,
            role: 'CLIENTE',
          },
        professional: isProRole
          ? {
            id: usuario?.id || '',
            name: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Profesional',
            profession: 'Servicio',
            avatar: null,
            isVerified: true,
            role: 'PROFESIONAL',
          }
          : {
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
        />
      ) : (
        <MessagesList
          chats={visibleChats}
          onSelectChat={(id) => setActiveChatId(id)}
          onDeleteChat={handleDeleteChat}
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
