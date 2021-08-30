import React from "react";
import { Link } from "react-router-dom";
import { Container, Flex, Box, Text, Stack } from "@chakra-ui/react";

import TopRightUserMenu from "./TopRightUserMenu";
import TopRightNewLinkPopover from "./TopRightNewLinkPopover";
import Logo from "./Logo";
import { useUser } from "../api/auth";

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

  return (
    <Container maxWidth="7xl" centerContent px={6}>
      <Flex
        as="header"
        height={[24, 32]}
        width="full"
        alignItems="center"
        justifyContent="space-between"
      >
        <Link to="/">
          <Logo htmlWidth="100rem" />
        </Link>
        <Stack direction="row" as="nav" spacing={4}>
          {user ? (
            <>
              <TopRightNewLinkPopover />
              <TopRightUserMenu />
            </>
          ) : (
            <>
              <UnderlineLink href="/blog">Blog</UnderlineLink>
              <UnderlineLink to="/sign-in">Sign in</UnderlineLink>
              <UnderlineLink to="/sign-up">Sign up</UnderlineLink>
            </>
          )}
        </Stack>
      </Flex>
      <Box
        as="main"
        width="100%"
        maxWidth="100%"
        minHeight={["calc(100vh - 14rem)", "calc(100vh - 16rem)"]}
        display="flex"
        alignItems="stretch"
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
