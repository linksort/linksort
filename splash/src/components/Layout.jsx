import React from "react"
import { Link as RouterLink } from "gatsby"
import {
  Container,
  Flex,
  Box,
  Heading,
  Text,
  List,
  ListItem,
  Link,
  Stack,
  Tag,
} from "@chakra-ui/react"

import { HEADER_HEIGHT, FOOTER_HEIGHT } from "../theme/theme"
import Logo from "./Logo"

function UnderlineLink({ to, href, children }) {
  const sx = {
    whiteSpace: "nowrap",
  }

  if (to) {
    return (
      <Link as={RouterLink} to={to} sx={sx}>
        {children}
      </Link>
    )
  }

  return (
    <Link href={href} sx={sx} isExternal>
      {children}
    </Link>
  )
}

export default function Layout({ children }) {
  return (
    <Container maxWidth="7xl" centerContent px={6}>
      <Flex
        as="header"
        height={HEADER_HEIGHT}
        width="full"
        alignItems="center"
        justifyContent="space-between"
      >
        <Heading
          as="h1"
          fontSize="md"
          fontWeight="normal"
          _hover={{ textDecoration: "underline" }}
        >
          <RouterLink to="/">
            <Logo />
          </RouterLink>
        </Heading>
        <Box as="nav">
          <Stack as={List} direction="row" spacing={4}>
            <ListItem>
              <Link as={RouterLink} fontWeight="medium" to="/blog/idea">
                About
              </Link>
            </ListItem>
            <ListItem>
              <Link as={RouterLink} fontWeight="medium" to="/blog">
                Blog
              </Link>
            </ListItem>
            <ListItem display="flex" alignItems="center">
              <Link fontWeight="medium" href="/sign-in">
                Sign in
              </Link>
              <Tag
                size="sm"
                minHeight="unset"
                minWidth="unset"
                fontSize="0.6rem"
                fontWeight="bold"
                padding="0.2rem"
                variant="solid"
                colorScheme="brand"
                top="-0.4rem"
                right="-2.0rem"
                ml={1}
              >
                BETA
              </Tag>
            </ListItem>
          </Stack>
        </Box>
      </Flex>
      <Box
        as="main"
        maxWidth="3xl"
        minHeight={["calc(100vh - 13rem)", "calc(100vh - 13rem)"]}
      >
        {children}
      </Box>
      <Flex as="footer" height={FOOTER_HEIGHT} alignItems="center">
        <Text align="center">
          Copyright &copy; {new Date().getFullYear()} Linksort LLC &middot;{" "}
          <UnderlineLink to="/terms">Terms of service</UnderlineLink> &middot;{" "}
          <UnderlineLink to="/privacy">Privacy policy</UnderlineLink> &middot;{" "}
          <UnderlineLink href="/rss.xml">RSS</UnderlineLink>
        </Text>
      </Flex>
    </Container>
  )
}
