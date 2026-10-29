import { renderHook, act } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "react-query";

import apiFetch from "../../utils/apiFetch";
import { useHighlights } from "../highlights";

jest.mock("../../utils/apiFetch", () => ({
  __esModule: true,
  default: jest.fn(),
  csrfStore: { get: () => "mock-csrf-token" },
}));

const mockToast = jest.fn();
jest.mock("@chakra-ui/react", () => ({
  useToast: () => mockToast,
}));

const LINK_ID = "6ae2dfa0b9fff11d4e132977";

function makeLink(highlights = []) {
  return { id: LINK_ID, title: "An article", annotation: "", isAnnotated: highlights.length > 0, highlights };
}

describe("useHighlights", () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    queryClient.setQueryData(["links", "detail", LINK_ID], makeLink());
    queryClient.setQueryData(["links", "list", { page: "0" }], [
      { id: "other", title: "Other" },
      makeLink(),
    ]);
    queryClient.setQueryData(["links", "list", { page: "1" }], [{ id: "third" }]);
  });

  it("POSTs the quote and replaces the detail and list caches with the returned link", async () => {
    const h = { id: "h1", exact: "quick brown", prefix: "The", suffix: "fox", start: 4, end: 15, note: "" };
    apiFetch.mockResolvedValueOnce({ link: makeLink([h]) });

    const { result } = renderHook(() => useHighlights(LINK_ID), { wrapper });

    await act(async () => {
      await result.current.createHighlight({ exact: "quick brown", prefix: "The", suffix: "fox", start: 4, end: 15 });
    });

    expect(apiFetch).toHaveBeenCalledWith(`/api/links/${LINK_ID}/highlights`, {
      method: "POST",
      body: { exact: "quick brown", prefix: "The", suffix: "fox", start: 4, end: 15, note: "" },
    });

    expect(queryClient.getQueryData(["links", "detail", LINK_ID]).highlights).toEqual([h]);

    const list = queryClient.getQueryData(["links", "list", { page: "0" }]);
    expect(list[0]).toEqual({ id: "other", title: "Other" });
    expect(list[1].highlights).toEqual([h]);
    expect(list[1].isAnnotated).toBe(true);

    // Untouched list is unchanged but marked stale for its next mount.
    expect(queryClient.getQueryData(["links", "list", { page: "1" }])).toEqual([{ id: "third" }]);
    expect(queryClient.getQueryState(["links", "list", { page: "1" }]).isInvalidated).toBe(true);
  });

  it("PATCHes a note", async () => {
    const h = { id: "h1", exact: "x", note: "remember" };
    apiFetch.mockResolvedValueOnce({ link: makeLink([h]) });

    const { result } = renderHook(() => useHighlights(LINK_ID), { wrapper });
    await act(async () => {
      await result.current.updateHighlightNote({ highlightId: "h1", note: "remember" });
    });

    expect(apiFetch).toHaveBeenCalledWith(`/api/links/${LINK_ID}/highlights/h1`, {
      method: "PATCH",
      body: { note: "remember" },
    });
    expect(queryClient.getQueryData(["links", "detail", LINK_ID]).highlights[0].note).toBe("remember");
  });

  it("DELETEs a highlight and clears isAnnotated from the caches", async () => {
    queryClient.setQueryData(["links", "detail", LINK_ID], makeLink([{ id: "h1", exact: "x" }]));
    apiFetch.mockResolvedValueOnce({ link: makeLink([]) });

    const { result } = renderHook(() => useHighlights(LINK_ID), { wrapper });
    await act(async () => {
      await result.current.removeHighlight("h1");
    });

    expect(apiFetch).toHaveBeenCalledWith(`/api/links/${LINK_ID}/highlights/h1`, { method: "DELETE" });
    expect(queryClient.getQueryData(["links", "detail", LINK_ID])).toMatchObject({
      highlights: [],
      isAnnotated: false,
    });
    expect(queryClient.getQueryData(["links", "list", { page: "0" }])[1].isAnnotated).toBe(false);
  });

  it("toasts on failure and leaves the cache alone", async () => {
    apiFetch.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useHighlights(LINK_ID), { wrapper });

    await act(async () => {
      await expect(result.current.createHighlight({ exact: "x" })).rejects.toThrow("boom");
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
    expect(queryClient.getQueryData(["links", "detail", LINK_ID]).highlights).toEqual([]);
  });
});
