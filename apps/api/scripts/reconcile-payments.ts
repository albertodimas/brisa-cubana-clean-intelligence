import "dotenv/config";
import Stripe from "stripe";
import { db } from "../src/lib/db";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" });

function mapIntentStatus(
  status: Stripe.PaymentIntent.Status,
): "PAID" | "PENDING_PAYMENT" | "REQUIRES_ACTION" | "FAILED" {
  switch (status) {
    case "succeeded":
      return "PAID";
    case "requires_action":
    case "requires_confirmation":
      return "REQUIRES_ACTION";
    case "processing":
      return "PENDING_PAYMENT";
    case "requires_payment_method":
    case "requires_capture":
    case "canceled":
      return "FAILED";
    default:
      return "PENDING_PAYMENT";
  }
}

function mapCheckoutStatus(
  status: Stripe.Checkout.Session.PaymentStatus,
): "PAID" | "PENDING_PAYMENT" | "REQUIRES_ACTION" | "FAILED" {
  switch (status) {
    case "paid":
    case "no_payment_required":
      return "PAID";
    case "unpaid":
      return "FAILED";
    case "requires_action":
      return "REQUIRES_ACTION";
    default:
      return "PENDING_PAYMENT";
  }
}

async function reconcile() {
  const bookings = await db.booking.findMany({
    where: {
      paymentStatus: {
        in: ["PENDING_PAYMENT", "REQUIRES_ACTION"],
      },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    take: 50,
  });

  if (bookings.length === 0) {
    console.log("[reconcile] No bookings pending reconciliation");
    return;
  }

  let updated = 0;

  for (const booking of bookings) {
    try {
      let nextStatus:
        | "PAID"
        | "PENDING_PAYMENT"
        | "REQUIRES_ACTION"
        | "FAILED"
        | undefined;

      if (booking.paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(
          booking.paymentIntentId,
        );
        nextStatus = mapIntentStatus(intent.status);
      } else if (booking.checkoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(
          booking.checkoutSessionId,
        );
        nextStatus = mapCheckoutStatus(session.payment_status);
      }

      if (!nextStatus || nextStatus === booking.paymentStatus) {
        continue;
      }

      await db.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: nextStatus,
          status: nextStatus === "PAID" ? "CONFIRMED" : booking.status,
          completedAt:
            nextStatus === "PAID" && !booking.completedAt
              ? new Date()
              : booking.completedAt,
        },
      });

      updated += 1;
      console.log("[reconcile] Updated booking", booking.id, "->", nextStatus);
    } catch (error) {
      console.error("[reconcile] Failed booking", booking.id, error);
    }
  }

  console.log("[reconcile] Completed. Updated bookings:", updated);
}

reconcile()
  .catch((error) => {
    console.error("[reconcile] Fatal error", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
