import React from "react"
import { Text, Heading, Stack } from "@chakra-ui/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"

export default function WaitlistSuccess() {
  return (
    <Layout>
      <Metadata title="Thank you" />
      <Stack spacing={4}>
        <Heading as="aside" textAlign="center">
          <span role="img" aria-label="construction worker emoji">
            &#x1F477;
          </span>{" "}
          <span role="img" aria-label="construction sign emoji">
            &#x1F6A7;
          </span>{" "}
          <span role="img" aria-label="construction worker emoji">
            &#x1F477;
          </span>
        </Heading>
        <Heading as="h2" textAlign="center">
          Thank you
        </Heading>
        <Text fontSize="lg" maxWidth="30ch" textAlign="center">
          We're working hard on our first release. We'll let you know when it's
          done.
        </Text>
      </Stack>
    </Layout>
  )
}
