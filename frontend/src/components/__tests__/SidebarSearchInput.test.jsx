import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";

import SidebarSearchInput from "../SidebarSearchInput";

const mockUseFilters = jest.fn();

jest.mock("../../hooks/filters", () => ({
  useFilters: () => mockUseFilters(),
}));

function renderInput({ searchQuery = "", handleSearch = jest.fn(), ...props } = {}) {
  mockUseFilters.mockReturnValue({ searchQuery, handleSearch });
  const utils = render(
    <ChakraProvider>
      <SidebarSearchInput {...props} />
    </ChakraProvider>
  );
  return { ...utils, handleSearch, input: screen.getByRole("searchbox") };
}

describe("SidebarSearchInput", () => {
  it("renders with the value from the URL search query", () => {
    const { input } = renderInput({ searchQuery: "rust" });
    expect(input).toHaveValue("rust");
    expect(input).toHaveAttribute("placeholder", "Search");
  });

  it("follows the URL when searchQuery changes", () => {
    const handleSearch = jest.fn();
    mockUseFilters.mockReturnValue({ searchQuery: "one", handleSearch });
    const { rerender } = render(
      <ChakraProvider>
        <SidebarSearchInput />
      </ChakraProvider>
    );
    expect(screen.getByRole("searchbox")).toHaveValue("one");

    mockUseFilters.mockReturnValue({ searchQuery: "", handleSearch });
    rerender(
      <ChakraProvider>
        <SidebarSearchInput />
      </ChakraProvider>
    );
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("submits the trimmed value on Enter", () => {
    const { input, handleSearch } = renderInput();
    fireEvent.change(input, { target: { value: "  couch  " } });
    fireEvent.submit(input);
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith("couch");
    expect(input).toHaveValue("couch");
  });

  it("clears the search when an empty value is submitted", () => {
    const { input, handleSearch } = renderInput({ searchQuery: "couch" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input);
    expect(handleSearch).toHaveBeenCalledWith("");
  });

  it("shows the clear button only when non-empty, and clearing resets the URL search", () => {
    const { input, handleSearch } = renderInput({ searchQuery: "couch" });
    const clear = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clear);
    expect(handleSearch).toHaveBeenCalledWith("");
    expect(input).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "Clear search" })
    ).not.toBeInTheDocument();
  });

  it("does not render the clear button when empty", () => {
    renderInput({ searchQuery: "" });
    expect(
      screen.queryByRole("button", { name: "Clear search" })
    ).not.toBeInTheDocument();
  });

  it("reverts to the URL value and blurs on Escape", () => {
    const { input, handleSearch } = renderInput({ searchQuery: "couch" });
    input.focus();
    fireEvent.change(input, { target: { value: "sofa" } });
    expect(input).toHaveValue("sofa");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("couch");
    expect(input).not.toHaveFocus();
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it("calls onNavigate on submit when provided", () => {
    const onNavigate = jest.fn();
    const { input, handleSearch } = renderInput({ onNavigate });
    fireEvent.change(input, { target: { value: "rust" } });
    fireEvent.submit(input);
    expect(handleSearch).toHaveBeenCalledWith("rust");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("focuses the field on '/' when the shortcut is enabled and nothing else has focus", () => {
    const { input } = renderInput({ enableShortcut: true });
    // jsdom has no layout, so offsetParent is null; stub it as visible.
    Object.defineProperty(input, "offsetParent", { get: () => document.body });
    fireEvent.keyDown(document.body, { key: "/" });
    expect(input).toHaveFocus();
  });
});
