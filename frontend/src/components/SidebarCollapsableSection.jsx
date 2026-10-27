import React from "react";
import { Heading, Box, Collapse } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

import { useLocalStorage } from "../hooks/localStorage";

function SidebarSectionHeader({ children, ...rest }) {
  return (
    <Heading
      as="h4"
      fontSize="0.6875rem"
      fontWeight="semibold"
      letterSpacing="0.06em"
      color="gray.600"
      textTransform="uppercase"
      marginBottom={2.5}
      display="flex"
      alignItems="center"
      height="6"
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
      <SidebarSectionHeader
        as="button"
        type="button"
        width="100%"
        textAlign="left"
        aria-expanded={isOpen}
        aria-label={`${title}, ${isOpen ? "collapse" : "expand"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDownIcon
          position="absolute"
          right={6}
          top="3px"
          boxSize="4"
          color="gray.500"
          transition="transform ease 0.15s"
          transform={isOpen ? "" : "rotate(-90deg)"}
          aria-hidden="true"
        />
      </SidebarSectionHeader>
      <Collapse style={{ overflow: "unset" }} in={isOpen}>{children}</Collapse>
    </Box>
  );
}
