declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (options: { token: string; eventCallback?: (event: any) => void }) => void;
      Checkout: {
        open: (options: {
          items?: Array<{ priceId: string; quantity?: number }>;
          customer?: { email?: string };
          customData?: Record<string, string>;
          successUrl?: string;
          settings?: Record<string, any>;
        }) => void;
      };
    };
  }
}

let initialized = false;

export function initPaddle(onEvent?: (event: any) => void): boolean {
  if (initialized) return true;
  if (!window.Paddle) {
    console.warn("[Paddle] Paddle.js not loaded yet");
    return false;
  }

  const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  const isSandbox = import.meta.env.VITE_PADDLE_SANDBOX === "true";

  if (!clientToken) {
    console.warn("[Paddle] VITE_PADDLE_CLIENT_TOKEN is not set");
    return false;
  }

  if (isSandbox) {
    window.Paddle.Environment.set("sandbox");
  }

  window.Paddle.Initialize({
    token: clientToken,
    ...(onEvent ? { eventCallback: onEvent } : {}),
  });

  initialized = true;
  return true;
}

export interface PaddleCheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  customData?: Record<string, string>;
  successUrl?: string;
}

export function openPaddleCheckout(options: PaddleCheckoutOptions): void {
  if (!initPaddle()) {
    console.error("[Paddle] Cannot open checkout — Paddle not initialized");
    return;
  }

  window.Paddle!.Checkout.open({
    items: [{ priceId: options.priceId, quantity: options.quantity ?? 1 }],
    ...(options.customerEmail ? { customer: { email: options.customerEmail } } : {}),
    ...(options.customData ? { customData: options.customData } : {}),
    ...(options.successUrl ? { successUrl: options.successUrl } : {}),
  });
}
