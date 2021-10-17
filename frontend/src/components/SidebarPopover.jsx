import React, { useRef, useState } from "react";
import {
  Button,
  Input,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
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
    <>
      <SidebarButton
        variant={isOpen ? "solid" : "ghost"}
        leftIcon={<ButtonIcon />}
        onClick={handleOpen}
      >
        {buttonText}
      </SidebarButton>

      <Modal isOpen={isOpen} onClose={handleClose} initialFocusRef={focus}>
        <ModalOverlay />
        <ModalContent marginX={4}>
          <Flex as="form" onSubmit={handleSubmit} padding={4}>
            <Input
              type="text"
              placeholder={placeholder}
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              borderRightRadius={["none"]}
              ref={focus}
              required
            />
            <Button
              type="submit"
              colorScheme="brand"
              borderLeftRadius={["none"]}
              paddingX={8}
            >
              {buttonText}
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
