import React from "react";
import { Box, Flex, Text, Link, GridItem } from "@chakra-ui/react";

import FadeInImage from "./FadeInImage";
import LinkItemControls from "./LinkItemControls";

const COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "cyan",
  "purple",
  "pink",
];

function Color({ id }) {
  const idx = parseInt(id, 16) % 9;
  const color = COLORS[idx];

  return <Box width="100%" height="100%" backgroundColor={`${color}.100`} />;
}

export default function LinkItemTile({
  link,
  folderTree,
  isLinkInFolder,
  currentFolderName,
  onDeleteLink,
  onToggleIsFavorite,
  onMoveToFolder,
  onCopyLink,
}) {
  return (
    <GridItem
      height="18rem"
      borderRadius="xl"
      boxShadow="lg"
      border="thin"
      borderStyle="solid"
      borderColor="gray.100"
      overflow="hidden"
      transition="background-color ease 0.2s"
      _hover={{ backgroundColor: "blackAlpha.25" }}
    >
      <Box>
        <Box height="10rem">
          <FadeInImage
            src={link.image}
            width="full"
            height="10rem"
            objectFit="cover"
            fallback={<Color id={link.id} />}
          />
        </Box>
        <Flex
          direction="column"
          justifyContent="space-between"
          paddingTop={2}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
          height="8rem"
          borderTop="thin"
          borderTopColor="gray.100"
          borderTopStyle="solid"
        >
          <Box overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            <Link href={link.url} isExternal>
              <Text as="span" fontWeight="semibold" title={link.title}>
                {link.title}
              </Text>
            </Link>
            <Text fontSize="sm" title={link.site}>
              {link.site}
            </Text>
          </Box>
          <LinkItemControls
            link={link}
            folderTree={folderTree}
            isLinkInFolder={isLinkInFolder}
            currentFolderName={currentFolderName}
            onDeleteLink={onDeleteLink}
            onToggleIsFavorite={onToggleIsFavorite}
            onMoveToFolder={onMoveToFolder}
            onCopyLink={onCopyLink}
          />
        </Flex>
      </Box>
    </GridItem>
  );
}
