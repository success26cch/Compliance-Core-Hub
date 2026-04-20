import DodoPayments from 'dodopayments';

let _client: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
  if (!_client) {
    const testKey = process.env.DODO_TEST_API_KEY;
    const liveKey = process.env.DODO_PAYMENTS_API_KEY;

    if (testKey) {
      console.log('[DODO] Using TEST mode');
      _client = new DodoPayments({
        bearerToken: testKey,
        environment: 'test_mode',
      });
    } else if (liveKey) {
      console.log('[DODO] Using LIVE mode');
      _client = new DodoPayments({
        bearerToken: liveKey,
        environment: 'live_mode',
      });
    } else {
      throw new Error('No DODO API key configured (DODO_TEST_API_KEY or DODO_PAYMENTS_API_KEY)');
    }
  }
  return _client;
}
