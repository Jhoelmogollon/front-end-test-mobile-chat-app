import { useState, useEffect, useCallback } from 'react';
import { db } from '../../database/db';
import { chats, chatParticipants, messages } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { MessageStatus } from '@/components/MessageStatus'

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  readBy: string[];
  isEdited: boolean;
  isDeleted: boolean;
  editedAt?: number;
  deletedAt?: number;
  originalText?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
}

export function useChatsDb(currentUserId: string | null) {
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chats for the current user
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUserId) {
        setUserChats([]);
        setLoading(false);
        return;
      }
      
      try {
        // Get chat IDs where the user is a participant
        const participantRows = await db
          .select()
          .from(chatParticipants)
          .where(eq(chatParticipants.userId, currentUserId));
          
        const chatIds = participantRows.map(row => row.chatId);
        
        if (chatIds.length === 0) {
          setUserChats([]);
          setLoading(false);
          return;
        }
        
        // Build the complete chat objects
        const loadedChats: Chat[] = [];
        
        for (const chatId of chatIds) {
          // Get the chat
          const chatData = await db
            .select()
            .from(chats)
            .where(eq(chats.id, chatId));
            
          if (chatData.length === 0) continue;
          
          // Get participants
          const participantsData = await db
            .select()
            .from(chatParticipants)
            .where(eq(chatParticipants.chatId, chatId));
            
          const participantIds = participantsData.map(p => p.userId);
          
          // Get messages
          const messagesData = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(messages.timestamp);
            
          const chatMessages = messagesData.map(m => {
            let readBy: string[] = [];
            try {
              readBy = JSON.parse(m.readBy || '[]');
            } catch (error) {
              console.warn('Error parsing readBy for message:', m.id, error);
              readBy = [];
            }
            
            return {
              id: m.id,
              senderId: m.senderId,
              text: m.text,
              timestamp: m.timestamp,
              status: m.status || 'sent',
              readBy,
              isEdited: m.isEdited || false,
              isDeleted: m.isDeleted || false,
              editedAt: m.editedAt || undefined,
              deletedAt: m.deletedAt || undefined,
              originalText: m.originalText || undefined,
            };
          });
          
          // Determine last message
          const lastMessage = chatMessages.length > 0 
            ? chatMessages[chatMessages.length - 1] 
            : undefined;
          
          loadedChats.push({
            id: chatId,
            participants: participantIds,
            messages: chatMessages,
            lastMessage,
          });
        }
        
        setUserChats(loadedChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
  }, [currentUserId]);

  const createChat = useCallback(async (participantIds: string[]) => {
    if (!currentUserId || !participantIds.includes(currentUserId)) {
      return null;
    }
    
    try {
      const chatId = `chat${Date.now()}`;
      
      // Insert new chat
      await db.insert(chats).values({
        id: chatId,
      });
      
      // Insert participants
      for (const userId of participantIds) {
        await db.insert(chatParticipants).values({
          id: `cp-${chatId}-${userId}`,
          chatId: chatId,
          userId: userId,
        });
      }
      
      const newChat: Chat = {
        id: chatId,
        participants: participantIds,
        messages: [],
      };
      
      setUserChats(prevChats => [...prevChats, newChat]);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [currentUserId]);

  const sendMessage = useCallback(async (chatId: string, text: string, senderId: string) => {
    if (!text.trim()) return false;
    
    try {
      const messageId = `msg${Date.now()}`;
      const timestamp = Date.now();
      
      // Insert new message
      await db.insert(messages).values({
        id: messageId,
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: timestamp,
        status: 'sent',
        readBy: JSON.stringify([senderId]), // The sender has always read his own message.
        originalText: text,
      });
      
      const newMessage: Message = {
        id: messageId,
        senderId,
        text,
        timestamp,
        status: 'sent',
        readBy: [senderId],
      };
      
      // Update state
      setUserChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
            };
          }
          return chat;
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string, userId: string) => {
    try {
      const message = db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .get();

      if (!message) return false;

      let readBy: string[] = [];
      try {
        readBy = JSON.parse(message.readBy || '[]');
      } catch (error) {
        console.warn('Error parsing readBy for message:', messageId, error);
        readBy = [];
      }

      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }

      await db
        .update(messages)
        .set({
          status: 'read',
          readBy: JSON.stringify(readBy),
        })
        .where(eq(messages.id, messageId));

      // Update state
      setUserChats(prevChats => {
        return prevChats.map(chat => ({
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                status: 'read',
                readBy: readBy,
              };
            }
            return msg;
          }),
        }));
      });

      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, []);

  return {
    chats: userChats,
    createChat,
    sendMessage,
    markMessageAsRead,
    loading,
  };
} 