import React from "react"
import { graphql } from "gatsby"
import GatsbyImage from "gatsby-image"
import { Box, Text, Heading, Container, Image, Button } from "@chakra-ui/react"
import { Global } from "@emotion/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"
import DeviceStage from "../components/home/DeviceStage"
import AssistantDemo from "../components/home/AssistantDemo"
import FeatureBox from "../components/home/FeatureBox"
import MobileSection from "../components/home/MobileSection"
import Closing from "../components/home/Closing"

export const query = graphql`
  query {
    hero: file(relativePath: { eq: "screenshot-hero.png" }) {
      childImageSharp {
        # Specify the image processing specifications right in the query.
        # Makes it trivial to update as your page's design changes.
        fluid(maxWidth: 1100) {
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
    iphoneLinks: file(relativePath: { eq: "devices/iphone-links.png" }) {
      childImageSharp {
        fluid(maxWidth: 600) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    iphoneDetail: file(relativePath: { eq: "devices/iphone-detail.png" }) {
      childImageSharp {
        fluid(maxWidth: 600) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    iphoneCondensed: file(relativePath: { eq: "devices/iphone-condensed.png" }) {
      childImageSharp {
        fluid(maxWidth: 600) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    ipadLinks: file(relativePath: { eq: "devices/ipad-links.png" }) {
      childImageSharp {
        fluid(maxWidth: 900) {
          ...GatsbyImageSharpFluid
        }
      }
    }
    ipadGraph: file(relativePath: { eq: "devices/ipad-graph.png" }) {
      childImageSharp {
        fluid(maxWidth: 900) {
          ...GatsbyImageSharpFluid
        }
      }
    }
  }
`

export default function Index({ data, location }) {
  return (
    <Layout location={location}>
      <Metadata />
      <Global
        styles={{
          "::selection": { background: "#d5e2ff", color: "#111111" },
        }}
      />
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
            marginBottom={6}
            paddingX={10}
            background="white"
            boxShadow="md"
          >
            Sign up
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
      {/* Below the fold: one hairline threads every chapter together. */}
      <Box position="relative" mt={{ base: 10, md: 14 }}>
        <Box
          aria-hidden="true"
          position="absolute"
          left="50%"
          top={0}
          bottom={0}
          w="1px"
          bg="gray.200"
          display={{ base: "none", md: "block" }}
        />
        <DeviceStage
          images={{
            web: data.hero.childImageSharp.fluid,
            iphone: data.iphoneLinks.childImageSharp.fluid,
            ipad: data.ipadLinks.childImageSharp.fluid,
            extension: data.extension.childImageSharp.fluid,
          }}
        />
        <AssistantDemo />
        <FeatureBox />
        <MobileSection
          images={{
            iphoneDetail: data.iphoneDetail.childImageSharp.fluid,
            iphoneCondensed: data.iphoneCondensed.childImageSharp.fluid,
          }}
        />
        <Closing />
      </Box>
    </Layout>
  )
}
