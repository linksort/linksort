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
} from "@chakra-ui/react"

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
        height={24}
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
          <List>
            <ListItem>
              <Link as={RouterLink} fontWeight="medium" to="/blog">
                Blog
              </Link>
            </ListItem>
          </List>
        </Box>
      </Flex>
      <Box
        as="main"
        maxWidth="3xl"
        minHeight={["calc(100vh - 14rem)", "calc(100vh - 16rem)"]}
      >
        {children}
      </Box>
      <Flex as="footer" height={32} alignItems="center">
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
