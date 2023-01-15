import React from "react";
import { Link as BrowserLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";

function GetExtLink({ imgSrc, name, url }) {
  return (
    <LinkBox>
      <Flex
        backgroundColor="brand.50"
        borderRadius={8}
        paddingLeft={2}
        paddingRight={6}
        paddingTop={2}
        paddingBottom={2}
        transition="ease 0.1s"
        _hover={{
          backgroundColor: "brand.100",
        }}
      >
        <Image src={imgSrc} height="64px" width="64px" />
        <Flex justifyContent="center" flexDirection="column" marginLeft={2}>
          <Heading as="h6" fontSize="md">
            <LinkOverlay href={url} target="_blank">
              {name}
            </LinkOverlay>
          </Heading>
          <Text fontSize="sm">Version 0.1</Text>
        </Flex>
      </Flex>
    </LinkBox>
  );
}

export default function Extensions() {
  return (
    <Stack padding={6} spacing={6} maxWidth="5xl" marginX="auto">
      <Heading marginBottom={0} fontSize="3xl" fontWeight="medium">
        Browser Extension
      </Heading>
      <Text>
        Linksort's browser extension allows you to save webpages to Linksort in
        one click. Choose any of the following to install.
      </Text>
      <Stack direction={["column", "column", "row"]}>
        <GetExtLink
          name="Chrome"
          imgSrc="/chrome-128x128.png"
          url="https://chrome.google.com/webstore/detail/linksort/kihaljlbpfihdkajmmkmlkpjpipcabcn"
        />
        <GetExtLink
          name="Brave"
          imgSrc="/brave-128x128.png"
          url="https://chrome.google.com/webstore/detail/linksort/kihaljlbpfihdkajmmkmlkpjpipcabcn"
        />
        <GetExtLink
          name="Firefox"
          imgSrc="/firefox-128x128.png"
          url="https://addons.mozilla.org/en-US/firefox/addon/linksort/"
        />
        <GetExtLink
          name="Safari"
          imgSrc="/safari-128x128.png"
          url="https://linksort.com/blog/safari"
        />
      </Stack>
      <Image src="/extensions.png" borderRadius={12} />
      <Box>
        <Button as={BrowserLink} to="/">
          Go back
        </Button>
      </Box>
    </Stack>
  );
}
