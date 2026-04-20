import DodoPayments from 'dodopayments';

let _client: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
  if (!_client) {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error('DODO_PAYMENTS_API_KEY is not configured');
    }
    _client = new DodoPayments({
      bearerToken: apiKey,
      environment: 'live_mode',
    });
  }
  return _client;
}
