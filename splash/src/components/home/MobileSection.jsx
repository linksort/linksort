import React from "react"
import { Phone } from "./Devices"
import {
  Box,
  Flex,
  Text,
  Heading,
  Container,
  Link,
  Stack,
  List,
  ListItem,
} from "@chakra-ui/react"

const APP_STORE_URL = "https://apps.apple.com/app/id1595209987"

function CheckGlyph(props) {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="4" h="4" fill="none" flexShrink={0} {...props}>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  )
}

const POINTS = [
  "Share any link from any app.",
  "Use the Safari extension on iPhone and iPad.",
  "Chat with the assistant, browse the graph, and read saved articles.",
]

export default function MobileSection({ images }) {
  return (
    <Box
      as="section"
      id="ios"
      position="relative"
      zIndex={1}
      overflow="hidden"
      color="white"
    >
      {/* The hero's fade, angled the same way, so the page closes in the color it opened with. */}
      <Box
        aria-hidden="true"
        position="absolute"
        inset="-12% -10%"
        background="linear-gradient(160deg, rgb(10, 82, 255), #e2aeee)"
        transform="rotate(-3deg)"
        zIndex={-1}
      />
      <Container maxWidth="7xl" px={6} py={{ base: 16, md: 24 }}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 12, lg: 20 }}
          align="center"
        >
          <Box flex="1" maxW="34rem">
            <Heading
              as="h2"
              fontSize={{ base: "2xl", md: "4xl" }}
              letterSpacing="-0.02em"
              color="white"
              mb={4}
            >
              Now on iPhone and iPad.
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" mb={6}>
              A native iOS app with everything the web app does. It's on its way to the App Store now.
            </Text>
            <Stack as={List} spacing={3} mb={8}>
              {POINTS.map((p) => (
                <Flex as={ListItem} key={p} gap={3} align="flex-start">
                  <Box color="white" pt="3px">
                    <CheckGlyph />
                  </Box>
                  <Text color="whiteAlpha.900">{p}</Text>
                </Flex>
              ))}
            </Stack>
            <Text fontSize="sm" color="whiteAlpha.900">
              Sign up on the web first, then sign in on your phone.{" "}
              <Link
                href={APP_STORE_URL}
                isExternal
                color="white"
                fontWeight="semibold"
                textDecoration="underline"
                textUnderlineOffset="3px"
                textDecorationColor="whiteAlpha.600"
                _hover={{ textDecorationColor: "white" }}
              >
                Find Linksort on the App Store
              </Link>
              .
            </Text>
          </Box>

          <Flex
            flex="1"
            w="100%"
            justify="center"
            align="flex-start"
            gap={{ base: 4, md: 8 }}
          >
            <Phone
              image={images.iphoneDetail}
              w={{ base: "46%", md: "42%" }}
              maxW="17rem"
              boxShadow="0 24px 48px -16px rgba(0, 16, 51, 0.45)"
            />
            <Phone
              image={images.iphoneCondensed}
              w={{ base: "46%", md: "42%" }}
              maxW="17rem"
              mt={{ base: 10, md: 16 }}
              boxShadow="0 24px 48px -16px rgba(0, 16, 51, 0.45)"
            />
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
