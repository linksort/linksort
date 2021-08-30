import React from "react";
import { Heading, Box, Text } from "@chakra-ui/react";

export default function ForgotPasswordSentEmail() {
  return (
    <Box width="100%" maxWidth="36ch" margin="auto">
      <Heading fontSize="3xl" mb={6}>
        Check your email
      </Heading>
      <Text>
        We just sent an email with a link that allows you to reset your
        password.
      </Text>
    </Box>
  );
}
