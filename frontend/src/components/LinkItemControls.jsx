import React from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import {
  IconButton,
  Tooltip,
  Text,
  HStack,
  Button,
  MenuButton,
  Menu,
  Portal,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import {
  DeleteIcon,
  EditIcon,
  LinkIcon,
  StarIcon,
  ViewIcon,
} from "@chakra-ui/icons";

import { DotDotDotVert, FolderIcon, StarBorderIcon } from "./CustomIcons";
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
  const history = useHistory();
  const {
    handleDeleteLink,
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
      <Menu isLazy>
        <Tooltip label="More">
          <MenuButton>
            <IconButton
              as="div"
              backgroundColor={buttonColor}
              icon={<DotDotDotVert />}
              size="sm"
              _focus="none"
            />
          </MenuButton>
        </Tooltip>
        <Portal>
          <MenuList>
            <MenuItem icon={<LinkIcon />} onClick={handleCopyLink}>
              Copy link
            </MenuItem>
            <MenuItem
              icon={<EditIcon />}
              onClick={() => history.push(`/links/${link.id}/update`)}
            >
              Edit
            </MenuItem>
            <MenuItem icon={<DeleteIcon />} onClick={handleDeleteLink}>
              Delete
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </HStack>
  );
}
