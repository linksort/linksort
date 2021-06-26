import React, { useRef } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Box,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useFormik } from "formik";

export default function TopRightNewLinkPopover() {
  const focus = useRef();
  const mutation = {};
  const formik = useFormik({
    initialValues: {
      url: "",
    },
    onSubmit: mutation.mutateAsync,
  });

  return (
    <Popover placement="bottom-end" initialFocusRef={focus}>
      <PopoverTrigger>
        <Button colorScheme="brand" leftIcon={<AddIcon />}>
          New Link
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>
          <Heading fontSize="xl" fontWeight="semibold" my={1}>
            Add a new link
          </Heading>
        </PopoverHeader>
        <PopoverBody>
          <Box as="form" onSubmit={formik.handleSubmit} mt={1}>
            <FormControl
              id="url"
              isInvalid={mutation.error?.message || mutation.error?.url}
              mb={6}
            >
              <FormLabel>URL</FormLabel>
              <Input
                type="text"
                name="url"
                fontFamily="mono"
                placeholder="https://my-special-link.com"
                onChange={formik.handleChange}
                value={formik.values.url}
                ref={focus}
                required
              />
              <FormErrorMessage>
                {mutation.error?.message || mutation.error?.email}
              </FormErrorMessage>
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
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
