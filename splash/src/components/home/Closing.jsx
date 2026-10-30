import React from "react"
import {
  Box,
  Flex,
  Text,
  Heading,
  Container,
  Button,
  Link,
  SimpleGrid,
} from "@chakra-ui/react"

function LockGlyph(props) {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="5" h="5" fill="none" {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Box>
  )
}

function CodeGlyph(props) {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="5" h="5" fill="none" {...props}>
      <path
        d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  )
}

function Promise({ glyph, title, children }) {
  return (
    <Flex
      gap={4}
      align="flex-start"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="xl"
      p={6}
    >
      <Box color="brand.500" pt="2px" flexShrink={0}>
        {glyph}
      </Box>
      <Box>
        <Text fontWeight="semibold" color="gray.900" mb={1}>
          {title}
        </Text>
        <Text fontSize="sm" color="gray.700">
          {children}
        </Text>
      </Box>
    </Flex>
  )
}

export default function Closing() {
  return (
    <Box as="section" id="get-started" position="relative" zIndex={1}>
      <Container maxWidth="7xl" px={6} pt={{ base: 16, md: 24 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={{ base: 10, md: 14 }}>
          <Promise glyph={<LockGlyph />} title="Private by construction">
            We store the links you choose to save and nothing else. Data is
            encrypted at rest, never shared, and there are no tracking cookies,
            which is why there's no cookie banner.
          </Promise>
          <Promise glyph={<CodeGlyph />} title="Open source">
            The server, the web app, and the iOS app are all on{" "}
            <Link
              href="https://github.com/linksort/linksort"
              isExternal
              color="brand.500"
              fontWeight="semibold"
              textDecoration="underline"
              textUnderlineOffset="3px"
              textDecorationColor="brand.200"
              _hover={{ textDecorationColor: "brand.500" }}
            >
              GitHub
            </Link>
            . Read the code, run it yourself, or send a pull request.
          </Promise>
        </SimpleGrid>

        <Flex
          direction="column"
          align="center"
          textAlign="center"
          background="brand.500"
          color="white"
          borderRadius="xl"
          px={{ base: 6, md: 12 }}
          py={{ base: 12, md: 16 }}
        >
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "4xl" }}
            letterSpacing="-0.02em"
            mb={3}
          >
            Get started. It's free.
          </Heading>
          <Text maxW="34rem" fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" mb={8}>
            Linksort is actively developed, with new features coming out at a
            rapid clip. If you sign up now, it will always be free for you.
          </Text>
          <Button
            as="a"
            href="/sign-up"
            size="lg"
            px={10}
            bg="white"
            color="brand.600"
            _hover={{ bg: "brand.50" }}
            _active={{ bg: "brand.100" }}
          >
            Sign up
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}
