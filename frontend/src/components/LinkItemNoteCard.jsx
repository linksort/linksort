import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Flex, Link, Text, VStack } from "@chakra-ui/react";

import LinkItemFavicon from "./LinkItemFavicon";
import LinkItemControls from "./LinkItemControls";

/**
 * The card used in the Notes & highlights view: the usual title row, then
 * the link's note and every highlight as a quote with its own note. Quotes
 * link to the article scrolled to that highlight.
 */
export default function LinkItemNoteCard({ link }) {
  const highlights = link.highlights || [];
  const hasNote = Boolean(link.annotation && link.annotation.length > 0);

  return (
    <Box
      as="article"
      data-testid="note-card"
      backgroundColor="white"
      borderWidth="thin"
      borderColor="gray.100"
      borderRadius="xl"
      boxShadow="sm"
      paddingX={4}
      paddingTop={3}
      paddingBottom={4}
      transition="background-color 0.2s ease"
      _hover={{ backgroundColor: "gray.50" }}
    >
      <Flex align="center" justify="space-between" columnGap={3}>
        <Flex align="center" minWidth={0} columnGap={2}>
          <LinkItemFavicon favicon={link.favicon} />
          <Box minWidth={0}>
            <Link
              href={link.url}
              isExternal
              fontWeight="semibold"
              display="block"
              isTruncated
              title={link.title}
              _focus={{ boxShadow: "none" }}
            >
              {link.title}
            </Link>
            <Text fontSize="sm" color="gray.700" isTruncated title={link.site}>
              {link.site}
            </Text>
          </Box>
        </Flex>
        <LinkItemControls link={link} display={["none", "none", "none", "flex"]} />
      </Flex>

      {(hasNote || highlights.length > 0) && (
        <VStack align="stretch" spacing={3} marginTop={3}>
          {hasNote && (
            <Text
              as={RouterLink}
              to={`/links/${link.id}`}
              fontSize="sm"
              color="gray.800"
              whiteSpace="pre-wrap"
              noOfLines={3}
              title="Open the link page"
              borderRadius="md"
              _focus={{ boxShadow: "none" }}
              _focusVisible={{ boxShadow: "outline" }}
            >
              {link.annotation}
            </Text>
          )}
          {highlights.map((h) => (
            <Box
              key={h.id}
              as={RouterLink}
              to={`/links/${link.id}#h=${encodeURIComponent(h.id)}`}
              display="block"
              borderLeftWidth="3px"
              borderLeftColor="highlight.200"
              paddingLeft={3}
              borderRadius="sm"
              title="Show in article"
              _focus={{ boxShadow: "none" }}
              _focusVisible={{ boxShadow: "outline" }}
            >
              <Text fontSize="sm" color="gray.800" noOfLines={3}>
                {h.exact}
              </Text>
              {h.note && h.note.length > 0 && (
                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" noOfLines={3} marginTop={1}>
                  {h.note}
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      )}

      <Box display={["block", "block", "block", "none"]} marginTop={3}>
        <LinkItemControls link={link} />
      </Box>
    </Box>
  );
}
