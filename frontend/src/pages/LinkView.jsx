import React from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Heading,
  Box,
  HStack,
  Text,
  Tag,
  VStack,
  Wrap,
  Button,
  Skeleton,
  Link,
  IconButton,
} from "@chakra-ui/react";
import {
  StarIcon,
  ArrowBackIcon,
  EditIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";

import { useLink, useLinkOperations } from "../hooks/links";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import LinkItemFavicon from "../components/LinkItemFavicon";
import CoverImage from "../components/CoverImage";
import { StarBorderIcon } from "../components/CustomIcons";

export default function LinkView() {
  const history = useHistory();
  const { linkId } = useParams();
  const { data: link, isLoading, isError, error } = useLink(linkId);
  const { handleToggleIsFavorite, isFavoriting } = useLinkOperations(link);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError) {
    return <ErrorScreen error={error} />;
  }

  return (
    <VStack
      paddingLeft={[0, 0, 0, 0, 6]}
      paddingTop={6}
      spacing={6}
      align="left"
      maxWidth="70ch"
    >
      <HStack>
        <IconButton onClick={() => history.goBack()} icon={<ArrowBackIcon />} />
        <Button
          onClick={handleToggleIsFavorite}
          leftIcon={link.isFavorite ? <StarIcon /> : <StarBorderIcon />}
          isLoading={isFavoriting}
        >
          Favorite
        </Button>
        <Button
          onClick={() => history.replace(`/links/${link.id}/update`)}
          leftIcon={<EditIcon />}
        >
          Edit
        </Button>
        <Button
          as={Link}
          isExternal={true}
          href={link.url}
          leftIcon={<ExternalLinkIcon />}
        >
          Visit
        </Button>
      </HStack>

      <VStack align="left">
        <HStack spacing={0}>
          <LinkItemFavicon favicon={link.favicon} />
          <Text>{link.site}</Text>
        </HStack>
        <Heading as="h1">{link.title}</Heading>
      </VStack>

      {link.image && (
        <Box
          height="22rem"
          borderRadius="lg"
          overflow="hidden"
          borderColor="gray.100"
          borderWidth="thin"
        >
          <CoverImage
            link={link}
            width="100%"
            height="22rem"
            fallback={<Skeleton height="100%" width="100%" />}
          />
        </Box>
      )}

      <VStack align="left">
        <Heading as="h6" fontSize="sm">
          Description
        </Heading>

        {link.description.length > 0 ? (
          <Text>{link.description}</Text>
        ) : (
          <Text color="gray.600">No description was found for this link.</Text>
        )}
      </VStack>

      <VStack align="left">
        <Heading as="h6" fontSize="sm">
          Auto Tags
        </Heading>
        {link.tagDetails.length > 0 ? (
          <Wrap>
            {link.tagDetails.map((detail) => (
              <Tag
                key={detail.path}
                marginRight={2}
                whiteSpace="nowrap"
                overflow="hidden"
              >
                {detail.path
                  .slice(1, detail.path.length)
                  .replaceAll("/", " -> ")}
              </Tag>
            ))}
          </Wrap>
        ) : (
          <Text color="gray.600">No auto tags were assigned to this link.</Text>
        )}
      </VStack>

      <VStack align="left" paddingBottom="5rem">
        <Heading as="h6" fontSize="sm">
          Corpus
        </Heading>
        {link.corpus.length > 512 ? (
          <Box
            className="prose"
            width="70ch"
            dangerouslySetInnerHTML={{
              __html: link.corpus
                .replaceAll("<html>", "")
                .replaceAll("<head>", "")
                .replaceAll("<body>", "")
                .replaceAll("</head>", "")
                .replaceAll("</html>", "")
                .replaceAll("</body>", ""),
            }}
          />
        ) : (
          <Text color="gray.600">No corpus was gathered this link.</Text>
        )}
      </VStack>
    </VStack>
  );
}
