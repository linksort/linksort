import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Flex,
  Box,
  Stack,
  Link,
  Container,
  Heading,
  List,
  ListItem,
} from "@chakra-ui/react";

import { HEADER_HEIGHT, FOOTER_HEIGHT } from "../theme/theme";
import Logo from "./Logo";
import MouseType from "./MouseType";

function UnderlineLink({ to, children, isExternal }) {
  const defaultProps = {
    fontWeight: "medium",
    borderRadius: "sm",
  };

  if (isExternal) {
    return (
      <Link href={to} isExternal {...defaultProps}>
        {children}
      </Link>
    );
  }

  return (
    <Link as={RouterLink} to={to} {...defaultProps}>
      {children}
    </Link>
  );
}

// AuthLayout sets the layout for all of the pages that deal with
// authentication, such as SignIn, ForgotPassword, etc.
export default function AuthLayout({ children }) {
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
          <Stack as={List} direction="row" spacing={4}>
            <ListItem>
              <UnderlineLink to="https://linksort.com/blog/idea" isExternal>
                About
              </UnderlineLink>
            </ListItem>
            <ListItem>
              <UnderlineLink to="https://linksort.com/blog" isExternal>
                Blog
              </UnderlineLink>
            </ListItem>
            <ListItem>
              <UnderlineLink to="/sign-in">Sign in</UnderlineLink>
            </ListItem>
            {/* <UnderlineLink to="/sign-up">Sign up</UnderlineLink> */}
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
