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

describe('useConverse query invalidation - simple test', () => {
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

    // Spy on query invalidation
    jest.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should detect successful create_folder tool use', async () => {
    // Mock streaming response that includes a successful create_folder tool
    const mockReader = {
      read: jest.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(JSON.stringify({
            toolUseDelta: {
              id: 'tool-1',
              name: 'create_folder',
              status: 'success'
            }
          }) + '\n')
        })
        .mockResolvedValueOnce({
          done: true,
          value: undefined
        })
    };

    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => mockReader
      }
    });

    const { result } = renderHook(() => useConverse(), { wrapper });

    console.log('Before sendMessage - invalidateQueries call count:', queryClient.invalidateQueries.mock.calls.length);

    await act(async () => {
      await result.current.sendMessage('conv-123', 'Create a folder');
    });

    console.log('After sendMessage - invalidateQueries call count:', queryClient.invalidateQueries.mock.calls.length);
    console.log('All calls:', queryClient.invalidateQueries.mock.calls);

    // The test passes/fails, but let's see what happened
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
  });
});