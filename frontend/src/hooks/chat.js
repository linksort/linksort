import { useMutation, useQuery, useQueryClient } from "react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useToast } from "@chakra-ui/react";

import apiFetch, { csrfStore } from "../utils/apiFetch";

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
  const [response, setResponse] = useState({ text: '', toolUses: {} })
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const queryClient = useQueryClient()

  const sendMessage = useCallback(async (conversationId, message) => {
    if (status === 'streaming' || status === 'connecting') {
      throw new Error('Already streaming a response')
    }

    setStatus('connecting')
    setResponse({ text: '', toolUses: {} })
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
        body: JSON.stringify({ message }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus('streaming')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let toolUses = {}

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          setStatus('done')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const event = JSON.parse(line)
            
            if (event.textDelta) {
              accumulatedText += event.textDelta
              setResponse({ text: accumulatedText, toolUses })
            }
            
            if (event.toolUseDelta) {
              const toolUse = event.toolUseDelta
              
              // Update tool use state
              toolUses = {
                ...toolUses,
                [toolUse.id]: {
                  id: toolUse.id,
                  name: toolUse.name,
                  type: toolUse.type,
                  status: toolUse.status || 'pending' // pending, success, error
                }
              }
              
              setResponse({ text: accumulatedText, toolUses })
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
  }, [status, queryClient])

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

        return converse.sendMessage(conversationId, message)
      } catch (error) {
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
    converse.status,
    converse.response,
    converse.error,
    converse.isStreaming,
    converse.abort,
    converse.sendMessage,
    toast
  ])
}
