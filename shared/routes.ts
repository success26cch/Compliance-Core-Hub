import { z } from 'zod';
import { insertLeadSchema, leads, subscriptions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  leads: {
    create: {
      method: 'POST' as const,
      path: '/api/leads',
      input: insertLeadSchema,
      responses: {
        201: z.custom<typeof leads.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: { // Admin only
      method: 'GET' as const,
      path: '/api/leads',
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    delete: { // Superadmin only
      method: 'DELETE' as const,
      path: '/api/leads/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  subscriptions: {
    status: {
      method: 'GET' as const,
      path: '/api/subscriptions/status',
      responses: {
        200: z.object({
          status: z.string(),
          plan: z.string().nullable().optional(),
          isPro: z.boolean(),
          hasPlatform: z.boolean().optional(),
          hasIsoManager: z.boolean().optional(),
          hasEnvHub: z.boolean().optional(),
          isIsaSubscriber: z.boolean().optional(),
          isIsaPro: z.boolean().optional(),
          isAdmin: z.boolean().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    createCheckout: {
      method: 'POST' as const,
      path: '/api/subscriptions/checkout',
      input: z.object({
        priceId: z.string(),
      }),
      responses: {
        200: z.object({
          url: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
