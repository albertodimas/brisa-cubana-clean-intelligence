import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia",
    })
  : null;

export function getStripe() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  return stripe;
}

export function stripeEnabled() {
  return Boolean(stripe && process.env.ENABLE_PAYMENTS !== "false");
}
