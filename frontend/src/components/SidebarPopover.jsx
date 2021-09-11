import React, { useRef, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Button,
  Input,
  Flex,
} from "@chakra-ui/react";

import SidebarButton from "./SidebarButton";

export default function SidebarPopover({
  onSubmit,
  buttonText,
  buttonIcon: ButtonIcon,
  placeholder,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const focus = useRef();

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setQuery("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(query);
    handleClose();
  }

  return (
    <Popover
      placement="right"
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBlur={true}
      initialFocusRef={focus}
    >
      <PopoverTrigger>
        <SidebarButton
          variant={isOpen ? "solid" : "ghost"}
          leftIcon={<ButtonIcon />}
          onClick={handleOpen}
        >
          {buttonText}
        </SidebarButton>
      </PopoverTrigger>
      <PopoverContent borderRadius="xl" minWidth="26rem">
        <PopoverArrow />
        <PopoverBody padding={3}>
          <Flex as="form" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder={placeholder}
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              borderRightRadius={["md", "none"]}
              ref={focus}
              required
            />
            <Button
              type="submit"
              colorScheme="brand"
              borderLeftRadius={["md", "none"]}
              paddingX={8}
            >
              {buttonText}
            </Button>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
