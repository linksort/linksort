import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Button,
  useToast,
} from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";

import AutoGrowTextarea from "./AutoGrowTextarea";
import { DotDotDotVert } from "./CustomIcons";
import { useDebounce } from "../hooks/utils";

const CLAMP_THRESHOLD = 200;

/**
 * One highlight in the Notebook: the quoted text behind a yellow edge, its
 * optional note (editable in place with debounced auto-save), and a menu.
 */
export default function HighlightCard({
  highlight,
  isOrphaned = false,
  isActive = false,
  isEditing = false,
  autoFocus = false,
  onJump,
  onStartEdit,
  onSaveNote,
  onRemove,
}) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(highlight.note || "");
  const dirtyRef = useRef(false);
  const textareaRef = useRef(null);
  const debouncedDraft = useDebounce(draft, 1000);

  // Pick up server-side changes when we are not mid-edit.
  useEffect(() => {
    if (!dirtyRef.current) {
      setDraft(highlight.note || "");
    }
  }, [highlight.note]);

  useEffect(() => {
    if (dirtyRef.current && debouncedDraft !== (highlight.note || "")) {
      dirtyRef.current = false;
      onSaveNote && onSaveNote(debouncedDraft);
    } else if (dirtyRef.current && debouncedDraft === (highlight.note || "")) {
      dirtyRef.current = false;
    }
  }, [debouncedDraft, highlight.note, onSaveNote]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, isEditing]);

  const showNoteField = isEditing || (highlight.note && highlight.note.length > 0);
  const isLong = (highlight.exact || "").length > CLAMP_THRESHOLD;

  function handleCopy() {
    const text = highlight.exact || "";
    const done = () =>
      toast({ title: "Copied highlight", status: "success", duration: 4000, isClosable: true });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {});
    } else {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      done();
    }
  }

  return (
    <Box
      as="article"
      data-highlight-card={highlight.id}
      backgroundColor="white"
      borderWidth="thin"
      borderColor={isActive ? "gray.300" : "gray.100"}
      borderLeftWidth="3px"
      borderLeftColor="highlight.200"
      borderRadius="lg"
      paddingLeft={3}
      paddingRight={2}
      paddingY={2}
      transition="background-color 0.2s ease, border-color 0.2s ease"
      _hover={{ backgroundColor: "gray.50" }}
    >
      <Flex align="flex-start" columnGap={1}>
        <Box
          as="button"
          type="button"
          flex="1"
          minWidth={0}
          textAlign="left"
          onClick={() => onJump && onJump(highlight.id)}
          title={isOrphaned ? "The highlighted text is no longer in the article" : "Show in article"}
          borderRadius="md"
          _focus={{ boxShadow: "none" }}
          _focusVisible={{ boxShadow: "outline" }}
          cursor={isOrphaned ? "default" : "pointer"}
          disabled={isOrphaned}
          aria-label={`Show highlight in article: ${highlight.exact}`}
        >
          <Text
            as="p"
            fontSize="sm"
            lineHeight="1.5"
            color="gray.800"
            noOfLines={expanded || !isLong ? undefined : 3}
            wordBreak="break-word"
          >
            {highlight.exact}
          </Text>
        </Box>
        <Menu isLazy placement="bottom-end">
          <MenuButton
            as={IconButton}
            size="xs"
            variant="ghost"
            colorScheme="gray"
            icon={<DotDotDotVert />}
            aria-label="Highlight actions"
            flexShrink={0}
            marginTop="-1px"
          />
          <Portal>
            <MenuList minWidth="12rem">
              <MenuItem icon={<EditIcon />} onClick={() => onStartEdit && onStartEdit(highlight.id)}>
                {highlight.note ? "Edit note" : "Add note"}
              </MenuItem>
              <MenuItem icon={<CopyIcon />} onClick={handleCopy}>
                Copy text
              </MenuItem>
              <MenuItem
                icon={<DeleteIcon />}
                color="red.800"
                onClick={() => onRemove && onRemove(highlight.id)}
              >
                Remove highlight
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Flex>

      {isLong && (
        <Button
          variant="link"
          size="xs"
          colorScheme="gray"
          fontWeight="normal"
          color="gray.600"
          marginTop={1}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}

      {isOrphaned && (
        <Text fontSize="xs" color="gray.600" marginTop={1}>
          Text no longer found in the article.
        </Text>
      )}

      {showNoteField && (
        <AutoGrowTextarea
          ref={textareaRef}
          aria-label="Note on this highlight"
          value={draft}
          minRows={1}
          onChange={(e) => {
            dirtyRef.current = true;
            setDraft(e.target.value);
          }}
          onBlur={() => {
            if (dirtyRef.current && draft !== (highlight.note || "")) {
              dirtyRef.current = false;
              onSaveNote && onSaveNote(draft);
            }
          }}
          placeholder="Add a note…"
          fontSize="sm"
          lineHeight="1.5"
          color="gray.700"
          variant="unstyled"
          paddingX={2}
          paddingY={1}
          marginTop={1}
          width="calc(100% - 1.5rem)"
          borderRadius="md"
          _focus={{ boxShadow: "none" }}
          _focusVisible={{ boxShadow: "outline" }}
        />
      )}
    </Box>
  );
}
