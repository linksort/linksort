import {
  textIndex,
  describeSelection,
  describeRange,
  locate,
  findQuote,
  wrapRange,
  unwrapAll,
  applyHighlights,
  normalizeWhitespace,
  highlightLabel,
} from "../highlights";

function mount(html) {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

function selectRange(range) {
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return sel;
}

function rangeOf(startNode, startOffset, endNode, endOffset) {
  const r = document.createRange();
  r.setStart(startNode, startOffset);
  r.setEnd(endNode, endOffset);
  return r;
}

// Finds the text node containing `needle` under root and returns [node, index].
function textNode(root, needle) {
  const walker = document.createTreeWalker(root, 4);
  let n = walker.nextNode();
  while (n) {
    const i = n.data.indexOf(needle);
    if (i !== -1) return [n, i];
    n = walker.nextNode();
  }
  throw new Error(`text not found: ${needle}`);
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection().removeAllRanges();
});

describe("normalizeWhitespace", () => {
  it("collapses runs and trims", () => {
    expect(normalizeWhitespace("  a \n\t b\u00a0 c  ")).toBe("a b c");
    expect(normalizeWhitespace("")).toBe("");
    expect(normalizeWhitespace(undefined)).toBe("");
  });
});

describe("textIndex", () => {
  it("concatenates text nodes with normalized whitespace and maps every char", () => {
    const root = mount("<p>Hello,\n   <em>brave</em>  new</p>\n<p>world.</p>");
    const idx = textIndex(root);
    expect(idx.text).toBe("Hello, brave new world.");
    expect(idx.nodes.length).toBe(idx.text.length);
    expect(idx.offsets.length).toBe(idx.text.length);

    // "b" of brave comes from the <em> text node at offset 0.
    const b = idx.text.indexOf("brave");
    expect(idx.nodes[b].data).toBe("brave");
    expect(idx.offsets[b]).toBe(0);

    // The space between paragraphs maps to the "\n" between them.
    const sp = idx.text.indexOf(" world");
    expect(idx.nodes[sp].data).toBe("\n");
  });

  it("drops leading and trailing whitespace", () => {
    const root = mount("<p>  </p><p> x </p><p>\n</p>");
    expect(textIndex(root).text).toBe("x");
  });

  it("skips script and style text", () => {
    const root = mount("<p>a</p><style>p{}</style><script>var x;</script><p>b</p>");
    expect(textIndex(root).text).toBe("a b");
  });
});

