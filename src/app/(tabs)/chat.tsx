import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAccessibility } from '@/context/AccessibilityContext';
import { CLIENT_CHATS, PRO_CHATS } from '@/constants/mockChatData';
import type { ChatSession, UserRole } from '@/types/chat';
import { MessagesList } from '@/components/chat/MessagesList';
import { ActiveConversation } from '@/components/chat/ActiveConversation';
import { useAuth } from '@/context/AuthContext';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  
  const colors = useTheme();
  const { isDarkMode: isDark } = useAccessibility();

  // Detección automática del rol según el usuario autenticado
  const { usuario } = useAuth();
  const activeRole: UserRole =
    usuario?.rol === 'PROFESIONAL' ? 'PROFESIONAL' : 'CLIENTE';

  const [chats, setChats] = useState<ChatSession[]>(() =>
    activeRole === 'PROFESIONAL' ? PRO_CHATS : CLIENT_CHATS
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    setChats(activeRole === 'PROFESIONAL' ? PRO_CHATS : CLIENT_CHATS);
  }, [activeRole]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const handleSendMessage = (chatId: string, text: string) => {
    const currentPersonId =
      activeRole === 'CLIENTE' ? 'user-client-1' : 'pro-daniela';

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentPersonId,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      dateLabel: 'Hoy',
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: text,
            timestamp: 'Ahora',
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );
  };

  const handleReleaseFunds = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            escrowStatus: 'RELEASED',
            status: 'COMPLETADO',
          };
        }
        return c;
      })
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
      {/* Vistas: Lista de chats o conversación activa */}
      {activeChat ? (
        <ActiveConversation
          chat={activeChat}
          activeRole={activeRole}
          colors={colors}
          isDark={isDark}
          onBack={() => setActiveChatId(null)}
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
