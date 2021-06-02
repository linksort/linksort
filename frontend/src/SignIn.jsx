import React from "react";
import { useHistory, Link } from "react-router-dom";
import { useFormik } from "formik";
import { useMutation } from "react-query";
import {
  Stack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  FormErrorMessage,
  Button,
} from "@chakra-ui/react";

import * as API from "./api/auth";

export default function Login() {
  const history = useHistory();

  const mutation = useMutation(API.login, {
    onSuccess: () => history.push("/"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: mutation.mutateAsync,
  });

  return (
    <Stack
      as="form"
      width="100%"
      maxWidth="40ch"
      spacing={6}
      onSubmit={formik.handleSubmit}
    >
      <Heading fontSize="3xl">Sign in</Heading>
      <FormControl
        id="email"
        isInvalid={mutation.error?.message || mutation.error?.email}
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
        <FormHelperText>We'll never share your email.</FormHelperText>
      </FormControl>
      <FormControl id="password" isInvalid={mutation.error?.password}>
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
      <Button type="submit" isLoading={formik.isSubmitting} colorScheme="brand">
        Submit
      </Button>

      <Button as={Link} variant="link" to="/sign-up">
        Don't have an account? Sign up.
      </Button>

      <Button as={Link} variant="link" to="/forgot-password">
        I forgot my password.
      </Button>
    </Stack>
  );
}
