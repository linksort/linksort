import React from "react"
import { Box } from "@chakra-ui/react"

export default function FloatingPill({ children, ...rest }) {
  return (
    <Box
      boxShadow="rgba(0, 0, 0, 0.1) 0px 0px 24px -2px"
      borderRadius="3xl"
      width="100%"
      padding={6}
      {...rest}
    >
      {children}
    </Box>
  )
}
