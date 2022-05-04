import React from "react";
import { Flex, Link } from "@chakra-ui/react";

import LinkItemFavicon from "./LinkItemFavicon";
import { DotDotDotVert } from "./CustomIcons";
import LinkControlsMenu from "../components/LinkControlsMenu";

export default function LinkItemCondensed({ link }) {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      height={10}
      backgroundColor="gray.50"
      borderBottomColor="gray.200"
      borderBottomStyle="solid"
      borderBottomWidth={1}
      paddingX={2}
      maxWidth={["100%", "100%", "100%", "100%", "calc(100% - 2rem)", "100%"]}
      width="100%"
      flexGrow={0}
      overflow="hidden"
      transition="ease 200ms"
      borderLeft="3px solid transparent"
      _focusWithin={{
        borderLeft: "3px solid #80a9ff",
      }}
      _hover={{
        backgroundColor: "gray.100",
      }}
    >
      <Flex overflow="hidden">
        <LinkItemFavicon favicon={link.favicon} />
        <Link
          href={link.url}
          borderRadius="sm"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          _focus="none"
          isExternal
        >
          {link.title}
        </Link>
      </Flex>
      <LinkControlsMenu link={link} buttonSlot={<DotDotDotVert />} />
    </Flex>
  );
}
