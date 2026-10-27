import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useToast, useDisclosure, Box, Button, Text } from "@chakra-ui/react";
import { useLocation, useParams } from "react-router-dom";

import apiFetch, { csrfStore } from "../utils/apiFetch";
import { useLocalStorage } from "./localStorage";
import { useUser } from "./auth";
import useQueryString from "./queryString";

// The chat side panel column is only shown at the 2xl breakpoint and up (see
// AppLayout's grid). Below that, chat lives in a drawer.
const DESKTOP_CHAT_MEDIA_QUERY = "(min-width: 1536px)";

function usePageContext() {
  const location = useLocation();
  const params = useParams();
  const queryString = useQueryString();

  return useMemo(() => {
    // Merge URL parameters and query string into one query object
    const query = { ...params, ...queryString };

    return {
      route: location.pathname,
      query
    };
  }, [location.pathname, params, queryString]);
}

export function useListConversations() {
  return useQuery(
    ["conversations", "list"],
    () => apiFetch(`/api/conversations`).then((response) => response.conversations))
}

export function useConversation(conversationId, pageNum = 0) {
  return useQuery(
    ["conversations", "detail", conversationId],
    () => apiFetch(`/api/conversations/${conversationId}?page=${pageNum}`).then((response) => response.conversation),
    {
      enabled: !!conversationId // Only run when conversationId is truthy
    }
  )
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation(() => apiFetch(`/api/conversations`, {
    body: {},
    method: "POST",
  }), {
    onSuccess: (data, _) => {
      queryClient.setQueryData(
        ["conversations", "list"],
        (old = []) => [data.conversation, ...old]
      )

      queryClient.setQueryData(
        ["conversations", "detail", data.conversation.id],
        data.conversation
      )

      queryClient.invalidateQueries({
        queryKey: ["conversations", "list"],
        refetchActive: false,
      });
    }
  })
}

function convertToMessages(content) {
  return content.map((el, idx) => {
    if (el.type === "toolUse") {
      return {
        id: `temp-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
        role: "user",
        sequenceNumber: -1,
        isToolUse: true,
        toolUse: [
          {
            id: el.toolUse.id,
            name: el.toolUse.name,
            request: {
              text: "{}"
            },
            type: "request",
          },
          {
            id: el.toolUse.id,
            name: el.toolUse.name,
            response: {
              status: el.toolUse.status,
              text: "{}"
            },
            type: "response",
          }
        ]
      }
    } else {
      return {
        id: `temp-${Date.now()}-${idx}`,
        createdAt: new Date().toISOString(),
        role: "assistant",
        sequenceNumber: -1,
        text: el.content,
        isToolUse: false,
      }
    }
  })
}

// Define write-action tools that should trigger query refreshes when successful
const WRITE_ACTION_TOOLS = new Set([
  'create_folder',
  'delete_folder', 
  'rename_folder',
  'add_link_to_folder',
  'remove_link_from_folder',
  'summarize_link'
])

export function useConverse() {
  const [status, setStatus] = useState('idle') // idle, connecting, streaming, done, error
  const [response, setResponse] = useState({ content: [], text: '', toolUses: {} })
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const queryClient = useQueryClient()
  const pageContext = usePageContext()

  const sendMessage = useCallback(async (conversationId, message, options = {}) => {
    if (status === 'streaming' || status === 'connecting') {
      throw new Error('Already streaming a response')
    }

    setStatus('connecting')
    setResponse({ content: [], text: '', toolUses: {} })
    setError(null)

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const httpResponse = await fetch(`/api/conversations/${conversationId}/converse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Csrf-Token': csrfStore.get(),
        },
        body: JSON.stringify({
          // A trigger starts a synthetic turn server-side; no message is sent.
          ...(options.trigger ? { trigger: options.trigger } : { message }),
          pageContext: Object.keys(pageContext.query).length > 0 ? pageContext : { route: pageContext.route, query: {} }
        }),
        signal: abortControllerRef.current.signal
      })

      if (!httpResponse.ok) {
        throw new Error(`HTTP error! status: ${httpResponse.status}`)
      }

      setStatus('streaming')

      const reader = httpResponse.body.getReader()
      const decoder = new TextDecoder()
      let content = []
      let currentTextContent = ''
      let accumulatedText = ''
      let toolUses = {}

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Add final text content if any
          if (currentTextContent) {
            content = [...content, { type: 'text', content: currentTextContent }]
          }
          setResponse({ content, text: accumulatedText, toolUses })
          setStatus('done')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const event = JSON.parse(line)

            if (event.textDelta) {
              currentTextContent += event.textDelta
              accumulatedText += event.textDelta

              // Update content array with current text
              const newContent = content.length > 0 && content[content.length - 1].type === 'text'
                ? [...content.slice(0, -1), { type: 'text', content: currentTextContent }]
                : [...content, { type: 'text', content: currentTextContent }]

              setResponse({ content: newContent, text: accumulatedText, toolUses })
            }

            if (event.toolUseDelta) {
              const toolUse = event.toolUseDelta

              // Finalize current text segment before adding tool use
              if (currentTextContent && (content.length === 0 || content[content.length - 1].type !== 'text')) {
                content = [...content, { type: 'text', content: currentTextContent }]
              }

              // Update tool use state for legacy support
              toolUses = {
                ...toolUses,
                [toolUse.id]: {
                  id: toolUse.id,
                  name: toolUse.name,
                  type: toolUse.type,
                  status: toolUse.status || 'pending'
                }
              }

              // Add or update tool use in content array
              const toolUseContent = {
                type: 'toolUse',
                toolUse: {
                  id: toolUse.id,
                  name: toolUse.name,
                  type: toolUse.type,
                  status: toolUse.status || 'pending'
                }
              }

              // Check if this tool use already exists (for status updates)
              const existingIndex = content.findIndex(c =>
                c.type === 'toolUse' && c.toolUse.id === toolUse.id
              )

              if (existingIndex >= 0) {
                // Update existing tool use status
                content = content.map((c, i) =>
                  i === existingIndex
                    ? { ...c, toolUse: { ...c.toolUse, status: toolUse.status || 'pending' } }
                    : c
                )
              } else {
                // Add new tool use after current text
                content = [...content, toolUseContent]
              }

              // Reset current text for next segment
              currentTextContent = ''

              // Invalidate queries when write-action tools complete successfully
              if (toolUse.status === 'success' && WRITE_ACTION_TOOLS.has(toolUse.name)) {
                // Invalidate user query for folder-related changes
                if (['create_folder', 'delete_folder', 'rename_folder', 'add_link_to_folder', 'remove_link_from_folder'].includes(toolUse.name)) {
                  queryClient.invalidateQueries('user')
                }
                
                // Invalidate links queries for link-related changes
                if (['add_link_to_folder', 'remove_link_from_folder', 'summarize_link'].includes(toolUse.name)) {
                  queryClient.invalidateQueries(['links', 'list'])
                  queryClient.invalidateQueries(['links', 'detail'])
                }
              }

              setResponse({ content, text: accumulatedText, toolUses })
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE event:', line, parseError)
          }
        }
      }

      queryClient.setQueryData(
        ["conversations", "detail", conversationId],
        (oldConversation) => {
          return {
            ...oldConversation,
            messages: [...(oldConversation.messages || []), ...convertToMessages(content)]
          }
        }
      )

    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle')
      } else {
        setError(err.message)
        setStatus('error')
      }
    }
  }, [status, queryClient, pageContext])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    sendMessage,
    abort,
    status,
    response,
    error,
    isStreaming: status === 'streaming' || status === 'connecting'
  }
}

