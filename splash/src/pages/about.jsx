import React from "react"
import { Link as RouterLink } from "gatsby"
import {
  Box,
  Text,
  Heading,
  Container,
  Wrap,
  Image,
  Stack,
  WrapItem,
} from "@chakra-ui/react"
import GatsbyImage from "gatsby-image"
import { graphql } from "gatsby"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"
import FloatingPill from "../components/FloatingPill"

function Bio({ name, blurb, imageSrc }) {
  return (
    <FloatingPill
      _hover={{ transform: "translateY(-0.4rem)" }}
      transition="ease 0.2s"
      height={["auto", "22rem"]}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
    >
      <Image
        as={GatsbyImage}
        fluid={imageSrc}
        borderRadius="100%"
        width="100%"
        maxWidth="5rem"
        marginBottom={5}
      />
      <Heading
        as="h3"
        fontSize="xl"
        fontWeight="normal"
        marginBottom={3}
        color="black"
      >
        {name}
      </Heading>
      <Text fontSize="md" lineHeight="1.5" color="gray.800" fontWeight="normal">
        {blurb}
      </Text>
    </FloatingPill>
  )
}

export const query = graphql`
  query {
    alex: file(relativePath: { eq: "alex.png" }) {
      childImageSharp {
        fluid(maxWidth: 400) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    catherine: file(relativePath: { eq: "catherine.png" }) {
      childImageSharp {
        fluid(maxWidth: 400) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`

export default function About({ data, location }) {
  return (
    <Layout location={location}>
      <Container
        maxWidth="3xl"
        paddingTop={["7rem", "7rem", "8rem"]}
        paddingX={6}
      >
        <Metadata title="About" />
        <Heading as="h1" mb={6}>
          About
        </Heading>
        <Stack spacing={12}>
          <Stack as="section" spacing={4}>
            <Text fontSize="lg" lineHeight="1.6">
              Linksort's mission is to make it{" "}
              <Text as="span" fontStyle="italic">
                effortless
              </Text>{" "}
              for you to{" "}
              <Text as="span" fontWeight="bold">
                save
              </Text>
              ,{" "}
              <Text as="span" fontWeight="bold">
                organize
              </Text>
              , and{" "}
              <Text as="span" fontWeight="bold">
                retrieve
              </Text>{" "}
              your links. Linksort aims to achieve these goals while being{" "}
              <Text as="span" fontStyle="italic">
                simple
              </Text>{" "}
              to use and{" "}
              <Text as="span" fontStyle="italic">
                beautiful
              </Text>{" "}
              to look at.
            </Text>
            <Text fontSize="lg" lineHeight="1.6">
              Read more about our motivation in our{" "}
              <Text as="span" textDecoration="underline">
                <RouterLink to="/blog/idea">introductory blog post</RouterLink>
              </Text>
              .
            </Text>
          </Stack>
          <Box as="section" mb={6}>
            <Heading as="h2" fontSize="3xl" fontWeight="bold" mb={8}>
              Team
            </Heading>
            <Wrap spacing="2rem">
              <WrapItem key="alex" width={["100%", "calc(50% - 2rem)"]}>
                <Bio
                  name="Alexander Richey"
                  blurb="Alex is a Senior Software Engineer at Amazon Web Services. On nights and weekends, he is the founder of Linksort. He holds a bachelors from N.Y.U. and a masters from Columbia University."
                  imageSrc={data.alex.childImageSharp.fluid}
                />
              </WrapItem>
              <WrapItem key="catherine" width={["100%", "calc(50% - 2rem)"]}>
                <Bio
                  name="Catherine Vidos"
                  blurb="Catherine works in constume design in the film industry. On nights and weekends, she's a Frontend Engineer at Linksort. She holds a bachelors from Barnard College."
                  imageSrc={data.catherine.childImageSharp.fluid}
                />
              </WrapItem>
            </Wrap>
          </Box>
        </Stack>
      </Container>
    </Layout>
  )
}
