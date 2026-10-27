import React from "react";
import { Box, Text, Flex, Wrap, WrapItem, Button, keyframes } from "@chakra-ui/react";
import { marked } from "marked";

import { splitChoices } from "../utils/choices";
import ToolActivity from "./ToolActivity";

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
              // Keep long option labels inside the message: allow the label
              // to wrap instead of overflowing (Buttons default to nowrap and
              // a fixed height).
              maxWidth="100%"
              height="auto"
              minHeight="8"
              paddingY="1.5"
              whiteSpace="normal"
              textAlign="left"
              borderRadius="full"
              bg={isSelectedAnswer ? undefined : "white"}
            >
              {choice}
            </Button>
          </WrapItem>
        );
      })}
    </Wrap>
  );
}

const blink = keyframes`
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
`;

// Three dots that take turns: the assistant is thinking.
export function TypingIndicator() {
  return (
    <Flex gap="3px" align="center" h="5" px={1} aria-label="Assistant is typing" role="status">
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          w="1.5"
          h="1.5"
          borderRadius="full"
          bg="gray.500"
          animation={`${blink} 1.2s ease-in-out ${i * 0.15}s infinite`}
        />
      ))}
    </Flex>
  );
}

// Helper to process tool use pairs and get final status
function processToolUsePairs(toolUses) {
  const toolMap = new Map();

  toolUses.forEach((toolUse) => {
    const existing = toolMap.get(toolUse.id);

    if (!existing) {
      toolMap.set(toolUse.id, {
        id: toolUse.id,
        name: toolUse.name,
        status:
          toolUse.type === "request" ? "pending" : toolUse.response?.status || "success",
      });
    } else if (toolUse.type === "response") {
      existing.status = toolUse.response?.status || "success";
    }
  });

  return toolMap;
}

// Collapse runs of consecutive tool uses into one activity block so the
// message reads as text / activity / text rather than a chip per call.
function collapseToolRuns(items) {
  const out = [];
  items.forEach((item) => {
    if (item.type === "toolUse") {
      const last = out[out.length - 1];
      if (last && last.type === "activity") {
        last.toolUses.push(item.toolUse);
      } else {
        out.push({ type: "activity", toolUses: [item.toolUse] });
      }
    } else {
      out.push(item);
    }
  });
  return out;
}

function AssistantText({ html }) {
  return (
    <Box
      className="prose prose-sans-serif"
      fontSize="sm"
      color="gray.800"
      sx={{ "& > :first-of-type": { mt: 0 }, "& > :last-child": { mb: 0 } }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function UserBubble({ children }) {
  return (
    <Flex direction="row-reverse" px={4} width="100%">
      <Box
        bg="brand.500"
        color="white"
        borderRadius="2xl"
        borderBottomRightRadius="md"
        px={4}
        py={2.5}
        maxWidth="85%"
        wordBreak="break-word"
      >
        <Text fontSize="sm" lineHeight="1.5" whiteSpace="pre-wrap">
          {children}
        </Text>
      </Box>
    </Flex>
  );
}

function AssistantBlock({ children }) {
  return (
    <Box px={4} width="100%" maxWidth="100%">
      <Box maxWidth="100%" wordBreak="break-word">
        {children}
      </Box>
    </Box>
  );
}

export default function MessageItem({
  message,
  choicesLive = false,
  answeredText = null,
  onChoiceSelect,
}) {
  const isUser = message.role === "user";

  // Messages with a content array (grouped or streaming) render inline.
  if (message.content && Array.isArray(message.content) && message.content.length > 0) {
    const isStreamingMessage = message.isStreaming;
    let toolStatusMap = new Map();

    if (!isStreamingMessage) {
      const allToolUses = message.content
        .filter((c) => c.type === "toolUse")
        .map((c) => c.toolUse);
      toolStatusMap = processToolUsePairs(allToolUses);
    }

    // Strip any trailing choices block (complete or partial) from text
    // content. Only the last content item of an assistant message can carry
    // the choices that get rendered as buttons.
    const processedContent = message.content
      .map((contentItem) => {
        if (contentItem.type !== "text" || isUser) {
          return contentItem;
        }
        const { body, choices } = splitChoices(contentItem.content);
        return { ...contentItem, content: body, choices };
      })
      // For grouped messages, keep one entry per tool call with its final
      // status; streaming content already carries live status.
      .map((contentItem) => {
        if (contentItem.type !== "toolUse" || isStreamingMessage) return contentItem;
        if (contentItem.toolUse.type !== "request") return null;
        const finalStatus = toolStatusMap.get(contentItem.toolUse.id);
        return finalStatus ? { type: "toolUse", toolUse: finalStatus } : null;
      })
      .filter(Boolean);

    const lastItem = processedContent[processedContent.length - 1];
    const choices =
      !isUser && !isStreamingMessage && lastItem && lastItem.type === "text"
        ? lastItem.choices
        : null;

    if (isUser) {
      const text = processedContent
        .filter((c) => c.type === "text")
        .map((c) => c.content.trim())
        .join("\n");
      return <UserBubble>{text}</UserBubble>;
    }

    const blocks = collapseToolRuns(processedContent);

    return (
      <AssistantBlock>
        {blocks.map((block, index) => {
          if (block.type === "text") {
            const textContent = block.content.trim();
            if (!textContent) return null;
            return <AssistantText key={index} html={marked(textContent)} />;
          }
          if (block.type === "activity") {
            return <ToolActivity key={index} toolUses={block.toolUses} />;
          }
          return null;
        })}
        {isStreamingMessage && <TypingIndicator />}
        {choices && (
          <ChoiceButtons
            choices={choices}
            live={choicesLive}
            answeredText={answeredText}
            onSelect={onChoiceSelect}
          />
        )}
      </AssistantBlock>
    );
  }

  // Legacy message structure (streaming and old messages).
  const { body: legacyBody, choices: legacyChoices } = splitChoices(
    typeof message.text === "string" ? message.text : ""
  );

  let displayToolUses = [];
  if (message.streamingToolUses) {
    displayToolUses = Object.values(message.streamingToolUses);
  }
  if (message.isToolUse && message.toolUse) {
    displayToolUses = Array.from(processToolUsePairs(message.toolUse).values());
  }

  if (isUser && !message.isToolUse) {
    return <UserBubble>{message.text}</UserBubble>;
  }

  const empty = !legacyBody && displayToolUses.length === 0;

  return (
    <AssistantBlock>
      {legacyBody && <AssistantText html={marked(legacyBody)} />}
      {displayToolUses.length > 0 && <ToolActivity toolUses={displayToolUses} />}
      {(message.isStreaming || empty) && <TypingIndicator />}
      {!message.isStreaming && legacyChoices && (
        <ChoiceButtons
          choices={legacyChoices}
          live={choicesLive}
          answeredText={answeredText}
          onSelect={onChoiceSelect}
        />
      )}
    </AssistantBlock>
  );
}
