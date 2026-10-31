import React from "react";
import { Button, HStack } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";

import FloatingAnchored from "./FloatingAnchored";
import { HighlighterIcon } from "./CustomIcons";

/**
 * The pill that appears over a text selection in the article. On touch
 * devices it sits below the selection so it does not fight the native
 * selection menu, which appears above.
 */
export default function SelectionToolbar({ rect, isTouch = false, isBusy = false, onHighlight, onHighlightWithNote }) {
  if (!rect) return null;

  return (
    <FloatingAnchored
      rect={rect}
      placement={isTouch ? "bottom" : "top"}
      role="toolbar"
      aria-label="Selection actions"
      padding={1}
      data-testid="selection-toolbar"
    >
      <HStack spacing={1}>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          borderRadius="full"
          leftIcon={<HighlighterIcon boxSize="3" />}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onHighlight}
          isDisabled={isBusy}
        >
          Highlight
        </Button>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          borderRadius="full"
          leftIcon={<EditIcon boxSize="3" />}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onHighlightWithNote}
          isDisabled={isBusy}
        >
          Highlight + note
        </Button>
      </HStack>
    </FloatingAnchored>
  );
}
