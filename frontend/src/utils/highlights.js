// Pure DOM utilities for anchoring highlights to article text.
//
// A highlight is stored as a text quote (W3C Web Annotation
// TextQuoteSelector): the `exact` text plus up to 64 characters of `prefix`
// and `suffix` context, and `start`/`end` offsets used only as a hint. All
// text is whitespace-normalized (runs of whitespace collapse to one space,
// leading/trailing whitespace dropped) in both directions so that quotes
// round-trip through the API and survive re-rendering.

export const AFFIX_LENGTH = 64;
export const HIGHLIGHT_CLASS = "ls-highlight";
export const HIGHLIGHT_ATTR = "data-highlight-id";

const SKIPPED_PARENTS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

// Elements that start a new line when rendered. Text on either side of one
// is separated by a (virtual) space so quotes spanning paragraphs read
// "ends. Second" rather than "ends.Second" even when the HTML has no
// whitespace between the blocks.
const BLOCK_TAGS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BR", "CAPTION", "DD", "DETAILS",
  "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1",
  "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "LI", "MAIN", "NAV", "OL", "P",
  "PRE", "SECTION", "SUMMARY", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD",
  "TR", "UL",
]);

function nearestBlock(node, root) {
  let n = node.parentNode;
  while (n && n !== root) {
    if (BLOCK_TAGS.has(n.nodeName)) return n;
    n = n.parentNode;
  }
  return root;
}

function isWhitespace(ch) {
  return (
    ch === " " ||
    ch === "\n" ||
    ch === "\t" ||
    ch === "\r" ||
    ch === "\f" ||
    ch === "\v" ||
    ch === "\u00a0"
  );
}

/** Collapses whitespace runs to a single space and trims the ends. */
export function normalizeWhitespace(s) {
  return (s || "").replace(/[\s\u00a0]+/g, " ").trim();
}

/**
 * Walks the text nodes under `root` and returns the normalized text plus,
 * for every character of it, the DOM text node and offset it came from.
 * A collapsed whitespace run maps to its first character.
 */
export function textIndex(root) {
  const nodes = [];
  const offsets = [];
  let text = "";
  // A pending space is emitted before the next non-space character. It maps
  // to the first whitespace character of its run, or, for a virtual space at
  // a block boundary, to that next character.
  let pendingSpace = false;
  let pendingNode = null;
  let pendingOffset = 0;
  let lastBlock = null;

  const doc = root.ownerDocument || document;
  const walker = doc.createTreeWalker(root, 5 /* SHOW_ELEMENT | SHOW_TEXT */);

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === 1) {
      if (text.length > 0 && !pendingSpace && BLOCK_TAGS.has(node.nodeName)) {
        pendingSpace = true;
        pendingNode = null;
      }
      node = walker.nextNode();
      continue;
    }

    const parent = node.parentNode;
    if (parent && SKIPPED_PARENTS.has(parent.nodeName)) {
      node = walker.nextNode();
      continue;
    }

    const block = nearestBlock(node, root);
    if (text.length > 0 && !pendingSpace && block !== lastBlock) {
      pendingSpace = true;
      pendingNode = null;
    }
    lastBlock = block;

    const data = node.data;
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      if (isWhitespace(ch)) {
        if (text.length > 0 && (!pendingSpace || pendingNode === null)) {
          // Start a whitespace run, or give a virtual block-boundary space
          // a real character to anchor to.
          pendingSpace = true;
          pendingNode = node;
          pendingOffset = i;
        }
        continue;
      }

      if (pendingSpace) {
        text += " ";
        nodes.push(pendingNode || node);
        offsets.push(pendingNode ? pendingOffset : i);
        pendingSpace = false;
        pendingNode = null;
      }

      text += ch;
      nodes.push(node);
      offsets.push(i);
    }

    node = walker.nextNode();
  }

  return { text, nodes, offsets };
}

