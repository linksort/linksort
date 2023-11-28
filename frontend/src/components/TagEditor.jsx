import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { Box, Button, IconButton, Input, Text, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

export default function TagEditor({ tags, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  function handleNewTagNameChange(e) {
    let newName = "";

    e.target.value.split("").forEach((char) => {
      // Only allow alphanumeric characters
      if (/[a-z0-9\-]/.test(char)) {
        newName += char;
      }
    });

    setNewTagName(newName);
  }

  function handleAddTag(e) {
    e.preventDefault();

    if (newTagName) {
      onChange([...tags, newTagName]);
    }

    setNewTagName("");
    setIsEditing(false);
  }

  function handleRemoveTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isEditing) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setNewTagName("");
          setIsEditing(false);
          break;
        case "Enter":
          e.preventDefault();
          handleAddTag(e);
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <Box>
      <Wrap>
        {tags.map((tag) => (
          <WrapItem key={tag}>
            <Button as={"div"} size={"sm"}>
              <Text mr={1}>{tag}</Text>
              <IconButton
                variant="inherit"
                size="xs"
                icon={<CloseIcon />}
                onClick={handleRemoveTag.bind(this, tag)} />
            </Button>
          </WrapItem>
        ))}
        <WrapItem key="add-tag-button">
          {isEditing ? (
            <Button as="div" size="sm" colorScheme="gray" paddingX={1}>
              <Input
                placeholder="Type your tag name"
                size="xs"
                autoFocus
                value={newTagName}
                onChange={handleNewTagNameChange}
                borderRadius="md"
                background="white" />
              <IconButton
                variant="inherit"
                size="xs"
                icon={<CheckIcon />}
                onClick={handleAddTag} />
            </Button>
          ) : (
            <Button size="sm" colorScheme="brand" onClick={() => setIsEditing(true)}>Add Tag</Button>
          )}
        </WrapItem>
      </Wrap>
    </Box>
  )
}
