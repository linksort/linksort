import React from "react"
import { graphql } from "gatsby"
import { Container, Heading, Wrap, WrapItem } from "@chakra-ui/react"

import Layout from "../components/Layout"
import Metadata from "../components/Metadata"
import BlogListItem from "../components/BlogListItem"

export const pageQuery = graphql`
  query {
    allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/content/blog/" } }
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "D MMMM YYYY")
          title
          description
        }
      }
    }
  }
`
export default function BlogIndex({ data }) {
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout>
      <Container
        maxWidth="3xl"
        paddingTop={["7rem", "7rem", "8rem"]}
        paddingX={6}
      >
        <Metadata title="Blog" />
        <Heading mb={[8, 12]}>Blog</Heading>
        <Wrap spacing="2rem">
          {posts.map(post => {
            return (
              <WrapItem
                key={post.fields.slug}
                width={["100%", "calc(50% - 2rem)"]}
              >
                <BlogListItem post={post} />
              </WrapItem>
            )
          })}
        </Wrap>
      </Container>
    </Layout>
  )
}
