import React from "react";
import { Box, Flex, Text, Spinner, keyframes } from "@chakra-ui/react";

// Human labels for the assistant's tools, in the product's own words.
const TOOL_LABELS = {
  get_links: ["Looking through your links", "Looked through your links"],
  get_link: ["Reading a link", "Read a link"],
  summarize_link: ["Summarizing a link", "Summarized a link"],
  create_folder: ["Creating a folder", "Created a folder"],
  rename_folder: ["Renaming a folder", "Renamed a folder"],
  delete_folder: ["Deleting a folder", "Deleted a folder"],
  add_link_to_folder: ["Filing a link", "Filed a link"],
  remove_link_from_folder: ["Taking a link out of a folder", "Took a link out of a folder"],
};

function labelFor(name, done) {
  const pair = TOOL_LABELS[name];
  if (pair) return done ? pair[1] : pair[0];
  const words = String(name || "").replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const pop = keyframes`
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

function StatusGlyph({ status }) {
  if (status === "success") {
    return (
      <Flex
        w="4"
        h="4"
        borderRadius="full"
        bg="green.600"
        color="white"
        align="center"
        justify="center"
        flexShrink={0}
        animation={`${pop} 0.2s ease-out`}
      >
        <Box as="svg" viewBox="0 0 24 24" w="2.5" h="2.5" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </Box>
      </Flex>
    );
  }
  if (status === "error") {
    return (
      <Flex w="4" h="4" borderRadius="full" bg="red.800" color="white" align="center" justify="center" flexShrink={0}>
        <Box as="svg" viewBox="0 0 24 24" w="2.5" h="2.5" fill="none">
          <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </Box>
      </Flex>
    );
  }
  return (
    <Flex w="4" h="4" align="center" justify="center" flexShrink={0}>
      <Spinner size="xs" thickness="2px" speed="0.7s" color="brand.500" emptyColor="brand.100" />
    </Flex>
  );
}

/**
 * A run of consecutive tool calls rendered as one quiet activity card:
 * a header that says what is happening, then one row per call.
 */
export default function ToolActivity({ toolUses }) {
  if (!toolUses || toolUses.length === 0) return null;

  const pending = toolUses.filter((t) => t.status !== "success" && t.status !== "error").length;
  const failed = toolUses.filter((t) => t.status === "error").length;
  const working = pending > 0;

  let title;
  if (working) title = "Working on it";
  else if (failed > 0) title = failed === 1 ? "One step didn't go through" : `${failed} steps didn't go through`;
  else title = toolUses.length === 1 ? "Done" : `${toolUses.length} steps done`;

  return (
    <Box
      my={2}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      bg="white"
      overflow="hidden"
      fontSize="xs"
    >
      <Flex
        align="center"
        gap={2}
        px={3}
        h="8"
        bg="gray.50"
        borderBottom="1px solid"
        borderBottomColor="gray.100"
        color="gray.700"
        fontWeight="semibold"
      >
        <Box
          w="1.5"
          h="1.5"
          borderRadius="full"
          bg={working ? "brand.500" : failed ? "red.800" : "green.600"}
          sx={working ? { animation: "ls-pulse 1.2s ease-in-out infinite", "@keyframes ls-pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.35 } } } : {}}
        />
        {title}
      </Flex>
      <Box px={3} py={1.5}>
        {toolUses.map((t) => {
          const done = t.status === "success" || t.status === "error";
          return (
            <Flex key={t.id} align="center" gap={2} h="6" color={done ? "gray.700" : "gray.800"}>
              <StatusGlyph status={t.status} />
              <Text as="span" noOfLines={1}>
                {labelFor(t.name, done)}
              </Text>
            </Flex>
          );
        })}
      </Box>
    </Box>
  );
}