describe("describeSelection", () => {
  it("describes a selection within a single text node", () => {
    const root = mount("<p>The quick brown fox jumps over the lazy dog.</p>");
    const [n] = textNode(root, "quick");
    const sel = selectRange(rangeOf(n, 4, n, 15)); // "quick brown"
    expect(describeSelection(root, sel)).toEqual({
      exact: "quick brown",
      prefix: "The ",
      suffix: " fox jumps over the lazy dog.",
      start: 4,
      end: 15,
    });
  });

  it("trims whitespace at the selection edges", () => {
    const root = mount("<p>The quick brown fox.</p>");
    const [n] = textNode(root, "quick");
    const sel = selectRange(rangeOf(n, 3, n, 16)); // " quick brown "
    expect(describeSelection(root, sel)).toMatchObject({
      exact: "quick brown",
      start: 4,
      end: 15,
    });
  });

  it("spans nested inline elements and two paragraphs", () => {
    const root = mount(
      "<p>First <a href='#'>link <b>text</b></a> ends here.</p>\n<p>Second starts now.</p>"
    );
    const [s] = textNode(root, "link ");
    const [e, ei] = textNode(root, "Second starts now.");
    const sel = selectRange(rangeOf(s, 0, e, ei + 6));
    const d = describeSelection(root, sel);
    expect(d.exact).toBe("link text ends here. Second");
    expect(d.prefix).toBe("First ");
    expect(d.suffix).toBe(" starts now.");
  });

  it("handles element boundary points", () => {
    const root = mount("<p>one</p><p>two</p><p>three</p>");
    // From before the second <p> to after it.
    const sel = selectRange(rangeOf(root, 1, root, 2));
    expect(describeSelection(root, sel)).toMatchObject({ exact: "two", start: 4, end: 7 });
  });

  it("returns null for collapsed, empty, or outside selections", () => {
    const root = mount("<p>inside</p>");
    const outside = mount("<p>outside</p>");
    const [n] = textNode(root, "inside");
    expect(describeSelection(root, selectRange(rangeOf(n, 2, n, 2)))).toBeNull();
    const [o] = textNode(outside, "outside");
    expect(describeSelection(root, selectRange(rangeOf(o, 0, o, 3)))).toBeNull();
    window.getSelection().removeAllRanges();
    expect(describeSelection(root, window.getSelection())).toBeNull();
    expect(describeSelection(root, null)).toBeNull();
  });

  it("returns null for whitespace-only selections", () => {
    const root = mount("<p>a    b</p>");
    const [n] = textNode(root, "a");
    expect(describeRange(root, rangeOf(n, 1, n, 4))).toBeNull();
  });

  it("limits prefix and suffix to 64 characters", () => {
    const long = "x".repeat(100);
    const root = mount(`<p>${long} MID ${long}</p>`);
    const [n, i] = textNode(root, "MID");
    const d = describeRange(root, rangeOf(n, i, n, i + 3));
    expect(d.prefix).toHaveLength(64);
    expect(d.suffix).toHaveLength(64);
    expect(d.exact).toBe("MID");
  });
});

describe("findQuote / locate", () => {
  it("locates a unique quote", () => {
    const root = mount("<p>alpha beta gamma</p>");
    const range = locate(root, { exact: "beta" });
    expect(range.toString()).toBe("beta");
  });

  it("locates across nodes and normalizes whitespace in the quote", () => {
    const root = mount("<p>alpha\n  <i>beta</i>\n gamma</p>");
    const range = locate(root, { exact: "alpha   beta gamma" });
    expect(normalizeWhitespace(range.toString())).toBe("alpha beta gamma");
  });

  it("disambiguates repeated text by prefix and suffix", () => {
    const root = mount(
      "<p>I said hello to Ann. Then I said hello to Bob. Finally I said hello to Cy.</p>"
    );
    const r = locate(root, { exact: "hello", prefix: "Then I said", suffix: "to Bob." });
    const idx = textIndex(root);
    const d = describeRange(root, r);
    expect(d.prefix.endsWith("Then I said ")).toBe(true);
    expect(idx.text.slice(d.end, d.end + 8)).toBe(" to Bob.");
  });

  it("tolerates trimmed prefix/suffix (as the API stores them)", () => {
    const text = "say hi to Ann. say hi to Bob.";
    expect(findQuote(text, { exact: "hi", prefix: "Ann. say", suffix: "to Bob." })).toBe(
      text.lastIndexOf("hi")
    );
    expect(findQuote(text, { exact: "hi", prefix: "say", suffix: "to Ann." })).toBe(4);
  });

  it("uses start as a tiebreaker when context is equal", () => {
    const text = "ab ab ab ab";
    expect(findQuote(text, { exact: "ab", prefix: "", suffix: "", start: 6 })).toBe(6);
    expect(findQuote(text, { exact: "ab", prefix: "", suffix: "", start: 0 })).toBe(0);
  });

  it("returns null when the text is gone", () => {
    const root = mount("<p>nothing to see</p>");
    expect(locate(root, { exact: "unicorn" })).toBeNull();
    expect(locate(root, { exact: "   " })).toBeNull();
  });
});

