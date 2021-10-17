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
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, StarIcon } from "@chakra-ui/icons";

import { FolderIcon, StarBorderIcon } from "./CustomIcons";
import LinkItemFavicon from "./LinkItemFavicon";
import LinkItemFolderMenu from "./LinkItemFolderMenu";

export default function LinkItemTall({
  link,
  folderTree,
  isLinkInFolder,
  currentFolderName,
  onDeleteLink,
  onToggleIsFavorite,
  onMoveToFolder,
}) {
  return (
    <Flex
      padding={4}
      borderRadius="lg"
      border="thin"
      borderStyle="dashed"
      borderColor="gray.200"
      marginBottom={4}
      alignItems="center"
      transition="background-color ease 0.2s"
      _hover={{ backgroundColor: "brand.25" }}
    >
      <LinkItemFavicon
        favicon={link.favicon}
        display={["none", "none", "flex", "flex"]}
      />
      <Flex
        justifyContent="space-between"
        alignItems="center"
        width="full"
        direction={["column", "column", "row", "row"]}
      >
        <Box marginLeft={[0, 0, 2, 2]}>
          <Link href={link.url} isExternal>
            <Text as="span" fontWeight="semibold">
              {link.title}
            </Text>
          </Link>
          <Text fontSize="sm">{link.site}</Text>
        </Box>
        <Flex
          justifyContent="space-between"
          width={["100%", "100%", "auto", "auto"]}
          alignItems="center"
          marginTop={[4, 4, 0, 0]}
          overflow="hidden"
          flexShrink={0}
        >
          <LinkItemFavicon
            favicon={link.favicon}
            display={["flex", "flex", "none", "none"]}
          />
          <HStack>
            <LinkItemFolderMenu
              buttonSlot={
                isLinkInFolder ? (
                  <MenuButton
                    as={Button}
                    size="sm"
                    leftIcon={<FolderIcon />}
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                    maxWidth={[24, 24, 48, 48]}
                  >
                    {currentFolderName}
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
      </Flex>
    </Flex>
  );
}
