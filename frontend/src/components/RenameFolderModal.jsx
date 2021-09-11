import React from "react";
import {
  Box,
  Flex,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalOverlay,
  FormControl,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useFormik } from "formik";

import { useUpdateFolder } from "../hooks/folders";
import { suppressMutationErrors } from "../utils/mutations";

export default function RenameFolderModal({ isOpen, onClose, folder }) {
  const mutation = useUpdateFolder(folder);
  const formik = useFormik({
    initialValues: { name: folder.name },
    enableReinitialize: true,
    onSubmit: suppressMutationErrors(async (params) => {
      await mutation.mutateAsync(params);
      onClose();
    }),
  });

  function handleClose(e) {
    formik.resetForm();
    mutation.reset();
    onClose(e);
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <Box as="form" onSubmit={formik.handleSubmit} padding={4}>
          <FormControl
            isInvalid={mutation.error?.message || mutation.error?.name}
          >
            <Flex>
              <Input
                type="text"
                name="name"
                value={formik.values.name}
                borderRightRadius={["md", "none"]}
                required
                autoFocus
                onChange={formik.handleChange}
              />
              <Button
                paddingX={8}
                type="submit"
                colorScheme="brand"
                borderLeftRadius={["md", "none"]}
              >
                Rename
              </Button>
            </Flex>
            <FormErrorMessage>{mutation.error?.name}</FormErrorMessage>
          </FormControl>
        </Box>
      </ModalContent>
    </Modal>
  );
}
