import React from "react";
import { Box, Flex, Text, Link } from "@chakra-ui/react";

import LinkItemFavicon from "./LinkItemFavicon";
import LinkItemControls from "./LinkItemControls";

export default function LinkItemTall({ link }) {
  return (
    <Flex
      padding={4}
      borderRadius="lg"
      border="thin"
      borderStyle="dashed"
      borderColor="gray.200"
      marginBottom={4}
      alignItems="center"
      transition="background-color ease 0.2s"
      _hover={{ backgroundColor: "brand.25" }}
    >
      <LinkItemFavicon
        favicon={link.favicon}
        display={["none", "none", "flex", "flex"]}
      />
      <Flex
        justifyContent="space-between"
        alignItems={["flex-start", "flex-start", "center", "center"]}
        width="full"
        direction={["column", "column", "row", "row"]}
      >
        <Box marginLeft={[0, 0, 2, 2]} marginRight={[2, 2, 0, 0]}>
          <Link href={link.url} isExternal _focus={{ boxShadow: "none" }}>
            <Text as="span" fontWeight="semibold">
              {link.title}
            </Text>
          </Link>
          <Text fontSize="sm">{link.site}</Text>
        </Box>
        <Flex
          justifyContent="space-between"
          width={["100%", "100%", "auto", "auto"]}
          alignItems="center"
          marginTop={[4, 4, 0, 0]}
          overflow="hidden"
          flexShrink={0}
        >
          <LinkItemFavicon
            favicon={link.favicon}
            display={["flex", "flex", "none", "none"]}
          />
          <LinkItemControls link={link} />
        </Flex>
      </Flex>
    </Flex>
  );
}
