import React, { useState } from "react";
import { Box, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { ArrowUpIcon } from "@chakra-ui/icons";

import Textarea from "./Textarea";

export default function MessageInput({ onSendMessage, isLoading, isStreaming, onAbort }) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || isStreaming) return;

    const messageText = message.trim();
    setMessage("");

    try {
      await onSendMessage(messageText);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = Boolean(message.trim()) && !isLoading && !isStreaming;

  return (
    <Box p={3} pt={2} width="100%">
      <form onSubmit={handleSubmit}>
        <Flex
          align="flex-end"
          gap={2}
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="2xl"
          pl={4}
          pr={2}
          py={2}
          transition="border-color 0.2s ease, box-shadow 0.2s ease"
          _focusWithin={{ borderColor: "brand.300", bg: "white" }}
        >
          <Box flex={1} minW={0}>
            <Textarea
              width="100%"
              display="block"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your links…"
              minRows={1}
              maxRows={6}
              cols={[20, 25, 36]}
              bg="transparent"
              border="0"
              borderRadius="0"
              px={0}
              py={1}
              fontSize="sm"
              lineHeight="1.5"
              _focus={{ boxShadow: "none", outline: "none" }}
              _placeholder={{ color: "gray.500" }}
            />
          </Box>
          {isStreaming ? (
            <Tooltip label="Stop" openDelay={400}>
              <IconButton
                icon={<Box w="2.5" h="2.5" bg="currentColor" borderRadius="sm" />}
                type="button"
                size="sm"
                variant="solid"
                colorScheme="gray"
                borderRadius="full"
                onClick={onAbort}
                aria-label="Stop generating"
              />
            </Tooltip>
          ) : (
            <IconButton
              icon={<ArrowUpIcon boxSize={4} />}
              type="submit"
              size="sm"
              colorScheme="brand"
              borderRadius="full"
              isDisabled={!canSend}
              isLoading={isLoading}
              aria-label="Send message"
              transition="opacity 0.2s ease, background-color 0.2s ease"
              _disabled={{ opacity: 0.35, cursor: "not-allowed" }}
            />
          )}
        </Flex>
      </form>
    </Box>
  );
}
