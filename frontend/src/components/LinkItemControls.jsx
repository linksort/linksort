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
import { DeleteIcon, EditIcon, LinkIcon, StarIcon } from "@chakra-ui/icons";

import { FolderIcon, StarBorderIcon } from "./CustomIcons";
import LinkItemFolderMenu from "./LinkItemFolderMenu";

export default function LinkItemControls({
  link,
  folderTree,
  isLinkInFolder,
  currentFolderName,
  onDeleteLink,
  onToggleIsFavorite,
  onMoveToFolder,
  onCopyLink,
  buttonSpacing = 2,
  buttonColor = "gray.100",
  buttonFolderIconPlacement = "left",
  ...rest
}) {
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
        onMoveToFolder={onMoveToFolder}
      />
      <Tooltip label="Favorite link">
        <IconButton
          backgroundColor={buttonColor}
          icon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
          size="sm"
          onClick={onToggleIsFavorite}
          _focus="none"
        />
      </Tooltip>
      <Tooltip label="Copy link">
        <IconButton
          backgroundColor={buttonColor}
          icon={<LinkIcon />}
          size="sm"
          onClick={onCopyLink}
          _focus="none"
        />
      </Tooltip>
      <Tooltip label="Edit link">
        <IconButton
          backgroundColor={buttonColor}
          as={RouterLink}
          icon={<EditIcon />}
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
          onClick={onDeleteLink}
          _focus="none"
        />
      </Tooltip>
    </HStack>
  );
}
