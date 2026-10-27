import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useConverse } from '../chat';

// Mock apiFetch and csrfStore
jest.mock('../../utils/apiFetch', () => ({
  __esModule: true,
  default: jest.fn(),
  csrfStore: {
    get: () => 'mock-csrf-token'
  }
}));

// Mock useLocation, useParams, and useQueryString
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

jest.mock('../queryString', () => ({
  __esModule: true,
  default: () => ({})
}));

// Mock fetch globally
global.fetch = jest.fn();

// Add TextEncoder/TextDecoder polyfills for Node.js environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

describe('useConverse query invalidation', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Mock successful fetch response with streaming
    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(JSON.stringify({
                toolUseDelta: {
                  id: 'tool-1',
                  name: 'create_folder',
                  type: 'request',
                  status: 'pending'
                }
              }) + '\n')
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(JSON.stringify({
                toolUseDelta: {
                  id: 'tool-1',
                  name: 'create_folder',
                  type: 'response',
                  status: 'success'
                }
              }) + '\n')
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined
            })
        })
      }
    });

    // Spy on query invalidation
    jest.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should invalidate user queries when folder-related write actions complete successfully', async () => {
    const { result } = renderHook(() => useConverse(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('conv-123', 'Create a folder');
    });

    // Verify that user queries were invalidated
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith('user');
  });

  it('should invalidate links queries when link-related write actions complete successfully', async () => {
    // Mock link-related tool
    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(JSON.stringify({
                toolUseDelta: {
                  id: 'tool-2',
                  name: 'add_link_to_folder',
                  type: 'response',
                  status: 'success'
                }
              }) + '\n')
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined
            })
        })
      }
    });

    const { result } = renderHook(() => useConverse(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('conv-456', 'Move link to folder');
    });

    // Verify that both user and links queries were invalidated
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith('user');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(['links', 'list']);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(['links', 'detail']);
  });

  it('should not invalidate queries for read-only tools', async () => {
    // Mock read-only tool
    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(JSON.stringify({
                toolUseDelta: {
                  id: 'tool-3',
                  name: 'get_links',
                  type: 'response',
                  status: 'success'
                }
              }) + '\n')
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined
            })
        })
      }
    });

    const { result } = renderHook(() => useConverse(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('conv-789', 'Get my links');
    });

    // Verify that no queries were invalidated for read-only tools
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('should not invalidate queries when tools fail', async () => {
    // Mock failed tool
    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(JSON.stringify({
                toolUseDelta: {
                  id: 'tool-4',
                  name: 'create_folder',
                  type: 'response',
                  status: 'error'
                }
              }) + '\n')
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined
            })
        })
      }
    });

    const { result } = renderHook(() => useConverse(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('conv-999', 'Create folder that will fail');
    });

    // Verify that no queries were invalidated for failed tools
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});
describe('useConverse trigger requests', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(JSON.stringify({
                textDelta: 'Welcome back!'
              }) + '\n')
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined
            })
        })
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends a trigger body without a message field', async () => {
    const { result } = renderHook(() => useConverse(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('conv-review', '', { trigger: 'link_review' });
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/conversations/conv-review/converse');

    const body = JSON.parse(options.body);
    expect(body.trigger).toBe('link_review');
    expect(body).not.toHaveProperty('message');
    expect(body).toHaveProperty('pageContext');
  });

  it('sends a message field and no trigger for normal messages', async () => {
    const { result } = renderHook(() => useConverse(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('conv-1', 'Hello there');
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.message).toBe('Hello there');
    expect(body).not.toHaveProperty('trigger');
  });
});
