"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceId: string) {
  const user = await getAuthUser();
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new Error("User not found");

  let customerId = dbUser.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name || undefined,
      metadata: { userId: dbUser.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: dbUser.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { userId: dbUser.id },
  });

  if (session.url) redirect(session.url);
}

export async function createBillingPortalSession() {
  const user = await getAuthUser();
  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  if (!dbUser?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  redirect(session.url);
}
