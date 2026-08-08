import React, { useState } from "react";

const fraunces = { fontFamily: "'Fraunces', serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// Public Stripe Price IDs — safe to expose client-side, these just identify
// which plan to check out with, not any secret key.
const PLANS = {
  basic: {
    name: "Basic",
    tagline: "Track, edit, and search your subscriptions.",
    monthly: { price: "£5.99", priceId: "price_1U2ANEF0LtsdwP2U9hty0ct7" },
    yearly: { price: "£60.99", priceId: "price_1U2ADEF0LtsdwP2UnNGDZTFa" },
    features: ["Unlimited subscriptions tracked", "Edit & search your list", "Renewal alerts"],
  },
  premium: {
    name: "Premium",
    tagline: "Everything in Basic, plus deeper insight.",
    monthly: { price: "£10.99", priceId: "price_1U2AB2F0LtsdwP2URieKJmum" },
    yearly: { price: "£120.99", priceId: "price_1U2AFGF0LtsdwP2UiPJR6P3p" },
    features: ["Everything in Basic", "Spending chart", "CSV export", "Email renewal reminders"],
  },
};

export default function Paywall({ user, onLogout }) {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(null); // which plan is loading
  const [error, setError] = useState("");

  async function startCheckout(priceId, planKey) {
    setLoading(planKey);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email, priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Something went wrong starting checkout.");
        setLoading(null);
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(null);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div style={fraunces} className="text-lg font-medium text-center mb-2">
          Ledger<span className="text-[#0F8B5F]">.</span>
        </div>
        <h1 style={fraunces} className="text-2xl font-medium text-center mb-6">Choose your plan</h1>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white border border-[#E7E4DC] rounded-full p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                billing === "monthly" ? "bg-[#15181D] text-white" : "text-[#5C6169]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                billing === "yearly" ? "bg-[#15181D] text-white" : "text-[#5C6169]"
              }`}
            >
              Yearly — save ~15%
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-[#C0442A] text-center mb-4">{error}</div>}

        <div className="grid md:grid-cols-2 gap-5">
          {Object.entries(PLANS).map(([key, plan]) => {
            const tier = plan[billing];
            const isPremium = key === "premium";
            return (
              <div
                key={key}
                className={`bg-white border rounded-2xl p-6 ${
                  isPremium ? "border-[#0F8B5F] ring-1 ring-[#0F8B5F]" : "border-[#E7E4DC]"
                }`}
              >
                {isPremium && (
                  <div className="text-xs font-medium text-[#0F8B5F] uppercase tracking-wide mb-2">
                    Most popular
                  </div>
                )}
                <h2 style={fraunces} className="text-xl font-medium mb-1">{plan.name}</h2>
                <p className="text-sm text-[#9A9F87] mb-4">{plan.tagline}</p>
                <div style={mono} className="text-3xl font-medium mb-1">
                  {tier.price}
                  <span className="text-sm text-[#9A9F87]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {" "}/{billing === "monthly" ? "month" : "year"}
                  </span>
                </div>
                <ul className="text-sm text-[#5C6169] space-y-1.5 my-5">
                  {plan.features.map((f) => (
                    <li key={f}>— {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => startCheckout(tier.priceId, key)}
                  disabled={loading !== null}
                  className={`w-full text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 ${
                    isPremium
                      ? "bg-[#0F8B5F] text-white hover:bg-[#0C7350]"
                      : "bg-[#15181D] text-white hover:bg-[#0F8B5F]"
                  }`}
                >
                  {loading === key ? "Redirecting…" : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={onLogout} className="w-full text-center text-sm text-[#9A9F87] mt-8 hover:text-[#15181D] transition-colors">
          Log out
        </button>
      </div>
    </div>
  );
}
