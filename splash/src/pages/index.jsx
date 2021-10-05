import React from "react"
import { Link } from "gatsby"
import { Box, Text, Heading, Stack, Input, Button } from "@chakra-ui/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"

function ProminentLink({ to, children }) {
  return (
    <Text
      as={Link}
      to={to}
      sx={{
        fontWeight: "bold",
        textDecoration: "underline",
        textDecorationColor: theme => theme.colors.accent,
        textDecorationThickness: "0.18rem",
        "&:hover": {
          color: "black",
          textDecorationColor: theme => theme.colors.primary,
        },
        transition: "200ms",
      }}
    >
      {children}
    </Text>
  )
}

export default function Index() {
  return (
    <Layout>
      <Metadata />
      <Stack spacing={4}>
        <Heading>
          Hello{" "}
          <span role="img" aria-label="waving hand emoji">
            &#x1F44B;
          </span>
        </Heading>
        <Text fontSize="xl" lineHeight="tall">
          Some day soon, on this very page, there will be an application where
          you'll be able to save, auto-organize, and share{" "}
          <Text as="span" whiteSpace="nowrap">
            your links.{" "}
            <span role="img" aria-label="smiling face emoji">
              &#x1F642;
            </span>
          </Text>
        </Text>
        <Text fontSize="xl" lineHeight="tall">
          Join our waitlist to get an invitation when we're ready to launch.
        </Text>
        <Box
          as="form"
          name="waitlist"
          method="POST"
          data-netlify="true"
          action="/waitlist"
          display="flex"
          flexDirection={["column", "row"]}
          maxWidth="30rem"
          py={4}
        >
          <input type="hidden" name="form-name" value="waitlist" />
          <Input
            type="email"
            inputMode="email"
            aria-label="Email"
            name="email"
            isRequired
            size="lg"
            placeholder="Your email address"
            borderRightRadius={["md", "none"]}
            mb={[4, 0]}
          />
          <Button
            type="submit"
            size="lg"
            colorScheme="brand"
            borderLeftRadius={["md", "none"]}
            flexShrink={0}
          >
            Join waitlist
          </Button>
        </Box>
        <Text fontSize="xl" lineHeight="tall">
          In the meantime, you can read more about{" "}
          <ProminentLink to="/blog/idea">the idea</ProminentLink> on our{" "}
          <ProminentLink to="/blog">blog</ProminentLink>.
        </Text>
      </Stack>
    </Layout>
  )
}
