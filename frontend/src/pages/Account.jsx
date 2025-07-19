import React, { useState, useRef } from "react";
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  HStack,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { csrfStore } from "../utils/apiFetch";

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

function APIAccess() {
  const user = useUser();
  const [isShowing, setIsShowing] = useState(false);

  return (
    <VStack maxWidth="40ch" spacing={4} align="left">
      <Heading as="h2" size="md">
        API Access
      </Heading>

      <Text>Use this API key to access Linksort programatically.</Text>

      <Input
        value={
          isShowing
            ? user.token
            : user.token.slice(-4).padStart(user.token.length, "*")
        }
        isReadOnly
        fontFamily={"mono"}
      />

      <HStack>
        <Button onClick={() => setIsShowing(!isShowing)}>
          {isShowing ? "Hide" : "Show"} Key
        </Button>
        <Button
          as="a"
          href="/docs"
          target="_blank"
          rightIcon={<ArrowForwardIcon />}
        >
          API Docs
        </Button>
      </HStack>
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
        This will download a ZIP file containing all of your data in JSON
        format.
      </Text>

      <Box>
        <Button as="a" href="/api/users/download" download="linksort-data.zip">
          Download Data
        </Button>
      </Box>
    </VStack>
  );
}

function ImportPocket() {
  const inputRef = useRef();
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setIsUploading(true);
    try {
      await fetch("/api/links/import-pocket", {
        method: "POST",
        body: form,
        headers: { "X-Csrf-Token": csrfStore.get() },
        credentials: "same-origin",
      });
      toast({
        title: "Import complete",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    } catch (e) {
      toast({
        title: "Import failed",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <VStack maxWidth="40ch" spacing={4} align="left">
      <Heading as="h2" size="md">
        Import from Pocket
      </Heading>
      <input
        ref={inputRef}
        id="pocket-file"
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <Button as="label" htmlFor="pocket-file" isLoading={isUploading}>
        Upload CSV
      </Button>
    </VStack>
  );
}

function Danger() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const mutation = useDeleteUser();
  const formik = useFormik({
    initialValues: {},
    onSubmit: suppressMutationErrors(mutation.mutateAsync),
  });

  return (
    <VStack maxWidth="40ch" spacing={4} align="left">
      <Heading as="h2" size="md">
        Danger
      </Heading>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <VStack
            as="form"
            spacing={4}
            align="left"
            onSubmit={formik.handleSubmit}
            padding={6}
          >
            <Text fontSize={"lg"} fontWeight={"semibold"}>
              Are you sure you want to delete your account?
            </Text>
            <Text fontSize={"md"} fontWeight={"normal"}>
              This action cannot be reversed and it will not be possible to
              recover your data.
            </Text>
            <HStack justifyContent={"flex-end"}>
              <Button
                bgColor={"red.800"}
                color={"white"}
                type="submit"
                onClick={formik.handleSubmit}
                isLoading={formik.isSubmitting}
              >
                Yes, Delete
              </Button>
              <Button onClick={onClose} autoFocus>
                No, Cancel
              </Button>
            </HStack>
          </VStack>
        </ModalContent>
      </Modal>

      <Text>
        This will instantly delete your account and all of your data. Please be
        careful.
      </Text>

      <Box>
        <Button colorScheme="red" onClick={onOpen}>
          Delete account
        </Button>
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
      <APIAccess />
      <ImportPocket />
      <DownloadData />
      <Danger />
    </VStack>
  );
}
