import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PREMIUM_PRICES = [
  process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  process.env.STRIPE_PRICE_PREMIUM_YEARLY,
];

function planForPrice(priceId) {
  return PREMIUM_PRICES.includes(priceId) ? "premium" : "basic";
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("Webhook received event type:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;

        // Look up which price they actually bought, to know basic vs premium.
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        const plan = planForPrice(priceId);

        console.log("Checkout completed for userId:", userId, "plan:", plan);

        const { error: upsertError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            stripe_customer_id: session.customer,
            subscription_status: "active",
            plan,
          });

        if (upsertError) {
          console.error("Supabase upsert error:", upsertError);
        } else {
          console.log("Successfully marked user as active:", userId, plan);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const status = subscription.status === "active" ? "active" : "inactive";
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = planForPrice(priceId);

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: status, plan })
          .eq("stripe_customer_id", subscription.customer);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "inactive", plan: "none" })
          .eq("stripe_customer_id", subscription.customer);
        break;
      }

      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
