import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useConversations() {
  return useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ['/api/conversations', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/conversations/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}

export function useChatStream(conversationId: number, onLimitReached?: () => void) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load initial messages from query cache
  const { data: conversationData } = useConversation(conversationId);

  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(conversationData.messages);
    }
  }, [conversationData]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming || limitReached) return;

    const userMessage = { role: 'user', content, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.limitReached) {
            setLimitReached(true);
            setMessages((prev) => prev.slice(0, -1)); // Remove the user message we just added
            toast({
              title: "Free Limit Reached",
              description: "You've reached your monthly limit. Upgrade to Pro for more answers or contact us for a direct consultation.",
              variant: "destructive",
            });
            if (onLimitReached) onLimitReached();
            return;
          }
        }
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '', createdAt: new Date().toISOString() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content += data.content;
                }
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId] });
    }
  };

  return { messages, sendMessage, isStreaming, limitReached };
}
