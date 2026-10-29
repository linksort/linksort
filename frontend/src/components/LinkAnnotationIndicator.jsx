import React from "react";
import { HStack, Text } from "@chakra-ui/react";

import { HighlighterIcon } from "./CustomIcons";

export function describeAnnotations(link) {
  const highlights = (link.highlights || []).length;
  const hasNote = Boolean(link.annotation && link.annotation.length > 0);
  const parts = [];
  if (highlights > 0) parts.push(`${highlights} highlight${highlights === 1 ? "" : "s"}`);
  if (hasNote) parts.push("1 note");
  return { count: highlights + (hasNote ? 1 : 0), label: parts.join(", ") };
}

/**
 * A quiet glyph + count on link cards for links that carry a note or
 * highlights. Inline, one line tall, so it never changes a card's height.
 */
export default function LinkAnnotationIndicator({ link, ...rest }) {
  const { count, label } = describeAnnotations(link);
  if (count === 0) return null;

  return (
    <HStack
      as="span"
      spacing={1}
      color="gray.600"
      fontSize="sm"
      lineHeight="1"
      flexShrink={0}
      title={label}
      aria-label={label}
      {...rest}
    >
      <HighlighterIcon boxSize="14px" aria-hidden="true" />
      <Text as="span" fontSize="xs" fontWeight="semibold">
        {count}
      </Text>
    </HStack>
  );
}
