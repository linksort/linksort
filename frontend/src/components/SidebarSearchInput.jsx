import React, { useEffect, useRef, useState } from "react";
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";
import { CloseIcon, Search2Icon } from "@chakra-ui/icons";

import { useFilters } from "../hooks/filters";

// Geometry shared with SidebarButton so the icon and edges line up with the
// ghost rows beneath: the row starts 0.5rem left of the sidebar's text column,
// the 14px icon sits at that column, and text starts 0.625rem after the icon.
const ROW_OUTDENT = "0.5rem";
const ICON_SIZE = "3.5"; // 14px
const TEXT_INSET = "2rem"; // 0.5rem + 14px icon + 0.625rem gap
const FIELD_HEIGHT = "2rem";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * The always-visible search field at the top of the sidebar's filter group.
 * The URL (`?search=`) is the source of truth; local state only diverges
 * while the user is typing. Enter searches, × clears, Escape reverts.
 */
export default function SidebarSearchInput({
  onNavigate,
  enableShortcut = false,
}) {
  const { searchQuery, handleSearch } = useFilters();
  const [value, setValue] = useState(searchQuery);
  const inputRef = useRef(null);

  // Follow the URL: navigation, "Clear search" buttons, back/forward.
  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  // "/" focuses the field when nothing else is taking keyboard input.
  useEffect(() => {
    if (!enableShortcut) return undefined;

    function onKeyDown(e) {
      if (
        e.key !== "/" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.defaultPrevented ||
        isTypingTarget(document.activeElement)
      ) {
        return;
      }
      const el = inputRef.current;
      if (!el || el.offsetParent === null) return; // hidden sidebar
      e.preventDefault();
      el.focus();
      el.select();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enableShortcut]);

  function submit(next) {
    const trimmed = next.trim();
    setValue(trimmed);
    handleSearch(trimmed);
    if (onNavigate) {
      inputRef.current?.blur();
      onNavigate();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit(value);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      // Chrome clears type=search fields on Escape by default, which would
      // undo the revert below; keep the URL value instead.
      e.preventDefault();
      setValue(searchQuery);
      e.currentTarget.blur();
    }
  }

  function handleClear() {
    setValue("");
    if (searchQuery !== "") {
      handleSearch("");
    }
    inputRef.current?.focus();
  }

  const hasValue = value.length > 0;

  return (
    <form role="search" onSubmit={handleSubmit}>
      <InputGroup
        size="sm"
        width="100%"
        marginLeft={`-${ROW_OUTDENT}`}
        height={FIELD_HEIGHT}
      >
        <InputLeftElement
          pointerEvents="none"
          width="auto"
          height={FIELD_HEIGHT}
          paddingLeft={ROW_OUTDENT}
          color="gray.600"
        >
          <Search2Icon boxSize={ICON_SIZE} />
        </InputLeftElement>
        <Input
          ref={inputRef}
          type="search"
          aria-label="Search links"
          placeholder="Search"
          title={enableShortcut ? "Search your links (press / to focus)" : undefined}
          aria-keyshortcuts={enableShortcut ? "/" : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          height={FIELD_HEIGHT}
          paddingLeft={TEXT_INSET}
          paddingRight={hasValue ? FIELD_HEIGHT : ROW_OUTDENT}
          fontSize="sm"
          fontWeight="medium"
          color="gray.800"
          backgroundColor="white"
          borderRadius="md"
          _placeholder={{ color: "gray.600", fontWeight: "normal" }}
          // Hide the browser's own clear glyph; we draw our own.
          sx={{
            "&::-webkit-search-cancel-button": { WebkitAppearance: "none" },
            "&::-webkit-search-decoration": { WebkitAppearance: "none" },
          }}
        />
        {hasValue && (
          <InputRightElement width={FIELD_HEIGHT} height={FIELD_HEIGHT}>
            <IconButton
              type="button"
              aria-label="Clear search"
              icon={<CloseIcon boxSize={2} />}
              onClick={handleClear}
              variant="ghost"
              colorScheme="gray"
              size="xs"
              minWidth="1.5rem"
              height="1.5rem"
              color="gray.600"
              borderRadius="md"
            />
          </InputRightElement>
        )}
      </InputGroup>
    </form>
  );
}
