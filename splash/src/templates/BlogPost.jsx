import React from "react"
import { graphql } from "gatsby"
import { Box, Container, Heading, Text, Wrap, WrapItem } from "@chakra-ui/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"
import BlogListItem from "../components/BlogListItem"

export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $previousPostId: String
    $nextPostId: String
    $otherPostId: String
  ) {
    markdownRemark(id: { eq: $id }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "D MMMM YYYY")
        description
        author
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "D MMMM YYYY")
      }
      excerpt(pruneLength: 160)
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "D MMMM YYYY")
      }
      excerpt(pruneLength: 160)
    }
    other: markdownRemark(id: { eq: $otherPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "D MMMM YYYY")
      }
      excerpt(pruneLength: 160)
    }
  }
`
export default function BlogPostTemplate({ data, location }) {
  const post = data.markdownRemark
  const { previous, next, other } = data

  return (
    <Layout location={location}>
      <Container
        maxWidth="3xl"
        paddingTop={["7rem", "7rem", "8rem"]}
        paddingX={6}
      >
        <Metadata
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        <Box as="article">
          <Box mb={6}>
            <Heading as="h1" mb={2}>
              {post.frontmatter.title}
            </Heading>
            <Text as="time" dateTime={post.frontmatter.date}>
              {post.frontmatter.date}
            </Text>
          </Box>
          <Box
            className="prose"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </Box>
        <Box as="nav" mt={16}>
          <Wrap spacing="2rem">
            {[previous, next, other]
              .filter(p => !!p)
              .map(post => (
                <WrapItem
                  key={post.fields.slug}
                  width={["100%", "calc(50% - 2rem)"]}
                >
                  <BlogListItem post={post} />
                </WrapItem>
              ))}
          </Wrap>
        </Box>
      </Container>
    </Layout>
  )
}