describe("wrapRange / unwrapAll", () => {
  it("wraps a single-node partial range and restores the DOM", () => {
    const html = "<p>The quick brown fox.</p>";
    const root = mount(html);
    const marks = wrapRange(locate(root, { exact: "quick" }), "h1", { label: "L" });
    expect(marks).toHaveLength(1);
    expect(root.innerHTML).toBe(
      '<p>The <mark class="ls-highlight" data-highlight-id="h1" tabindex="0" role="button" aria-label="L">quick</mark> brown fox.</p>'
    );
    unwrapAll(root);
    expect(root.innerHTML).toBe(html);
    expect(root.firstChild.childNodes).toHaveLength(1);
  });

  it("produces one mark per text segment across elements and paragraphs", () => {
    const html = "<p>First <a href=\"#\">link</a> ends.</p><p>Second starts.</p>";
    const root = mount(html);
    const range = locate(root, { exact: "link ends. Second" });
    const marks = wrapRange(range, "h2");
    expect(marks).toHaveLength(3);
    expect(marks.map((m) => m.textContent)).toEqual(["link", " ends.", "Second"]);
    // The link is still a link.
    expect(marks[0].parentNode.tagName).toBe("A");
    // Only the first segment is a tab stop.
    expect(marks[0].getAttribute("tabindex")).toBe("0");
    expect(marks[1].hasAttribute("tabindex")).toBe(false);
    expect(root.querySelectorAll("mark[data-highlight-id='h2']")).toHaveLength(3);

    unwrapAll(root);
    expect(root.innerHTML).toBe(html);
  });

  it("skips whitespace-only segments between blocks", () => {
    const root = mount("<p>one</p>\n   \n<p>two</p>");
    const marks = wrapRange(locate(root, { exact: "one two" }), "h3");
    expect(marks.map((m) => m.textContent)).toEqual(["one", "two"]);
  });
});

describe("applyHighlights", () => {
  it("is idempotent and reports orphans", () => {
    const html = "<p>alpha beta gamma delta</p>";
    const root = mount(html);
    const highlights = [
      { id: "a", exact: "alpha" },
      { id: "d", exact: "delta" },
      { id: "x", exact: "missing" },
    ];
    let orphans = applyHighlights(root, highlights);
    expect([...orphans]).toEqual(["x"]);
    expect(root.querySelectorAll("mark")).toHaveLength(2);

    orphans = applyHighlights(root, highlights);
    expect(root.querySelectorAll("mark")).toHaveLength(2);
    expect(root.textContent).toBe("alpha beta gamma delta");

    applyHighlights(root, []);
    expect(root.innerHTML).toBe(html);
  });

  it("applies two highlights in the same text node in document order", () => {
    const root = mount("<p>one two three four</p>");
    applyHighlights(root, [
      { id: "b", exact: "three" },
      { id: "a", exact: "one" },
    ]);
    const marks = Array.from(root.querySelectorAll("mark"));
    expect(marks.map((m) => [m.getAttribute("data-highlight-id"), m.textContent])).toEqual([
      ["a", "one"],
      ["b", "three"],
    ]);
  });

  it("anchors the same word to two different places", () => {
    const root = mount("<p>cat sat. the cat ran. a cat slept.</p>");
    applyHighlights(root, [
      { id: "first", exact: "cat", prefix: "", suffix: "sat.", start: 0 },
      { id: "third", exact: "cat", prefix: "ran. a", suffix: "slept.", start: 24 },
    ]);
    expect(root.innerHTML).toBe(
      '<p><mark class="ls-highlight" data-highlight-id="first" tabindex="0" role="button" aria-label="Highlight: cat">cat</mark> sat. the cat ran. a <mark class="ls-highlight" data-highlight-id="third" tabindex="0" role="button" aria-label="Highlight: cat">cat</mark> slept.</p>'
    );
  });
});

describe("highlightLabel", () => {
  it("includes the note and truncates", () => {
    expect(highlightLabel({ exact: "short", note: "" })).toBe("Highlight: short");
    expect(highlightLabel({ exact: "short", note: "why" })).toBe("Highlight: short; note: why");
    expect(highlightLabel({ exact: "x".repeat(100) })).toBe(`Highlight: ${"x".repeat(79)}…`);
  });
});
