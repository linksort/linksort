import React from "react";
import { pick } from "lodash";
import { useFormik } from "formik";
import {
  Box,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Heading,
  VStack,
  Button,
  StackDivider,
  Text,
  Flex,
  useToast,
} from "@chakra-ui/react";

import { suppressMutationErrors } from "../utils/mutations";
import { useUpdateUser, useDeleteUser, useUser } from "../hooks/auth";

function Profile() {
  const user = useUser();
  const mutation = useUpdateUser();
  const toast = useToast();
  const formik = useFormik({
    initialValues: pick(user, ["email", "firstName", "lastName"]),
    onSubmit: suppressMutationErrors(async (...params) => {
      try {
        await mutation.mutateAsync(...params);
      } catch (e) {
        toast({
          title: "Whoops. That didn't work.",
          status: "error",
          duration: 9000,
          isClosable: true,
        });

        return;
      }

      toast({
        title: "Profile updated",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }),
  });

  return (
    <VStack
      as="form"
      maxWidth="40ch"
      spacing={4}
      align="left"
      onSubmit={formik.handleSubmit}
    >
      <Heading as="h2" size="md">
        Profile
      </Heading>

      <FormControl id="firstName" isInvalid={mutation.error?.firstName} mb={6}>
        <FormLabel>First name</FormLabel>
        <Input
          type="text"
          name="firstName"
          onChange={formik.handleChange}
          value={formik.values.firstName}
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

      <Flex justifyContent="left">
        <Button type="submit" isLoading={formik.isSubmitting}>
          Update
        </Button>
      </Flex>
    </VStack>
  );
}

function Danger() {
  const mutation = useDeleteUser();
  const formik = useFormik({
    initialValues: {},
    onSubmit: suppressMutationErrors(mutation.mutateAsync),
  });

  return (
    <VStack
      as="form"
      maxWidth="40ch"
      spacing={4}
      align="left"
      onSubmit={formik.handleSubmit}
    >
      <Heading as="h2" size="md">
        Danger
      </Heading>

      <Text>
        This will instantly delete your account and all of your data. Please be
        careful.
      </Text>

      <Box>
        <Button colorScheme="red" type="submit" isLoading={formik.isSubmitting}>
          Delete account
        </Button>
      </Box>
    </VStack>
  );
}

function DownloadData() {
  return (
    <VStack maxWidth="40ch" spacing={4} align="left">
      <Heading as="h2" size="md">
        Download Your Data
      </Heading>

      <Text>
        This will download a ZIP file containing all of your data in JSON format.
      </Text>

      <Box>
        <Button as="a" href="/api/users/download">Download Data</Button>
      </Box>
    </VStack>
  );
}

export default function Account() {
  return (
    <VStack
      maxWidth="5xl"
      marginX="auto"
      paddingTop={6}
      paddingBottom={10}
      padding={6}
      spacing={8}
      align="left"
      divider={<StackDivider />}
    >
      <Profile />
      <DownloadData />
      <Danger />
    </VStack>
  );
}
