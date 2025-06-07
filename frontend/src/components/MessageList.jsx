import React, { useEffect, useRef } from "react";
import { Box, VStack, Text } from "@chakra-ui/react";

import MessageItem from "./MessageItem";

export default function MessageList({ messages = [], streamingResponse, isStreaming }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingResponse]);

  // Show empty state if no messages
  if (messages.length === 0 && !isStreaming) {
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
      <VStack spacing={0} align="stretch">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        
        {/* Show streaming response as a temporary message */}
        {isStreaming && streamingResponse && (
          <MessageItem
            message={{
              id: "streaming",
              role: "assistant",
              text: streamingResponse,
            }}
          />
        )}
      </VStack>
    </Box>
  );
}