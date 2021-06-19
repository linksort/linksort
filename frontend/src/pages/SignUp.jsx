import React from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import {
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  FormErrorMessage,
  Button,
  Box,
} from "@chakra-ui/react";

import { useSignUp } from "../api/auth";

export default function SignUp() {
  const mutation = useSignUp();
  const formik = useFormik({
    initialValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
    onSubmit: mutation.mutateAsync,
  });

  return (
    <Box as="form" width="100%" maxWidth="36ch" onSubmit={formik.handleSubmit}>
      <Heading fontSize="3xl" mb={6}>
        Sign up
      </Heading>

      <FormControl
        id="firstName"
        isInvalid={mutation.error?.firstName}
        isRequired
        mb={6}
      >
        <FormLabel>First name</FormLabel>
        <Input
          type="text"
          name="firstName"
          onChange={formik.handleChange}
          value={formik.values.firstName}
          autoFocus
        />
        <FormErrorMessage>{mutation.error?.firstName}</FormErrorMessage>
      </FormControl>

      <FormControl id="lastName" isInvalid={mutation.error?.lastName} mb={6}>
        <FormLabel>Last name</FormLabel>
        <Input
          type="text"
          name="lastName"
          onChange={formik.handleChange}
          value={formik.values.lastName}
        />
        <FormErrorMessage>{mutation.error?.lastName}</FormErrorMessage>
      </FormControl>

      <FormControl
        id="email"
        isInvalid={mutation.error?.message || mutation.error?.email}
        isRequired
        mb={6}
      >
        <FormLabel>Email address</FormLabel>
        <Input
          type="email"
          name="email"
          onChange={formik.handleChange}
          value={formik.values.email}
        />
        <FormErrorMessage>
          {mutation.error?.message || mutation.error?.email}
        </FormErrorMessage>
        <FormHelperText>We'll never share your email.</FormHelperText>
      </FormControl>

      <FormControl
        id="password"
        isInvalid={mutation.error?.password}
        isRequired
        mb={6}
      >
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          name="password"
          onChange={formik.handleChange}
          value={formik.values.password}
          required
        />
        <FormErrorMessage>{mutation.error?.password}</FormErrorMessage>
        <FormHelperText>
          Your password must be at least six characters long.
        </FormHelperText>
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

      <Button as={Link} variant="ghost" w="100%" to="/sign-in">
        Already have an account? Sign in.
      </Button>
    </Box>
  );
}
