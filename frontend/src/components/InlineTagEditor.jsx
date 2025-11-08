import React, { useState } from "react";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useLink, useUpdateLink } from "../hooks/links";
import TagEditor from "./TagEditor";

/**
 * InlineTagEditor wraps the TagEditor component with API integration
 * to automatically save tag changes to the backend.
 */
export default function InlineTagEditor({ linkId }) {
  const [isSaving, setIsSaving] = useState(false);
  const { data: link } = useLink(linkId);
  const { mutateAsync: updateLink } = useUpdateLink(linkId, {
    supressToast: true,
  });

  async function handleTagsChange(newTags) {
    setIsSaving(true);
    try {
      await updateLink({ userTags: newTags });
    } catch (error) {
      console.error("Failed to update tags:", error);
    } finally {
      setIsSaving(false);
    }
  }

  if (!link) {
    return null;
  }

  return (
    <Box>
      <Flex alignItems="center" gap={3}>
        <Box flex="1">
          <TagEditor tags={link.userTags} onChange={handleTagsChange} />
        </Box>
        {isSaving && (
          <Flex alignItems="center" gap={2}>
            <Spinner size="xs" />
            <Text fontSize="xs" color="gray.500">
              Saving...
            </Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
