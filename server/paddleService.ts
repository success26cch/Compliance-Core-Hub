import crypto from "crypto";
import { storage } from "./storage";

// ---------------------------------------------------------------------------
// Paddle webhook signature verification
// Paddle-Signature header format:  ts=TIMESTAMP;h1=HMAC_HEX
// Signed payload:                  TIMESTAMP:RAW_BODY_STRING
// Algorithm:                       HMAC-SHA256 with PADDLE_WEBHOOK_SECRET
// ---------------------------------------------------------------------------

export function verifyPaddleSignature(
  rawBody: Buffer | string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(";").map((p) => p.split("=") as [string, string])
    );
    const ts = parts["ts"];
    const h1 = parts["h1"];
    if (!ts || !h1) return false;

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    const signed = `${ts}:${bodyStr}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(signed, "utf8")
      .digest("hex");

    // Constant-time comparison prevents timing attacks
    return crypto.timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Resolve user id from email
// We look in the users table first (authenticated users), then fall back to
// subscriptions that already have a matching email recorded.
// ---------------------------------------------------------------------------

async function resolveUserIdByEmail(email: string): Promise<string | null> {
  try {
    const user = await storage.getUserByEmail(email);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleTransactionCompleted(data: any) {
  const email: string | undefined =
    data?.customer?.email ?? data?.billing_details?.email;
  const paddleSubscriptionId: string | undefined = data?.subscription_id;
  const paddleCustomerId: string | undefined = data?.customer_id;
  const priceId: string | undefined = data?.items?.[0]?.price?.id;

  if (!email) {
    console.warn("[Paddle] transaction.completed — no customer email found");
    return;
  }

  const userId = await resolveUserIdByEmail(email);
  if (!userId) {
    console.warn(`[Paddle] transaction.completed — no user found for email: ${email}`);
    return;
  }

  const existing = await storage.getSubscription(userId);
  await storage.upsertSubscription({
    userId,
    status: "active",
    plan: priceId ?? existing?.plan ?? "paddle_subscription",
    paddleCustomerId: paddleCustomerId ?? existing?.paddleCustomerId ?? null,
    paddleSubscriptionId: paddleSubscriptionId ?? existing?.paddleSubscriptionId ?? null,
    stripeCustomerId: existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
  });

  console.log(`[Paddle] Activated subscription for user ${userId} (${email})`);
}

async function handleSubscriptionCreated(data: any) {
  const email: string | undefined = data?.customer?.email;
  const paddleSubscriptionId: string | undefined = data?.id;
  const paddleCustomerId: string | undefined = data?.customer_id;
  const status: string = data?.status ?? "active";
  const priceId: string | undefined = data?.items?.[0]?.price?.id;

  if (!email) {
    console.warn("[Paddle] subscription.created — no customer email found");
    return;
  }

  const userId = await resolveUserIdByEmail(email);
  if (!userId) {
    console.warn(`[Paddle] subscription.created — no user found for email: ${email}`);
    return;
  }

  const existing = await storage.getSubscription(userId);
  await storage.upsertSubscription({
    userId,
    status: status === "active" ? "active" : "inactive",
    plan: priceId ?? existing?.plan ?? "paddle_subscription",
    paddleCustomerId: paddleCustomerId ?? existing?.paddleCustomerId ?? null,
    paddleSubscriptionId: paddleSubscriptionId ?? existing?.paddleSubscriptionId ?? null,
    stripeCustomerId: existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
  });

  console.log(`[Paddle] Subscription created for user ${userId} (${email}) — status: ${status}`);
}

async function handleSubscriptionUpdated(data: any) {
  const paddleSubscriptionId: string | undefined = data?.id;
  const status: string = data?.status ?? "active";

  if (!paddleSubscriptionId) return;

  // Map Paddle status to our internal status
  const internalStatus =
    status === "active" || status === "trialing"
      ? "active"
      : status === "canceled" || status === "cancelled"
      ? "cancelled"
      : status === "past_due"
      ? "past_due"
      : "inactive";

  // Update by paddleSubscriptionId — find user first
  const email: string | undefined = data?.customer?.email;
  if (!email) return;
  const userId = await resolveUserIdByEmail(email);
  if (!userId) return;

  const existing = await storage.getSubscription(userId);
  await storage.upsertSubscription({
    userId,
    status: internalStatus,
    plan: existing?.plan ?? "paddle_subscription",
    paddleCustomerId: data?.customer_id ?? existing?.paddleCustomerId ?? null,
    paddleSubscriptionId,
    stripeCustomerId: existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
  });

  console.log(`[Paddle] Subscription ${paddleSubscriptionId} updated — status: ${internalStatus}`);
}

async function handleSubscriptionCancelled(data: any) {
  const email: string | undefined = data?.customer?.email;
  if (!email) return;
  const userId = await resolveUserIdByEmail(email);
  if (!userId) return;

  const existing = await storage.getSubscription(userId);
  await storage.upsertSubscription({
    userId,
    status: "cancelled",
    plan: existing?.plan ?? null,
    paddleCustomerId: existing?.paddleCustomerId ?? null,
    paddleSubscriptionId: existing?.paddleSubscriptionId ?? null,
    stripeCustomerId: existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
  });

  console.log(`[Paddle] Subscription cancelled for user ${userId} (${email})`);
}

// ---------------------------------------------------------------------------
// Main dispatcher — called by the webhook route
// ---------------------------------------------------------------------------

export async function processPaddleEvent(eventType: string, data: any): Promise<void> {
  switch (eventType) {
    case "transaction.completed":
      await handleTransactionCompleted(data);
      break;
    case "subscription.created":
      await handleSubscriptionCreated(data);
      break;
    case "subscription.updated":
      await handleSubscriptionUpdated(data);
      break;
    case "subscription.cancelled":
    case "subscription.canceled":
      await handleSubscriptionCancelled(data);
      break;
    default:
      console.log(`[Paddle] Unhandled event type: ${eventType}`);
  }
}
