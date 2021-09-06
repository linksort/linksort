import React, { useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  Button,
  Image,
  Box,
  Link,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Stack,
  HStack,
  AccordionIcon,
  Text,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";

import { useDeleteLink } from "../hooks/links";

function Bullet({ favicon }) {
  return (
    <Box
      height="1.3rem"
      width="1.3rem"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexShrink="0"
      marginRight={2}
    >
      {favicon ? (
        <Image
          height="100%"
          width="100%"
          src={favicon}
          fallbackSrc="/globe-favicon.png"
        />
      ) : (
        <Box dangerouslySetInnerHTML={{ __html: "&#x1F30F" }} />
      )}
    </Box>
  );
}

export default function LinkItem({ link }) {
  const closeButton = useRef();
  const mutation = useDeleteLink(link.id);

  function handleDeleteLink() {
    closeButton.current?.click();
    mutation.mutateAsync().catch(() => closeButton.current?.click());
  }

  return (
    <AccordionItem borderTop="unset" borderBottom="unset" key={link.id}>
      {({ isExpanded }) => (
        <>
          <Flex alignItems="center" height={10}>
            <Bullet favicon={link.favicon} />
            <Link
              href={link.url}
              borderRadius="sm"
              overflow="hidden"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              fontWeight={isExpanded ? "bold" : "normal"}
              isExternal
            >
              {link.title}
            </Link>
            <AccordionButton
              ref={closeButton}
              backgroundColor="gray.100"
              marginLeft={2}
              borderRadius="md"
              width="1.6rem"
              height="1.6rem"
              padding={0}
              alignItems="center"
              justifyContent="center"
              flexShrink="0"
            >
              {isExpanded ? (
                <AccordionIcon boxSize="1rem" />
              ) : (
                <HamburgerIcon boxSize="1rem" />
              )}
            </AccordionButton>
          </Flex>
          <AccordionPanel>
            <Box
              marginLeft="-0.4rem"
              paddingLeft={5}
              borderLeft="1px"
              borderLeftColor="gray.200"
              borderLeftStyle="dashed"
            >
              <Stack spacing={3}>
                <Text color="gray.800" maxWidth="60ch">
                  {link.description}
                </Text>
                <HStack spacing={2}>
                  <Button leftIcon={<DeleteIcon />} onClick={handleDeleteLink}>
                    Delete
                  </Button>
                  <Button
                    as={RouterLink}
                    to={`/links/${link.id}`}
                    leftIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                </HStack>
              </Stack>
            </Box>
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
}