import React, { useState } from "react";
import { Box, Flex, IconButton } from "@chakra-ui/react";
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

  return (
    <Box p={4} borderTop="1px" borderTopColor="gray.100" width="100%">
      <form onSubmit={handleSubmit}>
        <Flex gap={2} align="flex-end">
          <Box flex={1}>
            <Textarea
              width="100%"
              display="block"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              minRows={1}
              maxRows={4}
              cols={[20, 25, 36]}
              bg="gray.50"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              px={3}
              py={2}
              fontSize="md"
              _focus={{
                borderColor: "brand.300",
                boxShadow: "0 0 0 1px #63b3ed",
              }}
              _placeholder={{
                color: "gray.400",
              }}
            />
          </Box>

          <Box>
            <IconButton
              icon={<ArrowUpIcon />}
              type="submit"
              size="sm"
              colorScheme="brand"
              isDisabled={!message.trim() || isLoading || isStreaming}
              isLoading={isLoading}
              aria-label="Send message"
            />
          </Box>
        </Flex>
      </form>
    </Box>
  );
}
