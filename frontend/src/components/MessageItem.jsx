import React from "react";
import { Box, Text, Flex, HStack, Spinner, Wrap, WrapItem, Button } from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { marked } from "marked";

import { splitChoices } from "../utils/choices";

// Renders the options of a trailing ```choices block as buttons. Only the
// last assistant message of a conversation (while not streaming) gets live
// buttons; older prompts render inactive, with the clicked answer indicated.
function ChoiceButtons({ choices, live, answeredText, onSelect }) {
  const answered = answeredText ? answeredText.trim() : null;

  return (
    <Wrap mt={3} spacing={2}>
      {choices.map((choice) => {
        const isSelectedAnswer = answered === choice;

        return (
          <WrapItem key={choice} maxWidth="100%">
            <Button
              size="sm"
              colorScheme="brand"
              variant={isSelectedAnswer ? "solid" : "outline"}
              isDisabled={!live}
              _disabled={{
                opacity: isSelectedAnswer ? 0.9 : 0.5,
                cursor: "not-allowed",
              }}
              onClick={live && onSelect ? () => onSelect(choice) : undefined}
              // Keep long option labels inside the message bubble: allow the
              // label to wrap instead of overflowing (Buttons default to
              // nowrap and a fixed height).
              maxWidth="100%"
              height="auto"
              minHeight="8"
              paddingY="1.5"
              whiteSpace="normal"
              textAlign="left"
            >
              {choice}
            </Button>
          </WrapItem>
        );
      })}
    </Wrap>
  );
}

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

// Helper to process tool use pairs and get final status
function processToolUsePairs(toolUses) {
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

  return toolMap;
}

export default function MessageItem({ message, choicesLive = false, answeredText = null, onChoiceSelect }) {
  const isUser = message.role === "user";

  // For messages with content array (grouped or streaming), render inline
  if (message.content && Array.isArray(message.content) && message.content.length > 0) {
    // For streaming messages, use tool use status directly
    // For grouped messages, process tool use pairs for final status
    const isStreamingMessage = message.isStreaming;
    let toolStatusMap = new Map();

    if (!isStreamingMessage) {
      // Process all tool uses in grouped messages to get final statuses
      const allToolUses = message.content.filter(c => c.type === 'toolUse').map(c => c.toolUse);
      toolStatusMap = processToolUsePairs(allToolUses);
    }

    // Strip any trailing choices block (complete or partial) from text
    // content. Only the last content item of an assistant message can carry
    // the choices that get rendered as buttons.
    const processedContent = message.content.map((contentItem) => {
      if (contentItem.type !== 'text' || isUser) {
        return contentItem;
      }
      const { body, choices } = splitChoices(contentItem.content);
      return { ...contentItem, content: body, choices };
    });

    const lastItem = processedContent[processedContent.length - 1];
    const choices =
      !isUser && !isStreamingMessage && lastItem.type === 'text'
        ? lastItem.choices
        : null;

    return (
      <Flex
        direction={isUser ? "row-reverse" : "row"}
        align="flex-start"
        gap={3}
        px={4}
        width="100%"
      >
        <Box
          bg={isUser ? "brand.500" : "gray.50"}
          borderRadius="lg"
          px={4}
          py={3}
          maxWidth="90%"
          wordBreak="break-word"
          border="1px"
          borderColor={isUser ? "brand.500" : "gray.200"}
          color={isUser ? "white" : "default"}
        >
          {message.content.length === 0 && (
            <Spinner size="xs" color="blue.500" />
          )}
          {processedContent.map((contentItem, index) => {
            if (contentItem.type === 'text') {
              const textContent = contentItem.content.trim();

              if (!textContent) {
                return null;
              }

              // Render markdown for assistant messages, plain text for user messages
              if (!isUser) {
                return (
                  <Box
                    key={index}
                    className="prose prose-sans-serif"
                    fontSize="sm"
                    dangerouslySetInnerHTML={{ __html: marked(textContent) }}
                  />
                );
              }

              return (
                <Text key={index} fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">
                  {textContent}
                </Text>
              );
            } else if (contentItem.type === 'toolUse') {
              const toolUse = contentItem.toolUse;

              if (isStreamingMessage) {
                // For streaming, show tool use as-is (status updates in real-time)
                return (
                  <Box key={index} my={2}>
                    <ToolUseIndicator toolUse={toolUse} />
                  </Box>
                );
              } else {
                // For grouped messages, only show requests with their final status
                const finalStatus = toolStatusMap.get(toolUse.id);
                if (toolUse.type === 'request' && finalStatus) {
                  return (
                    <Box key={index} my={2}>
                      <ToolUseIndicator toolUse={finalStatus} />
                    </Box>
                  );
                }
              }
            }
            return null;
          })}
          {choices && (
            <ChoiceButtons
              choices={choices}
              live={choicesLive}
              answeredText={answeredText}
              onSelect={onChoiceSelect}
            />
          )}
        </Box>
      </Flex>
    );
  }

  // Fallback for legacy message structure (streaming and old messages)
  const { body: legacyBody, choices: legacyChoices } = splitChoices(
    typeof message.text === "string" ? message.text : ""
  );

  let displayToolUses = [];

  // Handle streaming messages
  if (message.streamingToolUses) {
    displayToolUses = Object.values(message.streamingToolUses);
  }

  // Handle persisted tool uses
  if (message.isToolUse && message.toolUse) {
    const toolStatusMap = processToolUsePairs(message.toolUse);
    displayToolUses = Array.from(toolStatusMap.values());
  }

  return (
    <Flex
      direction={isUser ? "row-reverse" : "row"}
      align="flex-start"
      gap={3}
      px={4}
      width="100%"
    >
      <Box
        bg={isUser ? "brand.500" : "gray.50"}
        borderRadius="lg"
        px={4}
        py={3}
        maxWidth="90%"
        wordBreak="break-word"
        border="1px"
        borderColor={isUser ? "brand.500" : "gray.200"}
        color={isUser ? "white" : "default"}
      >
        {message.text.length === 0 && (
          <Spinner size="xs" color="blue.500" />
        )}

        {legacyBody && !isUser && (
          <Box
            className="prose prose-sans-serif"
            fontSize="sm"
            dangerouslySetInnerHTML={{ __html: marked(legacyBody) }}
          />
        )}

        {message.text && isUser && (
          <Text fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">
            {message.text}
          </Text>
        )}

        {!isUser && !message.isStreaming && legacyChoices && (
          <ChoiceButtons
            choices={legacyChoices}
            live={choicesLive}
            answeredText={answeredText}
            onSelect={onChoiceSelect}
          />
        )}

        {/* Render tool usage indicators inline */}
        {displayToolUses.length > 0 && (
          <Box mt={message.text ? 2 : 0}>
            {displayToolUses.map((toolUse) => (
              <ToolUseIndicator key={toolUse.id} toolUse={toolUse} />
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
