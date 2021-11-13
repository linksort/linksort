import React from "react"
import { graphql } from "gatsby"
import GatsbyImage from "gatsby-image"
import {
  Box,
  Text,
  Heading,
  Container,
  Image,
  Button,
  Flex,
  Stack,
} from "@chakra-ui/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"

export const query = graphql`
  query {
    hero: file(relativePath: { eq: "screenshot-hero.png" }) {
      childImageSharp {
        # Specify the image processing specifications right in the query.
        # Makes it trivial to update as your page's design changes.
        fluid(maxWidth: 900) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    autoTags: file(relativePath: { eq: "auto-tags.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    extension: file(relativePath: { eq: "extension.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    filterSort: file(relativePath: { eq: "sort-filter.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    tilePreview: file(relativePath: { eq: "tile-preview.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    folders: file(relativePath: { eq: "folders.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`

function MarketingModule({
  heading,
  subheading,
  image,
  orientation,
  circleImg = false,
}) {
  const orient = orientation === "left" ? "row" : "row-reverse"
  const padding = orientation === "left" ? "paddingLeft" : "paddingRight"

  return (
    <Flex
      padding={8}
      borderRadius={8}
      backgroundColor="brand.50"
      width="100%"
      flexDirection={["column", "column", orient]}
    >
      <Flex
        width={["100%", "100%", "50%"]}
        flexGrow={0}
        flexDirection="column"
        justifyContent="center"
      >
        <Heading as="h4" fontSize="2xl" marginBottom={2}>
          {heading}
        </Heading>
        <Text>{subheading}</Text>
      </Flex>
      <Box
        width={["100%", "100%", "50%"]}
        flexShrink={0}
        paddingTop={[8, 8, 0]}
        {...{ [padding]: [0, 0, 8] }}
      >
        <Image
          as={GatsbyImage}
          boxShadow="lg"
          borderRadius={circleImg ? "100%" : 20}
          fluid={image}
          width="100%"
        />
      </Box>
    </Flex>
  )
}

export default function Index({ data }) {
  return (
    <Layout isHomePage>
      <Metadata />
      <Box
        background="linear-gradient(160deg, rgb(10, 82, 255), #e2aeee)"
        width="100%"
        paddingTop="7rem"
        paddingBottom="2rem"
      >
        <Container maxWidth="7xl" centerContent px={6}>
          <Heading
            as="h2"
            color="white"
            fontWeight="bold"
            fontSize="2.4rem"
            letterSpacing="tight"
            width="100%"
            textAlign="center"
            marginBottom={4}
          >
            Save your links. Close your tabs.
          </Heading>
          <Text color="white" marginBottom={4} textAlign="center">
            Linksort makes saving links and staying organized easy.
          </Text>
          <Button
            as="a"
            href="/sign-up"
            colorScheme="gray"
            marginBottom={6}
            paddingX={10}
          >
            Sign Up
          </Button>
          <Image
            as={GatsbyImage}
            fluid={data.hero.childImageSharp.fluid}
            boxShadow="lg"
            borderRadius={12}
            maxWidth="60rem"
            width="100%"
            borderStyle="solid"
            borderWidth="thin"
            borderColor="gray.100"
          />
        </Container>
      </Box>
      <Container maxWidth="2xl" px={6} marginTop={8}>
        <Stack spacing={4}>
          <MarketingModule
            heading="Auto tags."
            subheading="We magically* organize your links into categories for you—okay, we don't have magic, just the next best thing, machine learning."
            image={data.autoTags.childImageSharp.fluid}
            orientation="right"
          />
          <MarketingModule
            heading="Your links will look beautiful."
            subheading="Whether you choose tiled view, comfy, or condensed, your links will look great."
            image={data.tilePreview.childImageSharp.fluid}
            orientation="left"
          />
          <MarketingModule
            heading="One-click to save links."
            subheading="Use the browser extension to effortlessly save links as you browse."
            image={data.extension.childImageSharp.fluid}
            orientation="right"
            circleImg={true}
          />
          <MarketingModule
            heading="Search, filter, sort, group, and favorite."
            subheading="All of the tools you'd expect to find things easily and keep things tidy."
            image={data.filterSort.childImageSharp.fluid}
            orientation="left"
          />
          <MarketingModule
            heading="Use folders to organize your links."
            subheading="Sometimes you just need a good old folder."
            image={data.folders.childImageSharp.fluid}
            orientation="right"
          />
          <Flex
            padding={8}
            borderRadius={8}
            backgroundColor="brand.500"
            width="100%"
            flexDirection="column"
            alignItems="center"
          >
            <Heading
              as="h4"
              fontSize="2xl"
              marginBottom={4}
              color="white"
              textAlign="center"
            >
              Get started
            </Heading>
            <Box>
              <Button
                as="a"
                href="/sign-up"
                colorScheme="whiteAlpha"
                paddingX={10}
              >
                Sign Up
              </Button>
            </Box>
          </Flex>
        </Stack>
      </Container>
    </Layout>
  )
}
