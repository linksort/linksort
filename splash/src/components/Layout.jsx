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
  Button,
} from "@chakra-ui/react"

import useScrollPosition from "../hooks/scroll"
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

export default function Layout({ children, isHomePage }) {
  const { y } = useScrollPosition()
  const showTransparent = y < 80 && isHomePage
  const logoColor = showTransparent ? "#fff" : "#0a52ff"
  const buttonColorscheme = showTransparent ? "whiteAlpha" : "gray"
  const buttonColor = showTransparent ? "white" : "gray.800"
  const signInButtonColorscheme = showTransparent ? "whiteAlpha" : "brand"
  const fixedProps = showTransparent
    ? {}
    : {
        backgroundColor: "white",
        borderBottomColor: "gray.100",
        borderBottomStyle: "solid",
        borderBottomWidth: "thin",
      }

  return (
    <>
      <Box
        position="fixed"
        top={0}
        left={0}
        width="100vw"
        zIndex="100"
        transition="all 0.2s ease"
        {...fixedProps}
      >
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
                <Logo color={logoColor} />
              </RouterLink>
            </Heading>
            <Box as="nav">
              <Stack as={List} direction="row" spacing={1}>
                <ListItem display={["none", "none", "list-item"]}>
                  <Button
                    as={RouterLink}
                    fontWeight="medium"
                    to="/"
                    variant="ghost"
                    colorScheme={buttonColorscheme}
                    color={buttonColor}
                  >
                    Home
                  </Button>
                </ListItem>
                <ListItem display={["none", "none", "list-item"]}>
                  <Button
                    as={RouterLink}
                    fontWeight="medium"
                    to="/blog/idea"
                    variant="ghost"
                    colorScheme={buttonColorscheme}
                    color={buttonColor}
                  >
                    About
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    as={RouterLink}
                    fontWeight="medium"
                    to="/blog"
                    variant="ghost"
                    colorScheme={buttonColorscheme}
                    color={buttonColor}
                  >
                    Blog
                  </Button>
                </ListItem>
                <ListItem display={["none", "none", "list-item"]}>
                  <Button
                    as="a"
                    fontWeight="medium"
                    href="/sign-in"
                    variant="ghost"
                    colorScheme={buttonColorscheme}
                    color={buttonColor}
                  >
                    Sign in
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    as="a"
                    fontWeight="medium"
                    href="/sign-up"
                    colorScheme={signInButtonColorscheme}
                  >
                    Sign up
                  </Button>
                </ListItem>
              </Stack>
            </Box>
          </Flex>
        </Container>
      </Box>
      <Box as="main" minHeight={["calc(100vh - 13rem)", "calc(100vh - 13rem)"]}>
        {children}
      </Box>
      <Container maxWidth="7xl" centerContent px={6}>
        <Flex as="footer" height={FOOTER_HEIGHT} alignItems="center">
          <Text align="center" color="gray.800">
            Copyright &copy; {new Date().getFullYear()} Linksort LLC &middot;{" "}
            <UnderlineLink to="/terms">Terms of service</UnderlineLink> &middot;{" "}
            <UnderlineLink to="/privacy">Privacy policy</UnderlineLink> &middot;{" "}
            <UnderlineLink href="/rss.xml">RSS</UnderlineLink> &middot;{" "}
            <UnderlineLink href="https://github.com/linksort/linksort">
              GitHub
            </UnderlineLink>
          </Text>
        </Flex>
      </Container>
    </>
  )
}
