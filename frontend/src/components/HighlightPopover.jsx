import React, { useEffect, useRef } from "react";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";

import FloatingAnchored from "./FloatingAnchored";

/**
 * Shown when a highlight in the article is clicked or activated with the
 * keyboard: the note (if any) with Edit/Add note and Remove.
 */
export default function HighlightPopover({ highlight, rect, onEdit, onRemove, onClose }) {
  const firstButtonRef = useRef(null);

  // The surface is portalled and mounts a tick later, so defer the focus.
  useEffect(() => {
    if (!highlight) return undefined;
    const t = setTimeout(() => {
      if (firstButtonRef.current) firstButtonRef.current.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [highlight]);

  if (!highlight || !rect) return null;

  const hasNote = highlight.note && highlight.note.length > 0;

  return (
    <FloatingAnchored
      rect={rect}
      placement="bottom"
      role="dialog"
      aria-label="Highlight"
      borderRadius="xl"
      padding={3}
      maxWidth="22rem"
      minWidth="14rem"
      data-testid="highlight-popover"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      {hasNote ? (
        <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" marginBottom={2} noOfLines={6}>
          {highlight.note}
        </Text>
      ) : (
        <Text fontSize="sm" color="gray.600" marginBottom={2}>
          No note on this highlight.
        </Text>
      )}
      <HStack spacing={1}>
        <Button
          ref={firstButtonRef}
          size="xs"
          variant="ghost"
          colorScheme="gray"
          leftIcon={<EditIcon boxSize="3" />}
          onClick={() => onEdit(highlight.id)}
        >
          {hasNote ? "Edit note" : "Add note"}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          colorScheme="gray"
          leftIcon={<DeleteIcon boxSize="3" />}
          onClick={() => onRemove(highlight.id)}
        >
          Remove
        </Button>
        <Box flex="1" />
        <Button size="xs" variant="ghost" colorScheme="gray" onClick={onClose}>
          Close
        </Button>
      </HStack>
    </FloatingAnchored>
  );
}
