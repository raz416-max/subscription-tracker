import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICES = [
  process.env.STRIPE_PRICE_BASIC_MONTHLY,
  process.env.STRIPE_PRICE_BASIC_YEARLY,
  process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  process.env.STRIPE_PRICE_PREMIUM_YEARLY,
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, email, priceId } = req.body;

  if (!userId || !email || !priceId) {
    return res.status(400).json({ error: "Missing userId, email, or priceId" });
  }

  // Only allow checkout for one of our known plan prices — never trust
  // an arbitrary price ID sent from the browser.
  if (!ALLOWED_PRICES.includes(priceId)) {
    return res.status(400).json({ error: "Invalid plan selected" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 5,
      },
      client_reference_id: userId,
      success_url: `${process.env.PUBLIC_URL}?checkout=success`,
      cancel_url: `${process.env.PUBLIC_URL}?checkout=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
