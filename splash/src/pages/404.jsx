import React from "react"
import { Heading, Text, Button, Box, Container } from "@chakra-ui/react"
import { Link } from "gatsby"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"

export default function NotFoundPage({ location }) {
  return (
    <Layout location={location}>
      <Container
        maxWidth="3xl"
        paddingTop={["7rem", "7rem", "8rem"]}
        paddingX={6}
      >
        <Metadata title="404: Not Found" />
        <Box textAlign="center">
          <Heading as="h2" textAlign="center" mb={4}>
            Not Found
          </Heading>
          <Text fontSize="lg" textAlign="center" whiteSpace="nowrap" mb={6}>
            Nothing is here{" "}
            <span role="img" aria-label="confused face emoji">
              &#x1F615;
            </span>
          </Text>
          <Button as={Link} colorScheme="brand" to="/">
            Go home
          </Button>
        </Box>
      </Container>
    </Layout>
  )
}
