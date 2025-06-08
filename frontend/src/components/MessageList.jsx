import React, { useEffect, useRef } from "react";
import { Box, VStack, Text, Button, Flex } from "@chakra-ui/react";

import MessageItem from "./MessageItem";

const INTRO = `Hello! I'm your friendly Linksort AI assistant, designed to help you efficiently manage and learn about your saved web links. Think of me as your personal digital librarian and organizational companion.

My core purpose is to help you:
- Keep your links neatly organized. I can create, update, and delete folders and move links into fitting locations.
- Discover insights from your saved content. I can summarize, compare, and analyze your links.
- Easily navigate and understand your collection.
- Explain Linksort's features and how to use them.

To get started, you might try asking me to:
- Summarize your most recently saved links.
- Answer questions about articles and their content.
- Organize your recently saved links into folders.
- Explain my other features.
- Or just say hi :)
`

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
    <Box
      flex={1}
      overflowY="auto"
      py={4}
      width="100%"
    >
      <Box flex={1} display="flex" py={4} width="100%">
        <MessageItem
          message={{
            id: "intro",
            role: "assistant",
            text: INTRO,
            isStreaming: false
          }}
        />
      </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      flex={1}
      overflowY="auto"
      py={4}
      width="100%"
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
              Clear Chat
            </Button>
          </Flex>
        )}

      </VStack>
    </Box>
  );
}
