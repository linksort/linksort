import React from "react";
import { Box, Text, Flex, Avatar, HStack, Spinner } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";

// Helper component to render tool usage status
function ToolUseIndicator({ toolUse }) {
  const getStatusIcon = () => {
    switch (toolUse.status) {
      case 'success':
        return <CheckIcon boxSize={3} color="green.500" />;
      case 'error':
        return <CloseIcon boxSize={3} color="red.500" />;
      default: // pending or request
        return <Spinner size="xs" color="blue.500" />;
    }
  };

  const getStatusColor = () => {
    switch (toolUse.status) {
      case 'success':
        return 'green.100';
      case 'error':
        return 'red.100';
      default:
        return 'blue.100';
    }
  };

  return (
    <HStack
      spacing={2}
      py={1}
      px={2}
      bg={getStatusColor()}
      borderRadius="md"
      fontSize="xs"
      mt={1}
    >
      {getStatusIcon()}
      <Text fontWeight="medium" color="gray.700">
        {toolUse.name}
      </Text>
    </HStack>
  );
}

export default function MessageItem({ message }) {
  const isUser = message.role === "user";
  
  // Process tool uses to get final status for each tool
  const processToolUses = (toolUses) => {
    const toolMap = new Map();
    
    toolUses.forEach(toolUse => {
      const existing = toolMap.get(toolUse.id);
      
      if (!existing) {
        toolMap.set(toolUse.id, {
          id: toolUse.id,
          name: toolUse.name,
          status: toolUse.type === 'request' ? 'pending' : (toolUse.response?.status || 'success')
        });
      } else {
        // Update with response status if this is a response
        if (toolUse.type === 'response') {
          existing.status = toolUse.response?.status || 'success';
        }
      }
    });
    
    return Array.from(toolMap.values());
  };
  
  // Combine all tool uses from different sources
  let combinedToolUses = [];
  let finalToolUses = [];
  
  // For grouped messages, use allToolUses directly
  if (message.allToolUses) {
    combinedToolUses = message.allToolUses;
  }
  
  // Add persisted tool uses (from saved messages - for non-grouped)
  if (message.isToolUse && message.toolUse) {
    combinedToolUses = [...combinedToolUses, ...message.toolUse];
  }
  
  // Process persisted tool uses to get final status
  if (combinedToolUses.length > 0) {
    finalToolUses = processToolUses(combinedToolUses);
  }
  
  // Add streaming tool uses (from live streaming) - these are already processed
  if (message.streamingToolUses) {
    const streamingTools = Object.values(message.streamingToolUses);
    finalToolUses = [...finalToolUses, ...streamingTools];
  }

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
        
        {/* Render tool usage indicators inline */}
        {finalToolUses.length > 0 && (
          <Box mt={message.text ? 2 : 0}>
            {finalToolUses.map((toolUse) => (
              <ToolUseIndicator key={toolUse.id} toolUse={toolUse} />
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
