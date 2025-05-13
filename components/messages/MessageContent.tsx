import React from "react";
import { Message } from "@/hooks/chats/useChats";
import { StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";

interface MessageContentProps {
  message: Message;
  isDark: boolean;
  isCurrentUser: boolean;
}

export function MessageContent({ message, isDark, isCurrentUser }: MessageContentProps) {
  const messageDeleted = message.isDeleted ? 'This message was deleted' : 'edited';

  // If the message was deleted, an indicative text is displayed instead of the actual content.
  if (message.isDeleted) {
    return (
      <ThemedText style={[styles.messageText, styles.deletedMessage]}>
        {messageDeleted}
      </ThemedText>
    );
  }
  // The message was not deleted: render the text and, if it was edited, an indicator
  return (
    <>
      <ThemedText
        style={[
          styles.messageText,
          isCurrentUser && !isDark && styles.selfMessageText,
        ]}
      >
        {message.text}
      </ThemedText>
      {message.isEdited && (
        <ThemedText style={styles.editedIndicator}>({messageDeleted})</ThemedText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  messageText: {
    fontSize: 16,
  },
  selfMessageText: {
    color: '#000000',
  },
  deletedMessage: {
    fontStyle: "italic",
    opacity: 0.7,
  },
  editedIndicator: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 2,
  }
});
