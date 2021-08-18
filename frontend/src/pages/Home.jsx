import { Box } from "@chakra-ui/react";

import { useLinks } from "../api/links";

export default function Home() {
  const stuff = useLinks({ pageNumber: 0 });

  return (
    <Box>
      <pre>{JSON.stringify(stuff, null, 2)}</pre>
    </Box>
  );
}
