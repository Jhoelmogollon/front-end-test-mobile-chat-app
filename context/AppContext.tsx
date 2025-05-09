import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useUser, User } from '../hooks/users/useUser';
import { useChats, Chat } from '../hooks/chats/useChats';
import { DatabaseProvider } from '../database/DatabaseProvider';
import { useDatabase } from '../hooks/db/useDatabase';

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  chats: Chat[];
  createChat: (participantIds: string[]) => Promise<Chat | null>;
  sendMessage: (chatId: string, text: string, senderId: string) => Promise<boolean>;
  markMessageAsRead: (messageId: string, userId: string) => Promise<boolean>;
  editMessage: (messageId: string, newText: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  loading: boolean;
  dbInitialized: boolean;
  isLoggedIn: boolean;
  login: (userId: string) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

function AppContent({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { users, loading: usersLoading } = useUser();
  const { 
    chats, 
    createChat, 
    sendMessage, 
    markMessageAsRead,
    editMessage,
    deleteMessage,
    loading: chatsLoading 
  } = useChats(currentUser?.id || null);
  const { isInitialized: dbInitialized } = useDatabase();

  const login = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    users,
    chats,
    createChat,
    sendMessage,
    markMessageAsRead,
    editMessage,
    deleteMessage,
    loading: usersLoading || chatsLoading,
    dbInitialized,
    isLoggedIn: !!currentUser,
    login,
    logout,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <AppContent>{children}</AppContent>
    </DatabaseProvider>
  );
} 