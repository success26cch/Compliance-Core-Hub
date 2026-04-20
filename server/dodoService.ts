import { getDodoClient } from './dodoClient';
import { getDodoProductId, PLAN_TO_INTERNAL_ID } from './dodoProducts';

export interface DodoCheckoutItem {
  productId: string;
  quantity: number;
}

export class DodoService {
  async ensureCustomerExists(
    existingDodoCustomerId: string | null | undefined,
    email: string,
    userId: string
  ): Promise<string> {
    const client = getDodoClient();

    if (existingDodoCustomerId) {
      try {
        const customer = await client.customers.retrieve(existingDodoCustomerId);
        if (customer) return existingDodoCustomerId;
      } catch {
        // fall through to create
      }
    }

    const customer = await client.customers.create({
      email,
      name: email.split('@')[0],
    });

    return (customer as any).customer_id ?? (customer as any).id;
  }

  async createCheckoutSession(opts: {
    internalProductIds: string[];
    quantities: number[];
    successUrl: string;
    customerEmail: string;
    metadata: Record<string, string>;
  }): Promise<string> {
    const client = getDodoClient();

    const productCart: Array<{ product_id: string; quantity: number }> = [];
    for (let i = 0; i < opts.internalProductIds.length; i++) {
      const dodoId = getDodoProductId(opts.internalProductIds[i]);
      if (!dodoId) {
        throw new Error(`DODO product not found for internal ID: ${opts.internalProductIds[i]}`);
      }
      productCart.push({ product_id: dodoId, quantity: opts.quantities[i] });
    }

    const session = await client.checkoutSessions.create({
      product_cart: productCart,
      return_url: opts.successUrl,
      metadata: opts.metadata,
      customer: {
        email: opts.customerEmail,
        name: opts.customerEmail.split('@')[0],
      } as any,
    });

    return (session as any).checkout_url ?? (session as any).url;
  }

  async createPortalSession(dodoCustomerId: string, returnUrl: string): Promise<string> {
    const client = getDodoClient();
    const session = await client.customers.customerPortal.create(dodoCustomerId, {
      send_email: false,
    } as any);
    return (session as any).url ?? returnUrl;
  }

  getInternalIdForPlan(plan: string): string | undefined {
    return PLAN_TO_INTERNAL_ID[plan];
  }
}

export const dodoService = new DodoService();
