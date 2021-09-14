import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Flex,
  IconButton,
  Tooltip,
  Text,
  HStack,
  Link,
  Button,
  MenuButton,
  GridItem,
  Image,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, StarIcon } from "@chakra-ui/icons";

import { FolderIcon, StarBorderIcon } from "./CustomIcons";
import LinkItemFolderMenu from "./LinkItemFolderMenu";

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
          <Image
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
          <HStack>
            <LinkItemFolderMenu
              buttonSlot={
                isLinkInFolder ? (
                  <MenuButton
                    as={Button}
                    size="sm"
                    leftIcon={<FolderIcon />}
                    overflow="hidden"
                  >
                    <Text
                      as="span"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                    >
                      {currentFolderName}
                    </Text>
                  </MenuButton>
                ) : (
                  <Tooltip label="Add to folder">
                    <MenuButton
                      as={IconButton}
                      size="sm"
                      icon={<FolderIcon />}
                    />
                  </Tooltip>
                )
              }
              folderTree={folderTree}
              onMoveToFolder={onMoveToFolder}
            />
            <Tooltip label="Favorite link">
              <IconButton
                icon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                size="sm"
                onClick={onToggleIsFavorite}
              />
            </Tooltip>
            <Tooltip label="Edit link">
              <IconButton
                as={RouterLink}
                icon={<EditIcon />}
                to={`/links/${link.id}`}
                size="sm"
              />
            </Tooltip>
            <Tooltip label="Delete link">
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                onClick={onDeleteLink}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Box>
    </GridItem>
  );
}
