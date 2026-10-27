import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";

import MessageList from "../MessageList";

// marked v17 is ESM-only, which CRA's jest can't transform.
jest.mock("marked", () => ({
  marked: (text) => `<p>${text}</p>`,
}));

const CHOICES_TEXT =
  'Want me to create a "Couch Options" folder?\n\n```choices\nYes, do it\nNo thanks\n```';

function renderList(props) {
  return render(
    <ChakraProvider>
      <MessageList
        isStreaming={false}
        handleCreateConversation={() => {}}
        onSendMessage={() => {}}
        {...props}
      />
    </ChakraProvider>
  );
}

describe("MessageList choice prompts", () => {
  it("renders live choice buttons for the last assistant message and sends the clicked option", () => {
    const onSendMessage = jest.fn();

    renderList({
      messages: [
        { id: "1", role: "user", text: "Organize my links", isToolUse: false },
        { id: "2", role: "assistant", text: CHOICES_TEXT, isToolUse: false },
      ],
      onSendMessage,
    });

    const yesButton = screen.getByRole("button", { name: "Yes, do it" });
    expect(yesButton).toBeEnabled();
    expect(screen.getByRole("button", { name: "No thanks" })).toBeEnabled();

    // The raw markup must never be shown.
    expect(screen.queryByText(/```/)).not.toBeInTheDocument();
    expect(screen.queryByText(/choices/)).not.toBeInTheDocument();

    fireEvent.click(yesButton);
    expect(onSendMessage).toHaveBeenCalledWith("Yes, do it");
  });

  it("renders answered choice prompts as inactive with the answer indicated", () => {
    const onSendMessage = jest.fn();

    renderList({
      messages: [
        { id: "1", role: "assistant", text: CHOICES_TEXT, isToolUse: false },
        { id: "2", role: "user", text: "Yes, do it", isToolUse: false },
        { id: "3", role: "assistant", text: "Done!", isToolUse: false },
      ],
      onSendMessage,
    });

    const yesButton = screen.getByRole("button", { name: "Yes, do it" });
    const noButton = screen.getByRole("button", { name: "No thanks" });

    expect(yesButton).toBeDisabled();
    expect(noButton).toBeDisabled();

    fireEvent.click(yesButton);
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("disables choice buttons while a response is streaming", () => {
    renderList({
      messages: [
        { id: "1", role: "assistant", text: CHOICES_TEXT, isToolUse: false },
      ],
      isStreaming: true,
      streamingResponse: { text: "Thinking", content: [{ type: "text", content: "Thinking" }], toolUses: {} },
    });

    expect(screen.getByRole("button", { name: "Yes, do it" })).toBeDisabled();
  });

  it("hides synthetic link review trigger messages", () => {
    renderList({
      messages: [
        {
          id: "1",
          role: "user",
          kind: "link_review_trigger",
          text: "SYNTHETIC REVIEW INSTRUCTIONS",
          isToolUse: false,
        },
        { id: "2", role: "assistant", text: "Welcome back!", isToolUse: false },
      ],
    });

    expect(screen.queryByText(/SYNTHETIC REVIEW INSTRUCTIONS/)).not.toBeInTheDocument();
    expect(screen.getByText(/Welcome back!/)).toBeInTheDocument();
  });
});
