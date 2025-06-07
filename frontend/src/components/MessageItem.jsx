import React from "react";
import { Box, Text, Flex, Avatar } from "@chakra-ui/react";

export default function MessageItem({ message }) {
  const isUser = message.role === "user";

  return (
    <Flex
      direction={isUser ? "row-reverse" : "row"}
      align="flex-start"
      gap={3}
      mb={4}
      px={4}
    >
      <Avatar
        size="sm"
        name={isUser ? "You" : "AI"}
        bg={isUser ? "brand.500" : "gray.500"}
        color="white"
        flexShrink={0}
      />
      <Box
        bg={isUser ? "brand.500" : "gray.50"}
        borderRadius="lg"
        px={4}
        py={3}
        maxWidth="75%"
        wordBreak="break-word"
        border="1px"
        borderColor={isUser ? "brand.500" : "gray.200"}
        color={isUser ? "white" : "default"}
      >
        {message.text && (
          <Text fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">
            {message.text}
          </Text>
        )}
        
        {message.isToolUse && message.toolUse && (
          <Box
            mt={message.text ? 2 : 0}
            p={3}
            bg="gray.100"
            borderRadius="md"
            fontSize="xs"
            fontFamily="mono"
          >
            <Text fontWeight="semibold" mb={1}>Tool Usage:</Text>
            <Text>{JSON.stringify(message.toolUse, null, 2)}</Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}
