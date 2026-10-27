import { splitChoices } from "../choices";

describe("splitChoices", () => {
  it("returns the text unchanged when there is no block", () => {
    const text = "Hello! How can I help you today?";
    expect(splitChoices(text)).toEqual({
      body: text,
      choices: null,
      partial: false,
    });
  });

  it("handles empty and nullish input", () => {
    expect(splitChoices("")).toEqual({ body: "", choices: null, partial: false });
    expect(splitChoices(null)).toEqual({ body: "", choices: null, partial: false });
    expect(splitChoices(undefined)).toEqual({ body: "", choices: null, partial: false });
  });

  it("parses a trailing choices block", () => {
    const text =
      'Want me to create a "Couch Options" folder?\n\n```choices\nYes, do it\nNo thanks\nShow me the links first\n```';
    expect(splitChoices(text)).toEqual({
      body: 'Want me to create a "Couch Options" folder?',
      choices: ["Yes, do it", "No thanks", "Show me the links first"],
      partial: false,
    });
  });

  it("tolerates trailing whitespace after the block", () => {
    const text = "Proceed?\n\n```choices\nYes\nNo\n```\n  \n";
    expect(splitChoices(text)).toEqual({
      body: "Proceed?",
      choices: ["Yes", "No"],
      partial: false,
    });
  });

  it("ignores blank lines and trims options inside the block", () => {
    const text = "Pick one.\n\n```choices\n  Option A  \n\nOption B\n```";
    expect(splitChoices(text).choices).toEqual(["Option A", "Option B"]);
  });

  it("treats a single-option block as no choices but still strips it", () => {
    const text = "Proceed?\n\n```choices\nYes\n```";
    expect(splitChoices(text)).toEqual({
      body: "Proceed?",
      choices: null,
      partial: false,
    });
  });

  it("caps at five options", () => {
    const text = "Pick.\n\n```choices\nA\nB\nC\nD\nE\nF\nG\n```";
    expect(splitChoices(text).choices).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("does not parse a block that is not at the end", () => {
    const text = "Before\n\n```choices\nYes\nNo\n```\n\nAnd some text after.";
    expect(splitChoices(text)).toEqual({
      body: text,
      choices: null,
      partial: false,
    });
  });

  it("leaves non-choices code blocks alone", () => {
    const text = "Here is code:\n\n```js\nconsole.log(1)\n```";
    expect(splitChoices(text)).toEqual({
      body: text,
      choices: null,
      partial: false,
    });
  });

  it("uses the last choices block when there are several fences", () => {
    const text = "```js\nx\n```\n\nProceed?\n\n```choices\nYes\nNo\n```";
    expect(splitChoices(text)).toEqual({
      body: "```js\nx\n```\n\nProceed?",
      choices: ["Yes", "No"],
      partial: false,
    });
  });

  it("hides a partial fence while streaming", () => {
    expect(splitChoices("Proceed?\n\n``")).toEqual({
      body: "Proceed?\n\n``",
      choices: null,
      partial: false,
    });
    expect(splitChoices("Proceed?\n\n```")).toEqual({
      body: "Proceed?",
      choices: null,
      partial: true,
    });
    expect(splitChoices("Proceed?\n\n```cho")).toEqual({
      body: "Proceed?",
      choices: null,
      partial: true,
    });
    expect(splitChoices("Proceed?\n\n```choices\nYes, do")).toEqual({
      body: "Proceed?",
      choices: null,
      partial: true,
    });
  });

  it("does not hide a partial fence that cannot be a choices block", () => {
    const text = "Here:\n\n```json\n{";
    expect(splitChoices(text)).toEqual({
      body: text,
      choices: null,
      partial: false,
    });
  });
});
