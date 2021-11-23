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
import { HEADER_HEIGHT } from "../theme/theme"
import Logo from "./Logo"

const ACTIVE_NAV_ITEM_PROPS = {
  textDecoration: "underline",
  textUnderlineOffset: "2px",
}

export default function Layout({ children, location }) {
  const { pathname: pn } = location
  const pathname = pn.endsWith("/") ? pn.slice(0, pn.length - 1) : pn
  const isHomePage = pathname === ""
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
                    {...(isHomePage ? ACTIVE_NAV_ITEM_PROPS : {})}
                  >
                    Home
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    as={RouterLink}
                    fontWeight="medium"
                    to="/blog"
                    variant={"ghost"}
                    colorScheme={buttonColorscheme}
                    color={buttonColor}
                    {...(pathname === "/blog" ? ACTIVE_NAV_ITEM_PROPS : {})}
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
      <Box as="main">{children}</Box>
      <Box
        width="100%"
        marginTop="6rem"
        borderTop="1px"
        borderTopColor="gray.100"
        backgroundColor="gray.50"
      >
        <Container
          maxWidth="7xl"
          px={6}
          paddingBottom={["2rem", "2rem", "8rem"]}
          paddingTop={["2rem", "2rem", "4rem"]}
        >
          <Flex
            as="footer"
            width="100%"
            direction={["column", "column", "row"]}
            justifyContent="space-around"
          >
            <Box marginTop="-0.7rem" paddingBottom="3rem" fontSize="sm">
              <Logo color="#333" />
              <Text mb={1}>
                Copyright &copy; {new Date().getFullYear()} Linksort LLC.
              </Text>
              <Text>Made with ❤️ in Seattle, WA.</Text>
            </Box>

            <Stack
              direction={["column", "column", "row"]}
              fontSize="md"
              spacing={[6, 6, 6, "4rem"]}
            >
              <Stack as={List} spacing={2}>
                <ListItem>
                  <Heading as="h5" fontSize="md" fontWeight="semibold">
                    Legal
                  </Heading>
                </ListItem>
                <ListItem>
                  <Link as={RouterLink} to="/terms">
                    Terms of service
                  </Link>
                </ListItem>
                <ListItem>
                  <Link as={RouterLink} to="/privacy">
                    Privacy policy
                  </Link>
                </ListItem>
              </Stack>

              <Stack as={List} spacing={2}>
                <ListItem>
                  <Heading as="h5" fontSize="md" fontWeight="semibold">
                    Company
                  </Heading>
                </ListItem>
                <ListItem>
                  <Link as={RouterLink} to="/">
                    Home
                  </Link>
                </ListItem>
                <ListItem>
                  <Link as={RouterLink} to="/about">
                    About
                  </Link>
                </ListItem>
                <ListItem>
                  <Link as={RouterLink} to="/blog">
                    Blog
                  </Link>
                </ListItem>
                <ListItem>
                  <Link href="/rss.xml" isExternal>
                    RSS
                  </Link>
                </ListItem>
              </Stack>

              <Stack as={List} spacing={2}>
                <ListItem>
                  <Heading as="h5" fontSize="md" fontWeight="semibold">
                    Open Source
                  </Heading>
                </ListItem>
                <ListItem>
                  <Link href="https://github.com/linksort/linksort" isExternal>
                    GitHub
                  </Link>
                </ListItem>
              </Stack>
            </Stack>
          </Flex>
        </Container>
      </Box>
    </>
  )
}
