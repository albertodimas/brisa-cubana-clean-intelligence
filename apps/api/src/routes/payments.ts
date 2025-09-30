import { Hono } from "hono";
import Stripe from "stripe";
import { db } from "../lib/db";
import { getStripe, stripeEnabled } from "../lib/stripe";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { rateLimiter, RateLimits } from "../middleware/rate-limit";

const payments = new Hono();

// Apply write rate limit to checkout sessions (prevents payment spam)
payments.use("/checkout-session", rateLimiter(RateLimits.write));

payments.post("/checkout-session", requireAuth(), async (c) => {
  if (!stripeEnabled()) {
    return c.json({ error: "Stripe integration disabled" }, 400);
  }

  const stripe = getStripe();
  const authUser = getAuthUser(c);
  const { bookingId } = (await c.req.json().catch(() => ({}))) as {
    bookingId?: string;
  };

  if (!bookingId) {
    return c.json({ error: "bookingId is required" }, 400);
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      user: true,
      property: true,
    },
  });

  if (!booking) {
    return c.json({ error: "Booking not found" }, 404);
  }

  if (authUser?.role === "CLIENT" && booking.userId !== authUser.sub) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    const webUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
    const successUrl =
      process.env.STRIPE_SUCCESS_URL ?? `${webUrl}/dashboard?payment=success`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ?? `${webUrl}/dashboard?payment=cancelled`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: booking.user.email,
      metadata: {
        bookingId: booking.id,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.service.name,
              description: booking.service.description ?? undefined,
            },
            unit_amount: Math.round(Number(booking.totalPrice) * 100),
          },
          quantity: 1,
        },
      ],
    });

    const updated = await db.booking.update({
      where: { id: booking.id },
      data: {
        checkoutSessionId: session.id,
        paymentStatus: "PENDING_PAYMENT",
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? undefined),
      },
      include: {
        service: true,
        user: true,
        property: true,
      },
    });

    return c.json({
      booking: updated,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return c.json({ error: "Unable to create checkout session" }, 500);
  }
});

payments.post("/webhook", async (c) => {
  if (!stripeEnabled()) {
    return c.text("Stripe disabled", 200);
  }

  const stripe = getStripe();
  const signature = c.req.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return c.text("Missing signature", 400);
  }

  const payload = await c.req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return c.text("Signature verification failed", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          await db.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              paymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : (session.payment_intent?.id ?? undefined),
              checkoutSessionId: session.id,
            },
          });
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          await db.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "FAILED",
            },
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const booking = await db.booking.findFirst({
          where: {
            paymentIntentId: intent.id,
          },
        });
        if (booking) {
          await db.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: "FAILED",
            },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Error processing Stripe webhook", error);
    return c.text("Webhook handler failed", 500);
  }

  return c.text("ok", 200);
});

export default payments;
