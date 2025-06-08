import React, { useEffect, useRef } from "react";
import { Box, VStack, Text, Button, Flex } from "@chakra-ui/react";

import MessageItem from "./MessageItem";

// Helper function to group messages for proper display with ordered content
function groupMessages(messages) {
  const grouped = [];
  let currentGroup = null;

  // Helper to add ordered content to current group
  const addContent = (type, content, toolUse = null) => {
    if (!currentGroup.content) {
      currentGroup.content = [];
    }
    
    if (type === 'text' && content) {
      currentGroup.content.push({ type: 'text', content });
    } else if (type === 'toolUse' && toolUse) {
      currentGroup.content.push({ type: 'toolUse', toolUse });
    }
  };

  for (const message of messages) {
    if (message.role === "user" && !message.isToolUse) {
      // Regular user message - add previous group and start new group
      if (currentGroup) {
        grouped.push(currentGroup);
        currentGroup = null;
      }
      // Add user message directly to grouped array
      grouped.push({ ...message });
    } else if (message.role === "assistant" || (message.role === "user" && message.isToolUse)) {
      // Assistant message or tool use response (which has role "user" but isToolUse true)
      if (!currentGroup || currentGroup.role === "user") {
        // Start new assistant group
        currentGroup = {
          id: message.id,
          role: "assistant",
          sequenceNumber: message.sequenceNumber,
          createdAt: message.createdAt,
          content: [],
          isGrouped: true
        };
      }

      // Add text content if present
      if (message.text) {
        addContent('text', message.text);
      }

      // Add tool uses if present
      if (message.isToolUse && message.toolUse) {
        message.toolUse.forEach(toolUse => {
          addContent('toolUse', null, toolUse);
        });
      }
    }
  }

  // Add the last group
  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

export default function MessageList({ messages = [], streamingResponse, isStreaming, handleCreateConversation }) {
  const scrollRef = useRef(null);
  
  // Group messages to combine tool use sequences
  const groupedMessages = groupMessages(messages);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [groupedMessages, streamingResponse]);

  // Show empty state if no messages
  if (groupedMessages.length === 0 && !isStreaming) {
    return (
      <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={4}>
        <Text color="gray.500" textAlign="center">
          Start a conversation by sending a message below
        </Text>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      flex={1}
      overflowY="auto"
      py={4}
    >
      <VStack spacing={4} align="stretch">
        {groupedMessages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        
        {/* Show streaming response as a temporary message */}
        {isStreaming && streamingResponse && (
          <MessageItem
            message={{
              id: "streaming",
              role: "assistant",
              text: streamingResponse.text,
              streamingToolUses: streamingResponse.toolUses,
              content: streamingResponse.content,
              isStreaming: true
            }}
          />
        )}

        {messages.length > 0 && !isStreaming && (
          <Flex>
            <Button onClick={handleCreateConversation} variant="ghost" margin="auto" size="sm">
              New Conversation
            </Button>
          </Flex>
        )}

      </VStack>
    </Box>
  );
}
