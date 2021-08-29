import React from "react";
import { useFormik } from "formik";
import {
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Box,
  FormHelperText,
} from "@chakra-ui/react";

import { suppressErrors } from "../utils";
import { useChangePassword } from "../api/auth";
import useQueryString from "../hooks/useQueryString";

export default function ChangePassword() {
  const queryValues = useQueryString();
  const mutation = useChangePassword();
  const formik = useFormik({
    initialValues: {
      email: queryValues.u,
      signature: queryValues.s,
      timestamp: queryValues.t,
      password: "",
    },
    onSubmit: suppressErrors(mutation.mutateAsync),
  });

  return (
    <Box as="form" width="100%" maxWidth="36ch" onSubmit={formik.handleSubmit}>
      <Heading fontSize="3xl" mb={6}>
        Change password
      </Heading>
      <FormControl id="email" isInvalid={mutation.error} mb={6}>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          name="password"
          onChange={formik.handleChange}
          value={formik.values.password}
          autoFocus
          required
        />
        <FormErrorMessage>
          {mutation.error?.message || mutation.error?.password}
        </FormErrorMessage>
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
    </Box>
  );
}
