// Parses the assistant's trailing ```choices fenced block into clickable
// options. See the "Clickable Choice Prompts" section of the backend system
// prompt for the contract.

export const MAX_CHOICES = 5;
export const MIN_CHOICES = 2;

/**
 * Splits a trailing ```choices block off of an assistant message.
 *
 * Returns { body, choices, partial }:
 * - body: the message text with the choices block removed.
 * - choices: array of 2-5 option strings, or null when there is no valid
 *   complete block.
 * - partial: true when the text ends in an unterminated fence that could
 *   still become a choices block (i.e. while streaming). The partial block
 *   text is stripped from body and no choices are returned.
 */
export function splitChoices(text) {
  if (!text) {
    return { body: text || "", choices: null, partial: false };
  }

  // Complete block: anchored to the end of the message (trailing whitespace
  // allowed). Use the last occurrence of the opening fence.
  const start = text.lastIndexOf("```choices");
  if (start !== -1) {
    const match = text
      .slice(start)
      .match(/^```choices[ \t]*\n([\s\S]*?)\n?```[\s]*$/);

    if (match) {
      const body = text.slice(0, start).trimEnd();
      const lines = match[1]
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < MIN_CHOICES) {
        return { body, choices: null, partial: false };
      }

      return { body, choices: lines.slice(0, MAX_CHOICES), partial: false };
    }
  }

  // Partial block while streaming: the text ends with an unterminated fence
  // whose info string is a prefix of "choices" (e.g. "```", "```cho",
  // "```choices\nYes"). Hide it until the stream completes. Fences that are
  // clearly not choices blocks (e.g. "```js") are left alone.
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 === 1) {
    // Odd number of fences: the last one opens an unclosed block.
    const lastFence = text.lastIndexOf("```");
    const rest = text.slice(lastFence + 3);
    const newlineIndex = rest.indexOf("\n");
    const info = (newlineIndex === -1 ? rest : rest.slice(0, newlineIndex)).trim();

    if ("choices".startsWith(info)) {
      return { body: text.slice(0, lastFence).trimEnd(), choices: null, partial: true };
    }
  }

  return { body: text, choices: null, partial: false };
}
