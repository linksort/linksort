import React from "react";
import { useParams, Link as RouterLink, useHistory } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  FormControl,
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

import { useDeleteLink, useLink, useUpdateLink } from "../hooks/links";
import { suppressMutationErrors } from "../utils/mutations";
import LoadingScreen from "../components/LoadingScreen";

export default function Link() {
  const history = useHistory();
  const { linkId } = useParams();
  const { data: link, isLoading, isSuccess } = useLink(linkId);
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
    },
    enableReinitialize: true,
    onSubmit: suppressMutationErrors((params) =>
      mutation.mutateAsync(params).then(() => {
        history.goBack();
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

  if (isSuccess && link) {
    return (
      <Box
        as="form"
        maxWidth="60ch"
        onSubmit={formik.handleSubmit}
        paddingX={[0, 0, 6, 6]}
        paddingY={6}
      >
        <FormControl id="title" mb={6}>
          <FormLabel>Title</FormLabel>
          <Input
            type="text"
            name="title"
            onChange={formik.handleChange}
            value={formik.values.title}
            autoFocus
          />
        </FormControl>
        <FormControl id="url" mb={6}>
          <FormLabel>URL</FormLabel>
          <Input
            type="text"
            name="url"
            fontFamily="mono"
            onChange={formik.handleChange}
            value={formik.values.url}
          />
        </FormControl>
        <FormControl id="description" mb={6}>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            onChange={formik.handleChange}
            value={formik.values.description}
          />
        </FormControl>
        <FormControl id="favicon" mb={6}>
          <FormLabel>Favicon</FormLabel>
          <Input
            type="text"
            name="favicon"
            fontFamily="mono"
            onChange={formik.handleChange}
            value={formik.values.favicon}
          />
        </FormControl>
        <FormControl id="image" mb={6}>
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
        </FormControl>
        <FormControl id="site" mb={6}>
          <FormLabel>Site</FormLabel>
          <Input
            type="text"
            name="site"
            onChange={formik.handleChange}
            value={formik.values.site}
          />
        </FormControl>
        <FormControl id="isFavorite" mb={6}>
          <FormLabel>Favorite</FormLabel>
          <Switch
            name="isFavorite"
            isChecked={formik.values.isFavorite}
            onChange={formik.handleChange}
          />
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
            <Button colorScheme="red" onClick={handleDelete}>
              Delete
            </Button>
          </HStack>
          <HStack spacing={4}>
            <Button as={RouterLink} to="/">
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
    );
  }
}
