import React from "react";
import { Box, Flex, Heading, Text, VStack, IconButton } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

import AutoGrowTextarea from "./AutoGrowTextarea";
import HighlightCard from "./HighlightCard";

/**
 * The Notebook: everything the user wrote about one link. "Your note" on
 * top, then one card per highlight in document order. Rendered either as a
 * column beside the article or inside a bottom drawer; the parent owns all
 * state so switching between the two never loses a draft.
 */
export default function NotebookPanel({
  annotation,
  onAnnotationChange,
  isSavingAnnotation,
  highlights = [],
  orphanedIds,
  activeHighlightId,
  editingHighlightId,
  onJumpToHighlight,
  onStartEditHighlight,
  onSaveHighlightNote,
  onRemoveHighlight,
  onClose,
  noteRef,
  hasArticle = true,
}) {
  const highlightCount = highlights.length;

  return (
    <Flex direction="column" height="100%" minHeight={0}>
      <Flex
        as="header"
        align="center"
        justify="space-between"
        paddingX={4}
        height="3rem"
        flexShrink={0}
        borderBottomWidth="thin"
        borderBottomColor="gray.100"
      >
        <Heading as="h2" fontSize="sm" color="gray.800">
          Notebook
        </Heading>
        {onClose && (
          <IconButton
            size="sm"
            variant="ghost"
            colorScheme="gray"
            icon={<CloseIcon boxSize="2.5" />}
            aria-label="Close notebook"
            onClick={onClose}
          />
        )}
      </Flex>

      <Box flex="1" minHeight={0} overflowY="auto" paddingX={4} paddingY={4}>
        <VStack align="stretch" spacing={6}>
          <Box as="section" aria-labelledby="notebook-your-note">
            <Flex align="baseline" justify="space-between" marginBottom={2}>
              <Heading
                as="h3"
                id="notebook-your-note"
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="0.05em"
                textTransform="uppercase"
                color="gray.600"
              >
                Your note
              </Heading>
              <Text
                as="span"
                fontSize="xs"
                color="gray.600"
                aria-live="polite"
                minWidth="3rem"
                textAlign="right"
              >
                {isSavingAnnotation ? "Saving…" : annotation ? "Saved" : ""}
              </Text>
            </Flex>
            <AutoGrowTextarea
              ref={noteRef}
              aria-label="Your note about this link"
              value={annotation}
              onChange={(e) => onAnnotationChange(e.target.value)}
              placeholder="Why did you save this?"
              minRows={3}
              maxHeight="24rem"
              fontSize="sm"
              lineHeight="1.5"
              backgroundColor="white"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              borderRadius="md"
              paddingX={3}
              paddingY={2}
            />
          </Box>

          <Box as="section" aria-labelledby="notebook-highlights">
            <Heading
              as="h3"
              id="notebook-highlights"
              fontSize="xs"
              fontWeight="semibold"
              letterSpacing="0.05em"
              textTransform="uppercase"
              color="gray.600"
              marginBottom={2}
            >
              Highlights{highlightCount > 0 ? ` · ${highlightCount}` : ""}
            </Heading>
            {highlightCount === 0 ? (
              <Text fontSize="sm" color="gray.600">
                {hasArticle
                  ? "Select some text in the article to highlight it."
                  : "There's no article text to highlight for this link."}
              </Text>
            ) : (
              <VStack as="ul" align="stretch" spacing={2} listStyleType="none">
                {highlights.map((h) => (
                  <Box as="li" key={h.id}>
                    <HighlightCard
                      highlight={h}
                      isOrphaned={orphanedIds ? orphanedIds.has(h.id) : false}
                      isActive={activeHighlightId === h.id}
                      isEditing={editingHighlightId === h.id}
                      autoFocus={editingHighlightId === h.id}
                      onJump={onJumpToHighlight}
                      onStartEdit={onStartEditHighlight}
                      onSaveNote={(note) => onSaveHighlightNote(h.id, note)}
                      onRemove={onRemoveHighlight}
                    />
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}
