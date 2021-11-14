import React from "react";
import { FeedbackFish } from "@feedback-fish/react";

import { useUser } from "../hooks/auth";

export default function GiveFeedback({ children }) {
  const user = useUser();

  return (
    <FeedbackFish projectId="25d4c57c4deea1" userId={user.email}>
      {children}
    </FeedbackFish>
  );
}
