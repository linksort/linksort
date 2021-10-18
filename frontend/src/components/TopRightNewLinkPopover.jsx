import React, { useRef, useState } from "react";
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
  IconButton,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useFormik } from "formik";
import { useCreateLink } from "../hooks/links";
import { suppressMutationErrors } from "../utils/mutations";

export default function TopRightNewLinkPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const focus = useRef();
  const mutation = useCreateLink();
  const formik = useFormik({
    initialValues: {
      url: "",
    },
    onSubmit: suppressMutationErrors(handleSubmit),
  });

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    formik.resetForm();
    setIsOpen(false);
  }

  async function handleSubmit(params) {
    await mutation.mutateAsync(params);
    handleClose();
  }

  return (
    <Popover
      placement="bottom-end"
      isOpen={isOpen}
      onClose={handleClose}
      initialFocusRef={focus}
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Box>
          <Button
            colorScheme="brand"
            leftIcon={<AddIcon />}
            onClick={handleOpen}
            display={["none", "none", "none", "none", "block"]}
          >
            New Link
          </Button>
          <IconButton
            borderRightRadius="none"
            colorScheme="brand"
            icon={<AddIcon />}
            onClick={handleOpen}
            display={["block", "block", "block", "block", "none"]}
          />
        </Box>
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
                {mutation.error?.message || mutation.error?.url}
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