function comparePoint(node, offset, otherNode, otherOffset) {
  const doc = node.ownerDocument || document;
  const r = doc.createRange();
  r.setStart(node, offset);
  r.setEnd(node, offset);
  // -1: other point is before, 0: same, 1: after.
  return -r.comparePoint(otherNode, otherOffset);
}

/**
 * Converts a DOM boundary point to an offset into the normalized text: the
 * number of normalized characters that come before the point.
 */
function offsetOfPoint(index, node, offset) {
  const { nodes, offsets } = index;
  let lo = 0;
  let hi = nodes.length;

  // Binary search for the first indexed character at or after the point.
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (comparePoint(nodes[mid], offsets[mid], node, offset) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

function isInside(root, node) {
  return node === root || root.contains(node);
}

/**
 * Describes the current selection as a text quote relative to `root`, or
 * returns null when there is no usable selection inside the root.
 */
export function describeSelection(root, selection) {
  if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!isInside(root, range.startContainer) || !isInside(root, range.endContainer)) {
    return null;
  }

  return describeRange(root, range);
}

/** Like describeSelection but for an explicit Range inside `root`. */
export function describeRange(root, range) {
  const index = textIndex(root);
  const { text } = index;

  let start = offsetOfPoint(index, range.startContainer, range.startOffset);
  let end = offsetOfPoint(index, range.endContainer, range.endOffset);

  if (end <= start) {
    return null;
  }

  // Trim whitespace from the quote itself.
  while (start < end && text[start] === " ") start++;
  while (end > start && text[end - 1] === " ") end--;

  if (end <= start) {
    return null;
  }

  return {
    exact: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - AFFIX_LENGTH), start),
    suffix: text.slice(end, end + AFFIX_LENGTH),
    start,
    end,
  };
}

function commonSuffixLength(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) {
    n++;
  }
  return n;
}

function commonPrefixLength(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) {
    n++;
  }
  return n;
}

/**
 * Finds the best position of `highlight` in the normalized text, or -1.
 * When `exact` occurs more than once, the occurrence whose surrounding text
 * best matches the stored prefix/suffix wins; `start` breaks ties.
 * Prefix/suffix comparison ignores outer whitespace because the API trims
 * string fields.
 */
