import React from "react";
import { Box, VStack, HStack, Heading } from "@chakra-ui/react";

import { useChat } from "../hooks/chat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { HEADER_HEIGHT } from "../theme/theme";

export default function ChatSidepanel() {
  const chat = useChat();
  const messages = chat.activeConversation?.messages || [];

  return (
    <Box
      position="fixed"
      height="100dvh"
      bg="white"
      borderLeft="1px"
      borderLeftColor="gray.100"
    >
      <VStack height="100%" spacing={0}>
        {/* Header */}
        <Box
          width="100%"
          borderBottom="1px"
          borderBottomColor="gray.100"
        >
          <HStack
            width="100%"
            p={4}
            justify="center"
            height={HEADER_HEIGHT}
          >
            <Heading as="h3" fontWeight="bold" fontSize="lg">
              Chat
            </Heading>
          </HStack>
        </Box>

        {/* Messages Area */}
        <MessageList
          messages={messages}
          streamingResponse={chat.streamingResponse}
          isStreaming={chat.isStreaming}
          handleCreateConversation={chat.handleCreateConversation}
        />

        {/* Input Area */}
        <MessageInput
          onSendMessage={chat.handleSendMessage}
          isLoading={chat.isLoading}
          isStreaming={chat.isStreaming}
          onAbort={chat.abortStreaming}
        />
      </VStack>
    </Box>
  );
}
