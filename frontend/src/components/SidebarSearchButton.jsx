import React, { useRef, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
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
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSearch(query);
    handleClose();
  }

  return (
    <Popover
      placement="right-end"
      isOpen={isOpen}
      onClose={handleClose}
      initialFocusRef={focus}
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Button
          variant="ghost"
          width="100%"
          justifyContent="flex-start"
          paddingLeft="0.5rem"
          marginLeft="-0.5rem"
          color="gray.800"
          fontWeight="medium"
          letterSpacing="0.01rem"
          leftIcon={<Search2Icon />}
          onClick={handleOpen}
        >
          Search
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <Flex as="form" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Search..."
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
            >
              Submit
            </Button>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
