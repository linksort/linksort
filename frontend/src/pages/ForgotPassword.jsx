import React from "react";
import { useFormik } from "formik";
import {
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  FormHelperText,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

import FloatingPill from "../components/FloatingPill";
import { suppressMutationErrors } from "../utils/mutations";
import { useForgotPassword } from "../hooks/auth";

export default function ForgotPassword() {
  const mutation = useForgotPassword();
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    onSubmit: suppressMutationErrors(mutation.mutateAsync),
  });

  return (
    <FloatingPill
      as="form"
      width="100%"
      maxWidth="36ch"
      margin="auto"
      onSubmit={formik.handleSubmit}
    >
      <Heading fontSize="3xl" mb={6}>
        Forgot password
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
        <FormHelperText>
          We'll send an email with a link that allows you to reset your
          password, if your address is in our records.
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
        Go back to sign in
      </Button>
    </FloatingPill>
  );
}
