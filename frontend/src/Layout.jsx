import React from "react";
import { Link } from "react-router-dom";
import { Container, Flex, Box, Heading, Text, Stack } from "@chakra-ui/react";

import { useSignOut, useUser } from "./api/auth";

function UnderlineLink({ to, href, children }) {
  const sx = {
    whiteSpace: "nowrap",
    "&:hover": {
      textDecoration: "underline",
    },
  };

  if (to) {
    return (
      <Text as={Link} to={to} sx={sx}>
        {children}
      </Text>
    );
  }

  return (
    <Text as="a" href={href} sx={sx}>
      {children}
    </Text>
  );
}

export default function Layout({ children }) {
  const user = useUser();
  const signOutMutation = useSignOut();

  return (
    <Container maxWidth="7xl" centerContent px={6}>
      <Flex
        as="header"
        height={[24, 32]}
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
          <Link to="/">Linksort</Link>
        </Heading>
        <Stack direction="row" as="nav" spacing={6}>
          <UnderlineLink href="/blog">Blog</UnderlineLink>
          {user ? (
            <Text as="button" onClick={signOutMutation.mutate}>
              Sign out
            </Text>
          ) : (
            <>
              <UnderlineLink to="/sign-in">Sign in</UnderlineLink>
              <UnderlineLink to="/sign-up">Sign up</UnderlineLink>
            </>
          )}
        </Stack>
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
          <UnderlineLink href="/terms">Terms of service</UnderlineLink> &middot;{" "}
          <UnderlineLink href="/privacy">Privacy policy</UnderlineLink> &middot;{" "}
          <UnderlineLink href="/rss.xml">RSS</UnderlineLink>
        </Text>
      </Flex>
    </Container>
  );
}
