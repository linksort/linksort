import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  IconButton,
  Tooltip,
  Text,
  HStack,
  Button,
  MenuButton,
} from "@chakra-ui/react";
import { DeleteIcon, LinkIcon, StarIcon, ViewIcon } from "@chakra-ui/icons";

import { FolderIcon, StarBorderIcon } from "./CustomIcons";
import LinkItemFolderMenu from "./LinkItemFolderMenu";
import { useFolders } from "../hooks/folders";
import { useLinkOperations } from "../hooks/links";

export default function LinkItemControls({
  link,
  buttonSpacing = 2,
  buttonColor = "gray.100",
  buttonFolderIconPlacement = "left",
  ...rest
}) {
  const {
    handleDeleteLink,
    isDeleting,
    handleToggleIsFavorite,
    isFavoriting,
    handleMoveToFolder,
    handleCopyLink,
  } = useLinkOperations(link);
  const { folderTree, resolveFolderName } = useFolders();
  const isLinkInFolder = link.folderId !== "root" && link.folderId.length > 0;
  const currentFolderName = resolveFolderName(link.folderId, "");

  const folderIconProps =
    buttonFolderIconPlacement === "left"
      ? {
          leftIcon: <FolderIcon />,
        }
      : {
          rightIcon: <FolderIcon />,
        };

  return (
    <HStack overflow="hidden" spacing={buttonSpacing} flexShrink={0} {...rest}>
      <LinkItemFolderMenu
        isLinkInFolder={isLinkInFolder}
        link={link}
        buttonSlot={
          isLinkInFolder && currentFolderName !== "" ? (
            <MenuButton
              as={Button}
              backgroundColor={buttonColor}
              size="sm"
              maxWidth={[24, 24, 48, 48]}
              width="100%"
              overflow="hidden"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              _focus="none"
              {...folderIconProps}
            >
              <Text
                as="span"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                display="block"
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
                backgroundColor={buttonColor}
                _focus="none"
              />
            </Tooltip>
          )
        }
        folderTree={folderTree}
        onMoveToFolder={handleMoveToFolder}
      />
      <Tooltip label="Favorite link">
        <IconButton
          backgroundColor={buttonColor}
          icon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
          size="sm"
          onClick={handleToggleIsFavorite}
          isLoading={isFavoriting}
          _focus="none"
        />
      </Tooltip>
      <Tooltip label="Copy link">
        <IconButton
          backgroundColor={buttonColor}
          icon={<LinkIcon />}
          size="sm"
          onClick={handleCopyLink}
          _focus="none"
        />
      </Tooltip>
      <Tooltip label="View details">
        <IconButton
          backgroundColor={buttonColor}
          as={RouterLink}
          icon={<ViewIcon />}
          to={`/links/${link.id}`}
          size="sm"
          _focus="none"
        />
      </Tooltip>
      <Tooltip label="Delete link">
        <IconButton
          backgroundColor={buttonColor}
          icon={<DeleteIcon />}
          size="sm"
          onClick={handleDeleteLink}
          isLoading={isDeleting}
          _focus="none"
        />
      </Tooltip>
    </HStack>
  );
}
