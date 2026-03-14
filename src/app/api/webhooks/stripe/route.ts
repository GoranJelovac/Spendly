import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const priceId = subscription.items.data[0]?.price.id;
      const tier = getPlanFromPriceId(priceId);
      const periodEnd = subscription.items.data[0]?.current_period_end;

      await db.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionTier: tier,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd * 1000)
            : null,
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      const subscriptionId =
        typeof subDetails?.subscription === "string"
          ? subDetails.subscription
          : subDetails?.subscription?.id;
      if (!subscriptionId) break;

      const subscription =
        await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = subscription.items.data[0]?.current_period_end;

      await db.user.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd * 1000)
            : null,
        },
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const tier =
        subscription.status === "active"
          ? getPlanFromPriceId(subscription.items.data[0]?.price.id)
          : "free";
      const periodEnd = subscription.items.data[0]?.current_period_end;

      await db.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd * 1000)
            : null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function getPlanFromPriceId(priceId: string): string {
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const businessPriceId = process.env.STRIPE_BUSINESS_PRICE_ID;

  if (priceId === proPriceId) return "pro";
  if (priceId === businessPriceId) return "business";
  return "free";
}
