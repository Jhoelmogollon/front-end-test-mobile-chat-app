import { useChatsDb, Chat, Message } from '../db/useChatsDb';

export { Chat, Message };

export function useChats(currentUserId: string | null) {
  const { 
    chats, 
    createChat, 
    sendMessage,
    markMessageAsRead,
    editMessage,
    deleteMessage,
    loading 
  } = useChatsDb(currentUserId);

  return {
    chats,
    createChat,
    sendMessage,
    markMessageAsRead,
    editMessage,
    deleteMessage,
    loading,
  };
} 