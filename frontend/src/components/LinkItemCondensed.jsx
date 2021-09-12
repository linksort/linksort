import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  Button,
  Box,
  Link,
  Stack,
  HStack,
  Text,
  MenuButton,
  useDisclosure,
  Collapse,
  IconButton,
} from "@chakra-ui/react";
import {
  CloseIcon,
  DeleteIcon,
  EditIcon,
  HamburgerIcon,
  StarIcon,
} from "@chakra-ui/icons";

import LinkItemFavicon from "./LinkItemFavicon";
import LinkItemFolderMenu from "./LinkItemFolderMenu";
import { FolderIcon } from "./CustomIcons";

export default function LinkItemCondensed({
  link,
  folderTree,
  isLinkInFolder,
  currentFolderName,
  onDeleteLink,
  onToggleIsFavorite,
  onMoveToFolder,
}) {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <>
      <Flex alignItems="center" height={10}>
        <LinkItemFavicon favicon={link.favicon} />
        <Link
          href={link.url}
          borderRadius="sm"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          fontWeight={isOpen ? "bold" : "normal"}
          isExternal
        >
          {link.title}
        </Link>
        <IconButton
          marginLeft={2}
          size="xs"
          aria-label={isOpen ? "Close options" : "Open options"}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon boxSize="1rem" />}
          onClick={onToggle}
        />
      </Flex>
      <Collapse in={isOpen}>
        <Box
          marginLeft={2}
          marginBottom={6}
          marginTop={2}
          paddingLeft={5}
          borderLeft="1px"
          borderLeftColor="gray.200"
          borderLeftStyle="dashed"
        >
          <Stack spacing={3}>
            <Text color="gray.800" maxWidth="60ch">
              {link.description}
            </Text>
            <HStack spacing={2}>
              <Button leftIcon={<DeleteIcon />} onClick={onDeleteLink}>
                Delete
              </Button>
              <Button
                as={RouterLink}
                to={`/links/${link.id}`}
                leftIcon={<EditIcon />}
              >
                Edit
              </Button>
              <LinkItemFolderMenu
                buttonSlot={
                  <MenuButton as={Button} leftIcon={<FolderIcon />}>
                    {isLinkInFolder ? currentFolderName : "Add to folder"}
                  </MenuButton>
                }
                folderTree={folderTree}
                onMoveToFolder={onMoveToFolder}
              />
              <Button
                leftIcon={link.isFavorite ? <StarIcon /> : null}
                onClick={onToggleIsFavorite}
              >
                Favorite
              </Button>
            </HStack>
          </Stack>
        </Box>
      </Collapse>
    </>
  );
}
