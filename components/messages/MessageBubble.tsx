import React from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Message } from '@/hooks/chats/useChats';
import { useColorScheme } from '@/hooks/theme/useColorScheme';
import { useMessageStatus } from '@/hooks/chats/useMessageStatus';
import { MessageStatusIcon } from './MessageStatus';
import { useAppContext } from '@/context/AppContext';
import { MessageContent } from './MessageContent';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onEditMessage?: (message: Message) => void;
}

export function MessageBubble({ message, isCurrentUser, onEditMessage }: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getStatusIcon, shouldShowStatus } = useMessageStatus(message, isCurrentUser);
  const { deleteMessage } = useAppContext();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLongPress = () => {
    if (!isCurrentUser) return;
    if (message.isDeleted) return;

    Alert.alert(
      'Options Message',
      '¿What do you want to do with this message?',
      [
        {
          text: 'Edit',
          onPress: () => onEditMessage?.(message),
        },
        {
          text: 'Delete',
          onPress: () => {
            Alert.alert(
              'Delete message',
              '¿Are you sure you want to delete this message??',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteMessage(message.id),
                },
              ]
            );
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[
        styles.container,
        isCurrentUser ? styles.selfContainer : styles.otherContainer
      ]}
    >
      <View style={[
        styles.bubble,
        isCurrentUser 
          ? [styles.selfBubble, { backgroundColor: isDark ? '#235A4A' : '#DCF8C6' }]
          : [styles.otherBubble, { backgroundColor: isDark ? '#2A2C33' : '#FFFFFF' }]
      ]}>
        <MessageContent 
          message={message} 
          isDark={isDark} 
          isCurrentUser={isCurrentUser} 
        />
        <View style={styles.timeContainer}>
          <ThemedText style={styles.timeText}>
            {formatTime(message.timestamp)}
          </ThemedText>
          {shouldShowStatus 
          && getStatusIcon() 
          && (
            <MessageStatusIcon 
              status={message.status}
              isDark={isDark}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  selfContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selfBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  selfMessageText: {
    color: '#000000',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  editedIndicator: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 2,
  },
  deletedMessage: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
}); 