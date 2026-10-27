import React from "react";
import { Box, VStack, HStack, Heading, IconButton, Tooltip } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";

import { useChatContext } from "../hooks/chat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { HEADER_HEIGHT } from "../theme/theme";

export default function ChatSidepanel() {
  const chat = useChatContext();
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
            px={4}
            justify="space-between"
            height={HEADER_HEIGHT}
          >
            <Box w="8" />
            <Heading as="h3" fontWeight="bold" fontSize="lg">
              Chat
            </Heading>
            <Tooltip label="New chat" openDelay={400}>
              <IconButton
                aria-label="New chat"
                icon={<EditIcon />}
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={chat.handleCreateConversation}
                isDisabled={messages.length === 0 || chat.isStreaming}
              />
            </Tooltip>
          </HStack>
        </Box>

        {/* Messages Area */}
        <MessageList
          messages={messages}
          streamingResponse={chat.streamingResponse}
          isStreaming={chat.isStreaming}
          handleCreateConversation={chat.handleCreateConversation}
          onSendMessage={chat.handleSendMessage}
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
