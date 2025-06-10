import { useMutation, useQuery, useQueryClient } from "react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useToast } from "@chakra-ui/react";
import { useLocation, useParams } from "react-router-dom";

import apiFetch, { csrfStore } from "../utils/apiFetch";
import useQueryString from "./queryString";

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

export function useConverse() {
  const [status, setStatus] = useState('idle') // idle, connecting, streaming, done, error
  const [response, setResponse] = useState({ content: [], text: '', toolUses: {} })
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const queryClient = useQueryClient()
  const pageContext = usePageContext()

  const sendMessage = useCallback(async (conversationId, message) => {
    if (status === 'streaming' || status === 'connecting') {
      throw new Error('Already streaming a response')
    }

    setStatus('connecting')
    setResponse({ content: [], text: '', toolUses: {} })
    setError(null)

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const response = await fetch(`/api/conversations/${conversationId}/converse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Csrf-Token': csrfStore.get(),
        },
        body: JSON.stringify({ 
          message,
          pageContext: Object.keys(pageContext.query).length > 0 ? pageContext : { route: pageContext.route, query: {} }
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus('streaming')

      const reader = response.body.getReader()
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

              setResponse({ content, text: accumulatedText, toolUses })
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE event:', line, parseError)
          }
        }
      }

      // Invalidate conversation data to refresh with new messages
      queryClient.invalidateQueries(['conversations', 'detail', conversationId])

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
