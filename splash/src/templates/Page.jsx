import React from "react"
import { graphql } from "gatsby"
import { Box, Container, Heading } from "@chakra-ui/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"

export const pageQuery = graphql`
  query PageByTitle($title: String!) {
    markdownRemark(frontmatter: { title: { eq: $title } }) {
      html
      frontmatter {
        title
      }
    }
  }
`

export default function PageTemplate({ data, location }) {
  const title = data.markdownRemark.frontmatter.title

  return (
    <Layout location={location}>
      <Container
        maxWidth="3xl"
        paddingTop={["7rem", "7rem", "8rem"]}
        paddingX={6}
      >
        <Metadata title={title} />
        <Box as="article">
          <Box mb={8}>
            <Heading as="h1" mb={2}>
              {title}
            </Heading>
          </Box>
          <Box
            className="prose"
            dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }}
          />
        </Box>
      </Container>
    </Layout>
  )
}
