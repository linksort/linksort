import React from "react"
import GatsbyImage from "gatsby-image"
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

function Phone({ image, ...rest }) {
  return (
    <Box bg="gray.900" borderRadius="2.75rem" p="2.5%" {...rest}>
      <Box borderRadius="2.25rem" overflow="hidden" bg="white">
        <GatsbyImage fluid={image} />
      </Box>
    </Box>
  )
}

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
  "Share any link from any app. Safari, Mail, Messages, YouTube: the share sheet has a Linksort button.",
  "A Safari extension on iPhone and iPad for saving the page you're reading without leaving it.",
  "The same account and the same collection as the web. Save on your phone, find it at your desk.",
  "Chat with the assistant, browse the graph, and read saved articles on the go.",
]

export default function MobileSection({ images }) {
  return (
    <Box
      as="section"
      id="ios"
      bg="gray.50"
      borderTop="1px solid"
      borderTopColor="gray.100"
      borderBottom="1px solid"
      borderBottomColor="gray.100"
      position="relative"
      zIndex={1}
      overflow="hidden"
    >
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
              color="gray.900"
              mb={4}
            >
              Now on iPhone and iPad.
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" mb={6}>
              A native app, not a wrapped website, with everything the web app
              does. It's on its way to the App Store now.
            </Text>
            <Stack as={List} spacing={3} mb={8}>
              {POINTS.map((p) => (
                <Flex as={ListItem} key={p} gap={3} align="flex-start">
                  <Box color="brand.500" pt="3px">
                    <CheckGlyph />
                  </Box>
                  <Text color="gray.700">{p}</Text>
                </Flex>
              ))}
            </Stack>
            <Text fontSize="sm" color="gray.600">
              Sign up on the web first, then sign in on your phone.{" "}
              <Link
                href={APP_STORE_URL}
                isExternal
                color="brand.500"
                fontWeight="semibold"
                textDecoration="underline"
                textUnderlineOffset="3px"
                textDecorationColor="brand.200"
                _hover={{ textDecorationColor: "brand.500" }}
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
            <Phone image={images.iphoneDetail} w={{ base: "46%", md: "42%" }} maxW="17rem" />
            <Phone
              image={images.iphoneCondensed}
              w={{ base: "46%", md: "42%" }}
              maxW="17rem"
              mt={{ base: 10, md: 16 }}
            />
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
