import React from "react";
import { render, screen } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { MemoryRouter } from "react-router-dom";

import LinkItemNoteCard from "../LinkItemNoteCard";
import LinkAnnotationIndicator, { describeAnnotations } from "../LinkAnnotationIndicator";

// The controls row needs folder/link hooks and a query client; it is not
// what this test is about.
jest.mock("../LinkItemControls", () => () => <div data-testid="controls" />);

const link = {
  id: "6ae2e570a1a48f22c1d4bdf0",
  url: "https://en.wikipedia.org/wiki/Ada_Lovelace",
  title: "Ada Lovelace",
  site: "Wikipedia",
  favicon: "",
  folderId: "root",
  annotation: "Saved for the quokka talk.",
  isAnnotated: true,
  highlights: [
    { id: "h1", exact: "first computer programmer", note: "" },
    { id: "h2", exact: "poetical science", note: "Her own phrase" },
  ],
};

function renderCard(props = {}) {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <LinkItemNoteCard link={{ ...link, ...props }} />
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe("LinkItemNoteCard", () => {
  it("renders the title row, the note, and every highlight with its note", () => {
    renderCard();

    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveAttribute("href", link.url);
    expect(screen.getByText("Wikipedia")).toBeInTheDocument();
    expect(screen.getByText("Saved for the quokka talk.")).toBeInTheDocument();
    expect(screen.getByText("first computer programmer")).toBeInTheDocument();
    expect(screen.getByText("poetical science")).toBeInTheDocument();
    expect(screen.getByText("Her own phrase")).toBeInTheDocument();
  });

  it("links each highlight quote to the article at that highlight", () => {
    renderCard();

    const quotes = screen.getAllByTitle("Show in article");
    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toHaveAttribute("href", `/links/${link.id}#h=h1`);
    expect(quotes[1]).toHaveAttribute("href", `/links/${link.id}#h=h2`);
  });

  it("omits the note block when there is no note", () => {
    renderCard({ annotation: "" });
    expect(screen.queryByText("Saved for the quokka talk.")).not.toBeInTheDocument();
    expect(screen.getAllByTitle("Show in article")).toHaveLength(2);
  });
});

describe("LinkAnnotationIndicator", () => {
  it("counts highlights and the note", () => {
    expect(describeAnnotations(link)).toEqual({ count: 3, label: "2 highlights, 1 note" });
    expect(describeAnnotations({ ...link, annotation: "" })).toEqual({ count: 2, label: "2 highlights" });
    expect(describeAnnotations({ ...link, highlights: [{ id: "x", exact: "y" }] })).toEqual({
      count: 2,
      label: "1 highlight, 1 note",
    });
    expect(describeAnnotations({ annotation: "", highlights: [] })).toEqual({ count: 0, label: "" });
    expect(describeAnnotations({})).toEqual({ count: 0, label: "" });
  });

  it("renders nothing for a link with nothing written on it", () => {
    const { container } = render(
      <ChakraProvider>
        <LinkAnnotationIndicator link={{ annotation: "", highlights: [] }} />
      </ChakraProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the count with a descriptive title", () => {
    render(
      <ChakraProvider>
        <LinkAnnotationIndicator link={link} />
      </ChakraProvider>
    );
    expect(screen.getByTitle("2 highlights, 1 note")).toHaveTextContent("3");
  });
});
