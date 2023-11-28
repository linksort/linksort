import React from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Switch,
  Tag,
  Text,
  Textarea,
  Wrap,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import { pick } from "lodash";

import { useDeleteLink, useLink, useUpdateLink } from "../hooks/links";
import { suppressMutationErrors } from "../utils/mutations";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import TagEditor from "../components/TagEditor";

export default function LinkUpdate() {
  const history = useHistory();
  const { linkId } = useParams();
  const { data: link, isLoading, isError, error } = useLink(linkId);
  const mutation = useUpdateLink(linkId);
  const deleteMutation = useDeleteLink(linkId);
  const formik = useFormik({
    initialValues: link || {
      title: "",
      url: "",
      description: "",
      site: "",
      favicon: "",
      image: "",
      createdAt: "",
      isFavorite: false,
      folderId: "",
      userTags: [],
    },
    enableReinitialize: true,
    onSubmit: suppressMutationErrors((params) =>
      mutation
        .mutateAsync(
          pick(params, [
            "title",
            "url",
            "description",
            "site",
            "favicon",
            "image",
            "isFavorite",
            "userTags"
          ])
        )
        .then(() => {
          history.replace(`/links/${link.id}`);
        })
    ),
  });

  function handleDelete(e) {
    e.preventDefault();
    deleteMutation.mutateAsync().then(() => {
      history.goBack();
    });
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <Box maxWidth="5xl" marginX="auto">
      <Box as="form" maxWidth="60ch" onSubmit={formik.handleSubmit} padding={6}>
        <FormControl id="title" mb={6} isInvalid={mutation.error?.title}>
          <FormLabel>Title</FormLabel>
          <Input
            type="text"
            name="title"
            onChange={formik.handleChange}
            value={formik.values.title}
            autoFocus
          />
          <FormErrorMessage>{mutation.error?.title}</FormErrorMessage>
        </FormControl>
        <FormControl id="url" mb={6} isInvalid={mutation.error?.url}>
          <FormLabel>URL</FormLabel>
          <Input
            type="text"
            name="url"
            fontFamily="mono"
            onChange={formik.handleChange}
            value={formik.values.url}
          />
          <FormErrorMessage>{mutation.error?.url}</FormErrorMessage>
        </FormControl>
        <FormControl
          id="description"
          mb={6}
          isInvalid={mutation.error?.description}
        >
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            onChange={formik.handleChange}
            value={formik.values.description}
          />
          <FormErrorMessage>{mutation.error?.description}</FormErrorMessage>
        </FormControl>
        <FormControl id="favicon" mb={6} isInvalid={mutation.error?.favicon}>
          <FormLabel>Favicon</FormLabel>
          <Input
            type="text"
            name="favicon"
            fontFamily="mono"
            onChange={formik.handleChange}
            value={formik.values.favicon}
          />
          <FormErrorMessage>{mutation.error?.favicon}</FormErrorMessage>
        </FormControl>
        <FormControl id="image" mb={6} isInvalid={mutation.error?.image}>
          <FormLabel>Image</FormLabel>
          <InputGroup size="md">
            <Input
              type="text"
              name="image"
              fontFamily="mono"
              onChange={formik.handleChange}
              value={formik.values.image}
              paddingRight="8.5rem"
            />
            <InputRightElement width="8rem">
              <Button
                height="1.75rem"
                size="sm"
                onClick={() => formik.setFieldValue("image", "")}
                mr={2}
              >
                Remove image
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{mutation.error?.image}</FormErrorMessage>
        </FormControl>
        <FormControl id="site" mb={6} isInvalid={mutation.error?.site}>
          <FormLabel>Site</FormLabel>
          <Input
            type="text"
            name="site"
            onChange={formik.handleChange}
            value={formik.values.site}
          />
          <FormErrorMessage>{mutation.error?.site}</FormErrorMessage>
        </FormControl>
        <FormControl id="isFavorite" mb={6}>
          <FormLabel>Favorite</FormLabel>
          <Switch
            name="isFavorite"
            isChecked={formik.values.isFavorite}
            onChange={formik.handleChange}
          />
        </FormControl>
        <FormControl id="utags" mb={6}>
          <FormLabel>Personal tags</FormLabel>
          <TagEditor tags={formik.values.userTags} onChange={tags => formik.setFieldValue("userTags", tags)} />
        </FormControl>

        <FormControl id="tags" mb={6}>
          <FormLabel>Auto tags</FormLabel>
          {link.tagDetails.length > 0 ? (
            <Wrap>
              {link.tagDetails.map((detail) => (
                <Tag key={detail.path} marginRight={2}>
                  {detail.path
                    .slice(1, detail.path.length)
                    .replaceAll("/", " -> ")}
                </Tag>
              ))}
            </Wrap>
          ) : (
            <Text color="gray.600">
              No auto tags were assigned to this link.
            </Text>
          )}
        </FormControl>

        <Flex justifyContent="space-between">
          <HStack spacing={4}>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={deleteMutation.isLoading}
            >
              Delete
            </Button>
          </HStack>
          <HStack spacing={4}>
            <Button onClick={() => history.replace(`/links/${link.id}`)}>
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={formik.isSubmitting}
              colorScheme="brand"
            >
              Update
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}
