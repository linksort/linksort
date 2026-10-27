import React from "react"
import GatsbyImage from "gatsby-image"
import { Box } from "@chakra-ui/react"

// Device bezels drawn as geometry. Each frame uses fixed-pixel padding and an
// inner radius of exactly (outer radius - padding), so the screenshot's
// corners sit flush inside the bezel at every size. The screen box carries
// the screenshot's own aspect ratio, so nothing is cropped or letterboxed.

const SCREEN = {
  // width / height of the screenshots in content/assets
  iphone: 1320 / 2868,
  ipad: 3 / 4,
  web: 2514 / 1626,
}

function Screen({ image, ratio, radius }) {
  return (
    <Box
      position="relative"
      w="100%"
      style={{ aspectRatio: String(ratio) }}
      borderRadius={radius}
      overflow="hidden"
      bg="white"
      // Chrome can leak square corners on composited children; isolating the
      // layer keeps the clip crisp.
      isolation="isolate"
      sx={{ ".gatsby-image-wrapper": { position: "absolute !important", inset: 0 } }}
    >
      <GatsbyImage fluid={image} style={{ position: "absolute", inset: 0 }} imgStyle={{ objectFit: "cover" }} />
    </Box>
  )
}

export function Phone({ image, ...rest }) {
  return (
    <Box bg="gray.900" borderRadius="44px" p="10px" boxShadow="inset 0 0 0 1.5px rgba(255,255,255,0.08)" {...rest}>
      <Screen image={image} ratio={SCREEN.iphone} radius="34px" />
    </Box>
  )
}

export function Tablet({ image, ...rest }) {
  return (
    <Box bg="gray.900" borderRadius="28px" p="12px" boxShadow="inset 0 0 0 1.5px rgba(255,255,255,0.08)" {...rest}>
      <Screen image={image} ratio={SCREEN.ipad} radius="16px" />
    </Box>
  )
}

export function Laptop({ image, ...rest }) {
  return (
    <Box {...rest}>
      <Box bg="gray.900" borderRadius="14px 14px 0 0" p="12px 12px 0" borderBottom="0">
        <Screen image={image} ratio={SCREEN.web} radius="6px 6px 0 0" />
      </Box>
      <Box h="12px" bg="gray.900" />
      <Box h="10px" mx="-3%" bg="gray.300" borderBottomRadius="8px" borderTop="1px solid" borderTopColor="gray.400" />
    </Box>
  )
}
