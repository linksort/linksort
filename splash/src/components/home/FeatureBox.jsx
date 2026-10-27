import React from "react"
import { Box, Flex, Text, Heading, Container, Grid, GridItem, HStack } from "@chakra-ui/react"

import GraphDemo from "./features/GraphDemo"
import { AutoTagsDemo, SearchDemo, ViewsDemo, FoldersDemo, ReaderDemo, NotesDemo } from "./features/SmallDemos"

function Chip({ children }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      h="7"
      px="2.5"
      bg="gray.100"
      borderRadius="lg"
      fontSize="xs"
      fontWeight="semibold"
      color="gray.800"
    >
      {children}
    </Box>
  )
}

/**
 * A feature rendered the way Linksort renders a link: a live miniature of
 * the feature where the cover goes, a hairline, title and one line, then a
 * row of chips where the controls go.
 */
function FeatureTile({ demo, demoHeight = "15rem", title, text, chips = [], colSpan = 1 }) {
  return (
    <GridItem
      colSpan={{ base: 1, md: colSpan }}
      as="article"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="xl"
      boxShadow="sm"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box h={demoHeight} flexShrink={0} overflow="hidden" borderBottom="1px solid" borderBottomColor="gray.100">
        {demo}
      </Box>
      <Flex direction="column" justify="space-between" pt={3} px={4} pb={4} gap={3} flex="1">
        <Box>
          <Text fontWeight="semibold" color="gray.900">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.700" mt={1}>
            {text}
          </Text>
        </Box>
        {chips.length > 0 && (
          <HStack spacing={2} wrap="wrap">
            {chips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </HStack>
        )}
      </Flex>
    </GridItem>
  )
}

export default function FeatureBox() {
  return (
    <Box as="section" id="features" position="relative" zIndex={1}>
      <Container maxWidth="7xl" px={6} py={{ base: 16, md: 24 }}>
        <Box maxW="40rem" mb={{ base: 8, md: 10 }}>
          <Heading as="h2" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-0.02em" color="gray.900" mb={3}>
            Everything in the box.
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
            Each link gets a cover, a title, and a category the moment you save it. The rest of the tools exist
            so you can find it again without having filed it. These are live: click around.
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          <FeatureTile
            demo={<GraphDemo />}
            demoHeight={{ base: "16rem", md: "20rem" }}
            colSpan={2}
            title="Graph view"
            text="Every link and every topic as a map. Clusters form on their own; a quick way to see what you've actually been reading about."
            chips={["Web", "iPhone", "iPad"]}
          />
          <FeatureTile
            demo={<AutoTagsDemo />}
            demoHeight={{ base: "16rem", md: "20rem" }}
            title="Auto tags"
            text="Each save is classified into categories like Food & Drink or Computers & Electronics. No tagging on your part."
            chips={["Automatic"]}
          />
          <FeatureTile
            demo={<SearchDemo />}
            title="Search, sort, group, favorite"
            text="Full-text search over titles, sites and descriptions. Sort by date, group by day or site, star the keepers."
            chips={["Web", "iOS"]}
          />
          <FeatureTile
            demo={<ViewsDemo />}
            title="Three views"
            text="Tiled for browsing covers, comfy for reading titles, condensed when you want sixty links on one screen."
            chips={["Tiled", "Comfy", "Condensed"]}
          />
          <FeatureTile
            demo={<FoldersDemo />}
            title="Folders"
            text="Sometimes you just need a good old folder. Make them yourself, or let the assistant propose them."
            chips={["Manual", "Assistant"]}
          />
          <FeatureTile
            demo={<ReaderDemo />}
            colSpan={2}
            demoHeight={{ base: "15rem", md: "17rem" }}
            title="Reader view"
            text="Articles saved as clean, readable text, so a link still works when the page behind it changes."
            chips={["Web", "iOS"]}
          />
          <FeatureTile
            demo={<NotesDemo />}
            demoHeight={{ base: "15rem", md: "17rem" }}
            title="Notes"
            text="Jot down why you saved something while it's fresh. Notes are searchable and have their own view."
            chips={["Web", "iOS"]}
          />
        </Grid>
      </Container>
    </Box>
  )
}
