import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useIsaConversations() {
  return useQuery({
    queryKey: ['/api/isa-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/isa-conversations', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });
}

export function useIsaConversation(id: number | null) {
  return useQuery({
    queryKey: ['/api/isa-conversations', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/isa-conversations/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateIsaConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, source }: { title: string; source?: string }) => {
      const res = await fetch('/api/isa-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, source: source ?? "standalone" }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/isa-conversations'] });
    },
  });
}

export function useDeleteIsaConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/isa-conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete conversation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/isa-conversations'] });
    },
  });
}

export function useIsaChatStream(conversationId: number, onMessageSent?: () => void) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversationData } = useIsaConversation(conversationId);

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
      const response = await fetch(`/api/isa-conversations/${conversationId}/messages`, {
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
            setMessages((prev) => prev.slice(0, -1));
            toast({
              title: "Free Limit Reached",
              description: "You've reached your free question limit. Upgrade to access Isa's full ISO guidance.",
              variant: "destructive",
            });
            return;
          }
        }
        if (response.status === 404) {
          setMessages((prev) => prev.slice(0, -1));
          toast({
            title: "Conversation not found",
            description: "This conversation is no longer available. Please start a new chat.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      setMessages((prev) => [...prev, { role: 'assistant', content: '', createdAt: new Date().toISOString() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
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
            } catch {}
          }
        }
      }

      if (onMessageSent) onMessageSent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ['/api/isa-conversations', conversationId] });
    }
  };

  return { messages, sendMessage, isStreaming, limitReached };
}
