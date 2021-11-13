import React from "react";
import { Link as RouterLink, useRouteMatch } from "react-router-dom";
import {
  Flex,
  Box,
  Stack,
  Container,
  Heading,
  List,
  ListItem,
  Button,
} from "@chakra-ui/react";

import { HEADER_HEIGHT, FOOTER_HEIGHT } from "../theme/theme";
import Logo from "./Logo";
import MouseType from "./MouseType";

function NavItem({ to, children, isExternal }) {
  const defaultProps = {
    fontWeight: "medium",
    variant: "ghost",
    colorScheme: "gray",
  };

  if (isExternal) {
    return (
      <Button as="a" href={to} {...defaultProps}>
        {children}
      </Button>
    );
  }

  return (
    <Button as={RouterLink} to={to} {...defaultProps}>
      {children}
    </Button>
  );
}

// AuthLayout sets the layout for all of the pages that deal with
// authentication, such as SignIn, ForgotPassword, etc.
export default function AuthLayout({ children }) {
  const isSignIn = useRouteMatch("/sign-in");

  return (
    <Container maxWidth="7xl" px={6} position="relative">
      <Flex
        as="header"
        height={HEADER_HEIGHT}
        width="full"
        alignItems="center"
        justifyContent="space-between"
      >
        <Heading as="h1">
          <RouterLink to="/">
            <Logo />
          </RouterLink>
        </Heading>
        <Box as="nav">
          <Stack as={List} direction="row" spacing={1}>
            <ListItem display={["none", "none", "list-item"]}>
              <NavItem to="https://linksort.com/blog/idea" isExternal>
                About
              </NavItem>
            </ListItem>
            <ListItem>
              <NavItem to="https://linksort.com/blog" isExternal>
                Blog
              </NavItem>
            </ListItem>
            {isSignIn ? (
              <ListItem>
                <NavItem to="/sign-up">Sign up</NavItem>
              </ListItem>
            ) : (
              <ListItem>
                <NavItem to="/sign-in">Sign in</NavItem>
              </ListItem>
            )}
          </Stack>
        </Box>
      </Flex>
      <Box
        as="main"
        width="100%"
        maxWidth="100%"
        minHeight={["calc(100vh - 13rem)", "calc(100vh - 13rem)"]}
      >
        {children}
      </Box>
      <Flex
        as="footer"
        height={FOOTER_HEIGHT}
        justifyContent="center"
        alignItems="center"
      >
        <MouseType />
      </Flex>
    </Container>
  );
}
