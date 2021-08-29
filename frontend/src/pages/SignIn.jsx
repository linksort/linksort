import React from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import {
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Box,
} from "@chakra-ui/react";

import { suppressErrors } from "../utils";
import { useSignIn } from "../api/auth";

export default function SignIn() {
  const mutation = useSignIn();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: suppressErrors(mutation.mutateAsync),
  });

  return (
    <Box as="form" width="100%" maxWidth="36ch" onSubmit={formik.handleSubmit}>
      <Heading fontSize="3xl" mb={6}>
        Sign in
      </Heading>
      <FormControl
        id="email"
        isInvalid={mutation.error?.message || mutation.error?.email}
        mb={6}
      >
        <FormLabel>Email address</FormLabel>
        <Input
          type="email"
          name="email"
          onChange={formik.handleChange}
          value={formik.values.email}
          autoFocus
          required
        />
        <FormErrorMessage>
          {mutation.error?.message || mutation.error?.email}
        </FormErrorMessage>
      </FormControl>
      <FormControl id="password" isInvalid={mutation.error?.password} mb={8}>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          name="password"
          onChange={formik.handleChange}
          value={formik.values.password}
          required
        />
        <FormErrorMessage>{mutation.error?.password}</FormErrorMessage>
      </FormControl>
      <Button
        type="submit"
        isLoading={formik.isSubmitting}
        colorScheme="brand"
        mb={4}
        w="100%"
      >
        Submit
      </Button>

      <Button as={Link} variant="ghost" to="/sign-up" mb={2} w="100%">
        Don't have an account? Sign up.
      </Button>

      <Button as={Link} variant="ghost" to="/forgot-password" w="100%">
        I forgot my password.
      </Button>
    </Box>
  );
}