export function findQuote(text, highlight) {
  const exact = normalizeWhitespace(highlight.exact);
  if (!exact) {
    return -1;
  }

  const candidates = [];
  let pos = text.indexOf(exact);
  while (pos !== -1) {
    candidates.push(pos);
    pos = text.indexOf(exact, pos + 1);
  }

  if (candidates.length === 0) {
    return -1;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const prefix = normalizeWhitespace(highlight.prefix);
  const suffix = normalizeWhitespace(highlight.suffix);
  const hint = typeof highlight.start === "number" ? highlight.start : 0;

  let best = candidates[0];
  let bestScore = -1;
  let bestDistance = Infinity;

  for (const c of candidates) {
    const before = text.slice(Math.max(0, c - AFFIX_LENGTH * 2), c).trimEnd();
    const after = text.slice(c + exact.length, c + exact.length + AFFIX_LENGTH * 2).trimStart();
    const score = commonSuffixLength(before, prefix) + commonPrefixLength(after, suffix);
    const distance = Math.abs(c - hint);

    if (score > bestScore || (score === bestScore && distance < bestDistance)) {
      best = c;
      bestScore = score;
      bestDistance = distance;
    }
  }

  return best;
}

/**
 * Returns a Range covering `highlight` inside `root`, or null when its text
 * can no longer be found (an "orphaned" highlight).
 */
export function locate(root, highlight, index = null) {
  if (!root || !highlight) {
    return null;
  }

  const idx = index || textIndex(root);
  const pos = findQuote(idx.text, highlight);
  if (pos === -1) {
    return null;
  }

  const length = normalizeWhitespace(highlight.exact).length;
  const last = pos + length - 1;
  const doc = root.ownerDocument || document;
  const range = doc.createRange();
  range.setStart(idx.nodes[pos], idx.offsets[pos]);
  range.setEnd(idx.nodes[last], idx.offsets[last] + 1);

  return range;
}

function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** The accessible name for a highlight's first mark. */
export function highlightLabel(highlight) {
  const base = `Highlight: ${truncate(normalizeWhitespace(highlight.exact), 80)}`;
  const note = normalizeWhitespace(highlight.note);
  return note ? `${base}; note: ${truncate(note, 80)}` : base;
}

/**
 * Wraps every text-node segment of `range` in a <mark> so partial nodes and
 * multi-node ranges work (surroundContents would throw). Returns the marks.
 * Only the first mark is a tab stop; the others carry the id for styling.
 */
export function wrapRange(range, id, { label } = {}) {
  const doc = range.startContainer.ownerDocument || document;
  const ancestor = range.commonAncestorContainer;
  const segments = [];

  const consider = (node) => {
    if (node.nodeType !== 3) return;
    const s = node === range.startContainer ? range.startOffset : 0;
    const e = node === range.endContainer ? range.endOffset : node.length;
    if (e <= s) return;
    if (node.data.slice(s, e).trim() === "") return;
    // A node intersects the range unless it ends before it or starts after it.
    if (node !== range.startContainer && comparePoint(node, node.length, range.startContainer, range.startOffset) <= 0) {
      return;
    }
    if (node !== range.endContainer && comparePoint(node, 0, range.endContainer, range.endOffset) >= 0) {
      return;
    }
    segments.push({ node, s, e });
  };

  if (ancestor.nodeType === 3) {
    consider(ancestor);
  } else {
    const walker = doc.createTreeWalker(ancestor, 4 /* SHOW_TEXT */);
    let n = walker.nextNode();
    while (n) {
      consider(n);
      n = walker.nextNode();
    }
  }

  const marks = [];
  segments.forEach(({ node, s, e }, i) => {
    let target = node;
    if (e < target.length) {
      target.splitText(e);
    }
    if (s > 0) {
      target = target.splitText(s);
    }

    const mark = doc.createElement("mark");
    mark.className = HIGHLIGHT_CLASS;
    mark.setAttribute(HIGHLIGHT_ATTR, id);
    if (i === 0) {
      mark.setAttribute("tabindex", "0");
      mark.setAttribute("role", "button");
      if (label) {
        mark.setAttribute("aria-label", label);
      }
    }

    target.parentNode.insertBefore(mark, target);
    mark.appendChild(target);
    marks.push(mark);
  });

  return marks;
}

/** Removes every highlight mark under `root`, restoring the original DOM. */
export function unwrapAll(root) {
  if (!root) return;
  const marks = root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
  root.normalize();
}

/** All marks under `root` belonging to one highlight, in document order. */
export function marksFor(root, id) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`)).filter(
    (m) => m.getAttribute(HIGHLIGHT_ATTR) === id
  );
}

/**
 * Applies every highlight to the article under `root`. Idempotent: existing
 * marks are removed first. Returns the set of ids that could not be located.
 */
export function applyHighlights(root, highlights) {
  unwrapAll(root);
  const orphaned = new Set();
  if (!root || !highlights || highlights.length === 0) {
    return orphaned;
  }

  // Locate everything against the clean DOM first, then wrap. Wrapping
  // splits text nodes, which would invalidate a shared index.
  const index = textIndex(root);
  const located = highlights.map((h) => ({ h, range: locate(root, h, index) }));

  // Wrap later-starting ranges first so earlier splits don't disturb them.
  located
    .filter(({ range }) => range)
    .sort((a, b) => b.range.compareBoundaryPoints(0 /* START_TO_START */, a.range))
    .forEach(({ h, range }) => {
      wrapRange(range, h.id, { label: highlightLabel(h) });
    });

  located.forEach(({ h, range }) => {
    if (!range) orphaned.add(h.id);
  });

  return orphaned;
}
