import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: [api.subscriptions.status.path],
    queryFn: async () => {
      const res = await fetch(api.subscriptions.status.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch subscription status");
      return api.subscriptions.status.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCheckoutSession() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (priceId: string) => {
      const res = await fetch(api.subscriptions.createCheckout.path, {
        method: api.subscriptions.createCheckout.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to create checkout session");
      }
      return api.subscriptions.createCheckout.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export type QuestionUsageResponse = {
  questionCount: number;
  freeLimit: number;
  canAsk: boolean;
  isPro: boolean;
};

export function useQuestionUsage() {
  return useQuery<QuestionUsageResponse>({
    queryKey: ["/api/question-usage"],
    queryFn: async () => {
      const res = await fetch("/api/question-usage", { credentials: "include" });
      if (res.status === 401) return { questionCount: 0, freeLimit: 10, canAsk: true, isPro: false };
      if (!res.ok) throw new Error("Failed to fetch question usage");
      return res.json();
    },
  });
}
