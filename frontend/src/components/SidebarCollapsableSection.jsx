import React, { useState } from "react";
import { Heading, Box, Collapse } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

import { useLocalStorage } from "../hooks/localStorage";

function SidebarSectionHeader({ children, ...rest }) {
  return (
    <Heading
      as="h4"
      fontSize="0.7rem"
      fontWeight="bold"
      color="gray.600"
      textTransform="uppercase"
      marginBottom={4}
      position="relative"
      cursor="pointer"
      {...rest}
    >
      {children}
    </Heading>
  );
}

export default function SidebarCollapsableSection({ title, children }) {
  const key = `sidebar-section-${title.replace(" ", "-")}`;
  const [isOpen, setIsOpen] = useLocalStorage(key, true);

  return (
    <Box>
      <SidebarSectionHeader onClick={() => setIsOpen(!isOpen)}>
        {title}
        <ChevronDownIcon
          position="absolute"
          right={6}
          top={0}
          fontSize="large"
          transition="ease 0.1s"
          transform={isOpen ? "" : "rotate(90deg)"}
        />
      </SidebarSectionHeader>
      <Collapse in={isOpen}>{children}</Collapse>
    </Box>
  );
}
