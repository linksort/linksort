import React from "react"
import GatsbyImage from "gatsby-image"
import {
  Box,
  Flex,
  Text,
  Heading,
  Container,
  Grid,
  GridItem,
  HStack,
} from "@chakra-ui/react"

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
 * A feature rendered the way Linksort renders a link: cover on top, a
 * hairline, title and one line, then a row of chips where the controls go.
 */
function FeatureTile({
  image,
  imagePosition = "top",
  imageHeight = "11rem",
  imageBg = "gray.50",
  fit = "cover",
  zoom = 1,
  title,
  text,
  chips = [],
  colSpan = 1,
  rowSpan = 1,
}) {
  return (
    <GridItem
      colSpan={{ base: 1, md: colSpan }}
      rowSpan={{ base: 1, md: rowSpan }}
      as="article"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="xl"
      boxShadow="sm"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      transition="background-color 0.2s ease"
      _hover={{ bg: "gray.50" }}
    >
      <Box
        h={imageHeight}
        flexGrow={rowSpan > 1 ? 1 : 0}
        overflow="hidden"
        bg={imageBg}
        borderBottom="1px solid"
        borderBottomColor="gray.100"
        position="relative"
      >
        {fit === "contain" ? (
          // Small UI crops sit at roughly their natural size on the Paper
          // ground instead of being blown up to fill the cover area.
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={8}
          >
            <Box w="100%" maxW="15rem">
              <GatsbyImage fluid={image} />
            </Box>
          </Box>
        ) : (
          <Box
            position="absolute"
            top={0}
            bottom={0}
            right={0}
            w={`${zoom * 100}%`}
            sx={{ ".gatsby-image-wrapper": { height: "100%" } }}
          >
            <GatsbyImage
              fluid={image}
              style={{ height: "100%" }}
              imgStyle={{ objectFit: "cover", objectPosition: imagePosition }}
            />
          </Box>
        )}
      </Box>
      <Flex direction="column" justify="space-between" pt={3} px={4} pb={4} gap={3}>
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

export default function FeatureBox({ images }) {
  return (
    <Box as="section" id="features" position="relative" zIndex={1}>
      <Container maxWidth="7xl" px={6} pb={{ base: 16, md: 24 }}>
        <Box maxW="40rem" mb={{ base: 8, md: 10 }}>
          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "4xl" }}
            letterSpacing="-0.02em"
            color="gray.900"
            mb={3}
          >
            Everything in the box.
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
            Each link gets a cover, a title, and a category the moment you save
            it. The rest of the tools exist so you can find it again without
            having filed it.
          </Text>
        </Box>

        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gap={6}
        >
          <FeatureTile
            image={images.graph}
            colSpan={2}
            imageHeight={{ base: "12rem", md: "18rem" }}
            zoom={1.45}
            imagePosition="100% 42%"
            title="Graph view"
            text="Every link and every topic as a map. Clusters form on their own; a quick way to see what you've actually been reading about."
            chips={["Web", "iPhone", "iPad"]}
          />
          <FeatureTile
            image={images.autoTags}
            fit="contain"
            imageHeight={{ base: "12rem", md: "18rem" }}
            title="Auto tags"
            text="Each save is classified into categories like Food & Drink or Computers & Electronics. No tagging on your part."
            chips={["Automatic"]}
          />
          <FeatureTile
            image={images.filterSort}
            fit="contain"
            imageHeight="13rem"
            title="Search, sort, group, favorite"
            text="Full-text search over titles, sites and descriptions. Sort by date, group by day or site, star the keepers."
            chips={["Web", "iOS"]}
          />
          <FeatureTile
            image={images.tilePreview}
            fit="contain"
            imageHeight="13rem"
            title="Three views"
            text="Tiled for browsing covers, comfy for reading titles, condensed when you want sixty links on one screen."
            chips={["Tiled", "Comfy", "Condensed"]}
          />
          <FeatureTile
            image={images.folders}
            fit="contain"
            imageHeight="13rem"
            title="Folders"
            text="Sometimes you just need a good old folder. Make them yourself, or let the assistant propose them."
            chips={["Manual", "Assistant"]}
          />
          <FeatureTile
            image={images.reader}
            colSpan={2}
            imagePosition="top"
            imageHeight={{ base: "12rem", md: "16rem" }}
            title="Reader view"
            text="Articles saved as clean, readable text, so a link still works when the page behind it changes."
            chips={["Web", "iOS"]}
          />
          <FeatureTile
            image={images.notes}
            imagePosition="bottom"
            imageHeight={{ base: "12rem", md: "16rem" }}
            title="Notes"
            text="Jot down why you saved something while it's fresh. Notes are searchable and have their own view."
            chips={["Web", "iOS"]}
          />
        </Grid>
      </Container>
    </Box>
  )
}
