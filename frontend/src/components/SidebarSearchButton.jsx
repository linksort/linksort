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
import { Search2Icon } from "@chakra-ui/icons";

import { useSearch } from "../hooks/filters";

export default function SidebarSearchButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const focus = useRef();
  const { handleSearch } = useSearch();

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setQuery("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSearch(query);
    handleClose();
  }

  return (
    <Popover
      placement="right"
      isOpen={isOpen}
      onClose={handleClose}
      initialFocusRef={focus}
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Button
          variant={isOpen ? "solid" : "ghost"}
          width="100%"
          justifyContent="flex-start"
          paddingLeft="0.5rem"
          marginLeft="-0.5rem"
          color="gray.800"
          fontWeight="normal"
          letterSpacing="0.015rem"
          leftIcon={<Search2Icon />}
          onClick={handleOpen}
        >
          Search
        </Button>
      </PopoverTrigger>
      <PopoverContent borderRadius="xl" minWidth="26rem">
        <PopoverArrow />
        <PopoverBody padding={3}>
          <Flex as="form" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Type your query..."
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              ref={focus}
              borderRightRadius={["md", "none"]}
              required
            />
            <Button
              type="submit"
              colorScheme="brand"
              borderLeftRadius={["md", "none"]}
              paddingX={8}
            >
              Search
            </Button>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
