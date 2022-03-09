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
    privacy: file(relativePath: { eq: "privacy.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    notes: file(relativePath: { eq: "notes.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    reader: file(relativePath: { eq: "reader-view.png" }) {
      childImageSharp {
        fluid(maxWidth: 500) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`

function CenteredMarketingModule({
  heading,
  subheading,
  image,
  imageWidth = "80%",
}) {
  return (
    <Flex
      padding={8}
      borderRadius={8}
      backgroundColor="brand.50"
      width="100%"
      flexDirection="column"
    >
      <Flex
        width="100%"
        flexGrow={0}
        flexDirection="column"
        justifyContent="center"
      >
        <Heading as="h4" fontSize="2xl" marginBottom={2} align="center">
          {heading}
        </Heading>
        <Text align="center">{subheading}</Text>
      </Flex>

      <Box
        width={["100%", imageWidth, imageWidth]}
        flexShrink={0}
        paddingTop={8}
        margin="auto"
      >
        <Image
          as={GatsbyImage}
          boxShadow="lg"
          borderRadius={10}
          fluid={image}
          width="100%"
        />
      </Box>
    </Flex>
  )
}

function MarketingModule({
  heading,
  subheading,
  image,
  orientation,
  noShadow,
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
          boxShadow={noShadow ? "" : "lg"}
          borderRadius={circleImg ? "100%" : 10}
          fluid={image}
          width="100%"
        />
      </Box>
    </Flex>
  )
}

export default function Index({ data, location }) {
  return (
    <Layout location={location}>
      <Metadata />
      <Box
        position="relative"
        width="100%"
        overflow="hidden"
        paddingTop="7rem"
        paddingBottom="2rem"
      >
        <Box
          position="absolute"
          background="linear-gradient(160deg, rgb(10, 82, 255), #e2aeee)"
          height="110%"
          width="180%"
          top={["-14rem", "-14rem", "-14rem", "-14rem", "-18rem"]}
          left="-10rem"
          transform={[
            "rotate(-5deg)",
            "rotate(-5deg)",
            "rotate(-5deg)",
            "rotate(-5deg)",
            "rotate(-3deg)",
          ]}
          zIndex="-1"
        />
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
            Save your links. Close{" "}
            <Text as="span" whiteSpace="nowrap">
              your tabs.
            </Text>
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
            borderRadius={10}
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
            heading="One-click to save links."
            subheading="Use the browser extension to effortlessly save links as you browse."
            image={data.extension.childImageSharp.fluid}
            orientation="left"
            circleImg={true}
          />

          <MarketingModule
            heading="Search, filter, sort, group, and favorite."
            subheading="All of the tools you'd expect to help you find things easily and keep things tidy."
            image={data.filterSort.childImageSharp.fluid}
            orientation="right"
          />

          <CenteredMarketingModule
            heading="Reader view."
            subheading="Cut out the cruft and focus with reader view (experimental)."
            image={data.reader.childImageSharp.fluid}
            imageWidth="80%"
          />

          <MarketingModule
            heading="Add notes."
            subheading="Jot down your thoughts as you read."
            image={data.notes.childImageSharp.fluid}
            orientation="right"
          />

          <MarketingModule
            heading="Your links will look beautiful."
            subheading="Linksort has three ways of displaying your links: tiled view, comfy, or condensed. Whatever you choose, your links will look great."
            image={data.tilePreview.childImageSharp.fluid}
            orientation="left"
          />

          <MarketingModule
            heading="Use folders to organize your links."
            subheading="Sometimes you just need a good old folder."
            image={data.folders.childImageSharp.fluid}
            orientation="right"
          />

          <MarketingModule
            heading="Private, safe, and secure."
            subheading="We encrypt your data in storage and we don't share it with anyone."
            image={data.privacy.childImageSharp.fluid}
            orientation="left"
            circleImg={true}
            noShadow
          />

          <Stack
            padding={8}
            borderRadius={8}
            backgroundColor="brand.500"
            width="100%"
            alignItems="center"
            spacing={4}
          >
            <Heading as="h4" fontSize="2xl" color="white" textAlign="center">
              Get started. It's free.
            </Heading>
            <Text color="white" textAlign="center">
              Linksort is being actively developed, with new features coming out
              at a rapid clip. If you sign up now, it will always be free for
              you.
            </Text>
            <Box>
              <Button as="a" href="/sign-up" colorScheme="gray" paddingX={10}>
                Sign Up
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Layout>
  )
}
