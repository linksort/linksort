import React from "react";
import { Tag, Wrap, Text } from "@chakra-ui/react";
import { useUser } from "../hooks/auth";
import { Link } from "react-router-dom";

export default function SidebarTagCluster() {
  const user = useUser()
  const userTags = Object.keys(user?.userTags)

  if (userTags.length === 0) {
    return (
      <Text fontSize="sm" color="gray.600">
        When you add your own tags to links, your tags will appear here.
      </Text>
    )
  }

  return (
    <Wrap spacing={1} isInline>
      {userTags.map((tag) => (
        <Tag
          as={Link}
          to={`/?usertag=${encodeURIComponent(tag)}`}
          key={tag}
          marginRight={2}
          whiteSpace="nowrap"
          overflow="hidden"
          size="md"
        >
          {tag}
        </Tag>
      ))}
    </Wrap>
  )
}
