import React from "react";
import { Flex, ListItem, Image, Text, Box, Link } from "@chakra-ui/react";

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
        <Image height="100%" width="100%" src={favicon} />
      ) : (
        <Box dangerouslySetInnerHTML={{ __html: "&#x1F30F" }} />
      )}
    </Box>
  );
}

export default function LinkItem({ link }) {
  return (
    <ListItem>
      <Flex alignItems="center">
        <Bullet favicon={link.favicon} />
        <Link
          href={link.url}
          borderRadius="sm"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          isExternal
        >
          {link.title}
        </Link>
      </Flex>
    </ListItem>
  );
}
