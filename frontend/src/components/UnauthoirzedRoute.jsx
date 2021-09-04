import React from "react";
import { Link as RouterLink, Route, Redirect } from "react-router-dom";
import { Flex, Box, Stack, Link, Container } from "@chakra-ui/react";

import Logo from "./Logo";
import MouseType from "./MouseType";
import { useUser } from "../api/auth";

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

export default function UnauthorizedRoute({ component: Component, ...rest }) {
  const user = useUser();

  return (
    <Container maxWidth="7xl" px={6} position="relative">
      <Flex
        as="header"
        height={[24, 32]}
        width="full"
        alignItems="center"
        justifyContent="space-between"
      >
        <RouterLink to="/">
          <Logo htmlWidth="100rem" />
        </RouterLink>
        <Stack direction="row" as="nav" spacing={4}>
          <UnderlineLink to="https://linksort.com/blog" isExternal>
            Blog
          </UnderlineLink>
          <UnderlineLink to="/sign-in">Sign in</UnderlineLink>
          <UnderlineLink to="/sign-up">Sign up</UnderlineLink>
        </Stack>
      </Flex>
      <Box
        as="main"
        width="100%"
        maxWidth="100%"
        minHeight={["calc(100vh - 14rem)", "calc(100vh - 16rem)"]}
      >
        <Route
          {...rest}
          render={() => {
            if (!user) {
              return <Component />;
            } else {
              return <Redirect to="/" />;
            }
          }}
        />
      </Box>
      <Flex as="footer" height={32} justifyContent="center" alignItems="center">
        <MouseType />
      </Flex>
    </Container>
  );
}