export function useChat() {
  const [activeConversationId, setActiveConversationId] = useState(null)
  const toast = useToast()
  const queryClient = useQueryClient()

  const conversationsQuery = useListConversations()
  // Only call useConversation when we have a valid ID
  const conversationQuery = useConversation(activeConversationId)
  const { mutateAsync: createConversation, isLoading: isCreatingConversation } = useCreateConversation()
  const converse = useConverse()

  // Auto-select conversation when conversations are loaded
  useEffect(() => {
    if (conversationsQuery.data && !activeConversationId && !isCreatingConversation) {
      const conversations = conversationsQuery.data

      if (conversations.length > 0) {
        // Select the most recent conversation (first in the list)
        setActiveConversationId(conversations[0].id)
      } else {
        // No conversations exist, create a new one
        createConversation().then((result) => {
          setActiveConversationId(result.conversation.id)
        }).catch((error) => {
          toast({
            title: "Failed to create initial conversation",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        })
      }
    }
  }, [conversationsQuery.data, activeConversationId, isCreatingConversation, createConversation, toast])

  return useMemo(() => {
    async function handleCreateConversation() {
      try {
        const result = await createConversation()
        setActiveConversationId(result.conversation.id)
        return result.conversation
      } catch (error) {
        toast({
          title: "Failed to create conversation",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        throw error
      }
    }

    function handleSelectConversation(conversationId) {
      setActiveConversationId(conversationId)
    }

    // Starts the automatic link review turn. No optimistic user bubble is
    // added: the synthetic trigger message is hidden in the UI.
    function handleStartLinkReview(conversationId) {
      setActiveConversationId(conversationId)
      return converse.sendMessage(conversationId, "", { trigger: "link_review" })
    }

    async function handleSendMessage(message) {
      try {
        let conversationId = activeConversationId

        // Create a new conversation if none is selected
        if (!conversationId) {
          const conversation = await handleCreateConversation()
          conversationId = conversation.id
        }

        // Create optimistic user message
        const tempUserMessage = {
          id: `temp-${Date.now()}`,
          sequenceNumber: -1, // Will be updated when server responds
          createdAt: new Date().toISOString(),
          role: "user",
          text: message,
          isToolUse: false
        }

        // Optimistically add user message to conversation
        queryClient.setQueryData(
          ["conversations", "detail", conversationId],
          (oldConversation) => {
            if (!oldConversation) return oldConversation

            return {
              ...oldConversation,
              messages: [...(oldConversation.messages || []), tempUserMessage]
            }
          }
        )

        // Start streaming AI response
        return converse.sendMessage(conversationId, message)
      } catch (error) {
        // Rollback optimistic update on error
        if (activeConversationId) {
          queryClient.invalidateQueries(['conversations', 'detail', activeConversationId])
        }

        toast({
          title: "Failed to send message",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        throw error
      }
    }

    return {
      // Conversation management
      conversations: conversationsQuery.data || [],
      conversationsLoading: conversationsQuery.isLoading,
      conversationsError: conversationsQuery.error,

      // Active conversation
      activeConversationId,
      activeConversation: conversationQuery.data,
      activeConversationLoading: conversationQuery.isLoading,
      activeConversationError: conversationQuery.error,

      // Actions
      handleCreateConversation,
      handleSelectConversation,
      handleSendMessage,
      handleStartLinkReview,

      // Streaming state
      streamingStatus: converse.status,
      streamingResponse: converse.response,
      streamingError: converse.error,
      isStreaming: converse.isStreaming,
      abortStreaming: converse.abort,

      // Loading states
      isCreatingConversation,
      isLoading: conversationsQuery.isLoading || isCreatingConversation
    }
  }, [
    activeConversationId,
    conversationsQuery.data,
    conversationsQuery.isLoading,
    conversationsQuery.error,
    conversationQuery.data,
    conversationQuery.isLoading,
    conversationQuery.error,
    createConversation,
    isCreatingConversation,
    converse,
    toast,
    queryClient
  ])
}

const ChatContext = createContext(null);

// Ensures the review trigger fires at most once per browser page load, even
// though providers/layouts can remount while navigating. The server-side
// LastLinkReviewAt stamp is the real safety net.
let hasAttemptedReviewThisLoad = false;

// Exported for tests only.
export function __resetLinkReviewAttempt() {
  hasAttemptedReviewThisLoad = false;
}

export function ChatProvider({ children }) {
  const chat = useChat();
  const user = useUser();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isChatVisible, setIsChatVisible] = useLocalStorage("isChatVisible", true);
  const chatDrawer = useDisclosure();

  // Keep the latest chat actions/state available to the one-shot effect
  // without retriggering it.
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const setIsChatVisibleRef = useRef(setIsChatVisible);
  setIsChatVisibleRef.current = setIsChatVisible;
  const chatDrawerRef = useRef(chatDrawer);
  chatDrawerRef.current = chatDrawer;

  const userId = user?.id;

  // On authenticated app load, ask the server whether a link review is due.
  useEffect(() => {
    if (!userId || hasAttemptedReviewThisLoad) {
      return;
    }

    hasAttemptedReviewThisLoad = true;

    (async () => {
      try {
        const data = await apiFetch("/api/conversations/review", {
          method: "POST",
          body: {},
        });

        // 204 No Content: nothing to review.
        if (!data.conversation) {
          return;
        }

        const conversation = data.conversation;

        queryClient.setQueryData(["conversations", "list"], (old = []) => [
          conversation,
          ...old,
        ]);
        queryClient.setQueryData(
          ["conversations", "detail", conversation.id],
          conversation
        );
        // The server stamped lastLinkReviewAt; refresh the cached user.
        queryClient.invalidateQueries("user");

        if (window.matchMedia(DESKTOP_CHAT_MEDIA_QUERY).matches) {
          // Desktop: make sure the chat column is visible.
          setIsChatVisibleRef.current(true);
        } else {
          // Mobile/narrow: surface the review with a toast that opens the
          // chat drawer.
          toast({
            duration: 9000,
            isClosable: true,
            position: "bottom",
            render: ({ onClose }) => (
              <Box
                bg="brand.500"
                color="white"
                borderRadius="lg"
                px={4}
                py={3}
                boxShadow="lg"
              >
                <Text fontSize="sm" mb={2}>
                  Your assistant has some suggestions about your new links.
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  color="white"
                  _hover={{ bg: "brand.400" }}
                  onClick={() => {
                    chatDrawerRef.current.onOpen();
                    onClose();
                  }}
                >
                  Open chat
                </Button>
              </Box>
            ),
          });
        }

        // Kick off the assistant's review turn (streams like a normal reply).
        await chatRef.current.handleStartLinkReview(conversation.id);
      } catch (error) {
        // Reviews are best-effort; never block the app on them.
        console.warn("Link review failed:", error);
      }
    })();
  }, [userId, queryClient, toast]);

  const value = useMemo(
    () => ({
      ...chat,
      isChatVisible,
      setIsChatVisible,
      toggleChatVisible: () => setIsChatVisible(!isChatVisible),
      isChatDrawerOpen: chatDrawer.isOpen,
      openChatDrawer: chatDrawer.onOpen,
      closeChatDrawer: chatDrawer.onClose,
    }),
    [chat, isChatVisible, setIsChatVisible, chatDrawer.isOpen, chatDrawer.onOpen, chatDrawer.onClose]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }

  return context;
}
