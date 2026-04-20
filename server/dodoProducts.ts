import { getDodoClient } from './dodoClient';

export interface DodoProductDef {
  internalId: string;
  dodoPrefixedName: string;
  amount: number;
  currency: 'USD';
  isRecurring: boolean;
  interval?: 'Month' | 'Year';
  intervalCount?: number;
}

export const DODO_PRODUCT_DEFINITIONS: DodoProductDef[] = [
  { internalId: 'cch-unlimited-safety',          dodoPrefixedName: 'CCHUB: Corey AI — Unlimited Safety',              amount: 19900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'employer-platform',             dodoPrefixedName: 'CCHUB: Employer Compliance Platform',             amount: 49900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'employer-platform-with-corey',  dodoPrefixedName: 'CCHUB: Employer Platform + Corey AI',            amount: 54900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'iso-essentials',                dodoPrefixedName: 'CCHUB: ISO Essentials',                          amount: 4900,  currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'iso-professional',              dodoPrefixedName: 'CCHUB: ISO Professional',                        amount: 14900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'integrated-enterprise',         dodoPrefixedName: 'CCHUB: Integrated Enterprise',                   amount: 29900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'bma-subscription',              dodoPrefixedName: 'CCHUB: Spanish Bilingual Medical Assistant',      amount: 19900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'expert-retainer',               dodoPrefixedName: 'CCHUB: Human Expert Retainer',                   amount: 49900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'brandnswag-platform',           dodoPrefixedName: 'CCHUB: BrandNSwag Platform',                     amount: 4900,  currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'isa-core',                      dodoPrefixedName: 'CCHUB: Isa — ISO AI Advisor (Core)',             amount: 12900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'isa-pro',                       dodoPrefixedName: 'CCHUB: Isa Pro — Full ISO AI Advisor',           amount: 24900, currency: 'USD', isRecurring: true,  interval: 'Month', intervalCount: 1 },
  { internalId: 'setup-fee',                     dodoPrefixedName: 'CCHUB: Platform Setup & Onboarding Fee',         amount: 49900, currency: 'USD', isRecurring: false },
  { internalId: 'mentorship-foundation',         dodoPrefixedName: 'CCHUB: ACSI Mentorship — Foundation',           amount: 250000,currency: 'USD', isRecurring: false },
  { internalId: 'mentorship-executive',          dodoPrefixedName: 'CCHUB: ACSI Mentorship — Executive',            amount: 500000,currency: 'USD', isRecurring: false },
  { internalId: 'course-dot-medical',            dodoPrefixedName: 'CCHUB: DOT Medical Certification Course',        amount: 19900, currency: 'USD', isRecurring: false },
  { internalId: 'course-osha-surveillance',      dodoPrefixedName: 'CCHUB: OSHA Medical Surveillance Course',        amount: 24900, currency: 'USD', isRecurring: false },
  { internalId: 'course-drug-alcohol',           dodoPrefixedName: 'CCHUB: Drug & Alcohol Testing Course',           amount: 19900, currency: 'USD', isRecurring: false },
  { internalId: 'course-iso-management',         dodoPrefixedName: 'CCHUB: ISO Management Systems Course',           amount: 34900, currency: 'USD', isRecurring: false },
  { internalId: 'course-osha-recordkeeping',     dodoPrefixedName: 'CCHUB: OSHA Recordkeeping Master Course',        amount: 29900, currency: 'USD', isRecurring: false },
  { internalId: 'course-complete-bundle',        dodoPrefixedName: 'CCHUB: Complete Training Bundle',                amount: 89900, currency: 'USD', isRecurring: false },
];

// planKey (from platform-checkout) → internalId mapping
export const PLAN_TO_INTERNAL_ID: Record<string, string> = {
  corey_pro:                    'cch-unlimited-safety',
  employer_platform:            'employer-platform',
  employer_platform_with_corey: 'employer-platform-with-corey',
  setup_fee:                    'setup-fee',
  isa:                          'isa-core',
  isa_pro:                      'isa-pro',
};

// In-memory cache: internalId → DODO product_id
const productIdCache = new Map<string, string>();
let seeded = false;

export async function seedDodoProducts(): Promise<void> {
  if (seeded) return;

  try {
    const client = getDodoClient();

    let existingProducts: any[] = [];
    try {
      const response = await client.products.list({ page_size: 100 } as any);
      existingProducts = (response as any).items ?? (response as any).data ?? [];
    } catch (err) {
      console.warn('[DODO] Could not list products:', err);
    }

    // Build a map of existing products by name
    const existingByName = new Map<string, string>();
    for (const p of existingProducts) {
      if (p.name) existingByName.set(p.name, p.product_id ?? p.id);
    }

    for (const def of DODO_PRODUCT_DEFINITIONS) {
      const existingId = existingByName.get(def.dodoPrefixedName);
      if (existingId) {
        productIdCache.set(def.internalId, existingId);
        continue;
      }

      try {
        const pricePayload: any = {
          currency: def.currency,
          discount: 0,
          price: def.amount,
          purchasing_power_parity: false,
        };

        if (def.isRecurring) {
          pricePayload.type = 'recurring_price';
          pricePayload.payment_frequency_count = def.intervalCount ?? 1;
          pricePayload.payment_frequency_interval = def.interval ?? 'Month';
          pricePayload.subscription_period_count = def.intervalCount ?? 1;
          pricePayload.subscription_period_interval = def.interval ?? 'Month';
          pricePayload.trial_period_days = 0;
        } else {
          pricePayload.type = 'one_time_price';
        }

        const created = await client.products.create({
          name: def.dodoPrefixedName,
          price: pricePayload,
          tax_category: 'saas' as any,
        });

        const newId = (created as any).product_id ?? (created as any).id;
        if (newId) {
          productIdCache.set(def.internalId, newId);
          console.log(`[DODO] Created product "${def.dodoPrefixedName}" → ${newId}`);
        }
      } catch (err: any) {
        console.warn(`[DODO] Could not create product "${def.dodoPrefixedName}":`, err?.message ?? err);
      }
    }

    seeded = true;
    console.log(`[DODO] Product seeding complete. ${productIdCache.size} products mapped.`);
  } catch (err: any) {
    console.error('[DODO] Product seeding failed:', err?.message ?? err);
  }
}

export function getDodoProductId(internalId: string): string | undefined {
  return productIdCache.get(internalId);
}

export function clearSeedCache(): void {
  seeded = false;
  productIdCache.clear();
}
