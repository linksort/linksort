import React from "react"
import { Link } from "gatsby"
import { Heading, Box, Text, Stack } from "@chakra-ui/react"
import { ArrowForwardIcon } from "@chakra-ui/icons"

import FloatingPill from "../components/FloatingPill"

export default function BlogListItem({ post }) {
  const title = post.frontmatter.title || post.fields.slug

  return (
    <FloatingPill
      _hover={{ transform: "translateY(-0.4rem)" }}
      transition="ease 0.2s"
      height={["auto", "22rem"]}
    >
      <Stack spacing={3}>
        <Heading as="h3" fontSize="2xl">
          <Link to={`/blog${post.fields.slug}`}>{title}</Link>
        </Heading>
        <Text as="time" dateTime={post.frontmatter.date}>
          {post.frontmatter.date}
        </Text>
        <Box className="prose">
          <p>{post.excerpt}</p>
        </Box>
        <Text>
          <Text
            as={Link}
            to={`/blog${post.fields.slug}`}
            _hover={{ textDecoration: "underline" }}
          >
            Continue reading
          </Text>
          <Text as="span" sx={{ verticalAlign: "top", paddingLeft: 1 }}>
            <ArrowForwardIcon />
          </Text>
        </Text>
      </Stack>
    </FloatingPill>
  )
}
