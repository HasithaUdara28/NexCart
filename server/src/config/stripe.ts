import Stripe from 'stripe';

let _instance: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_instance) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error('STRIPE_SECRET_KEY is not set in .env');
      _instance = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
    }
    return (_instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});
