import React from "react";
import { useHistory } from "react-router-dom";
import { useFormik } from "formik";
import { useMutation } from "react-query";
import {
  Flex,
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

  const mutation = useMutation(API.signUp, {
    onSuccess: () => history.push("/"),
  });

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
    <Flex alignItems="center" justifyContent="center">
      <Stack
        as="form"
        maxWidth="80ch"
        spacing={6}
        onSubmit={formik.handleSubmit}
      >
        <Heading fontSize="3xl">Log in</Heading>

        <FormControl
          id="firstName"
          isInvalid={mutation.error?.firstName}
          isRequired
        >
          <FormLabel>First name</FormLabel>
          <Input
            type="text"
            name="firstName"
            onChange={formik.handleChange}
            value={formik.values.firstName}
            autoFocus
            required
          />
          <FormErrorMessage>{mutation.error?.firstName}</FormErrorMessage>
        </FormControl>

        <FormControl id="lastName" isInvalid={mutation.error?.lastName}>
          <FormLabel>Last name</FormLabel>
          <Input
            type="text"
            name="lastName"
            onChange={formik.handleChange}
            value={formik.values.lastName}
            required
          />
          <FormErrorMessage>{mutation.error?.lastName}</FormErrorMessage>
        </FormControl>

        <FormControl
          id="email"
          isInvalid={mutation.error?.message || mutation.error?.email}
          isRequired
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

        <Button type="submit" isLoading={formik.isSubmitting}>
          Submit
        </Button>
      </Stack>
    </Flex>
  );
}
