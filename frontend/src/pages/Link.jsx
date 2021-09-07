import React from "react";
import { useParams, Link as RouterLink, useHistory } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Skeleton,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { useFormik } from "formik";

import { useLink, useUpdateLink } from "../hooks/links";
import { suppressMutationErrors } from "../utils/mutations";

export default function Link() {
  const history = useHistory();
  const { linkId } = useParams();
  const { data: link, isLoading, isSuccess } = useLink(linkId);
  const mutation = useUpdateLink(linkId);
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
    },
    enableReinitialize: true,
    onSubmit: (params) =>
      suppressMutationErrors(mutation.mutateAsync)(params).then(() => {
        history.goBack();
      }),
  });

  if (isLoading) {
    return (
      <Stack>
        <Skeleton height={8} />
        <Skeleton height={8} />
        <Skeleton height={8} />
        <Skeleton height={8} />
      </Stack>
    );
  }

  if (isSuccess && link) {
    return (
      <Box as="form" maxWidth="60ch" onSubmit={formik.handleSubmit}>
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
            readOnly
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
            readOnly
          />
        </FormControl>
        <FormControl id="image" mb={6}>
          <FormLabel>Image</FormLabel>
          <Input
            type="text"
            name="image"
            fontFamily="mono"
            onChange={formik.handleChange}
            value={formik.values.image}
            readOnly
          />
        </FormControl>
        <FormControl id="site" mb={6}>
          <FormLabel>Site</FormLabel>
          <Input
            type="text"
            name="site"
            onChange={formik.handleChange}
            value={formik.values.site}
            readOnly
          />
        </FormControl>
        <FormControl id="isFavorite" mb={6}>
          <FormLabel>Favorite</FormLabel>
          <Checkbox
            name="isFavorite"
            isChecked={formik.values.isFavorite}
            onChange={formik.handleChange}
          />
        </FormControl>

        <Flex justifyContent="flex-end">
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
