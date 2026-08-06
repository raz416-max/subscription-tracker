import React, { useState } from "react";

export default function Paywall({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Something went wrong starting checkout.");
        setLoading(false);
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 border border-gray-200 rounded-xl bg-white text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Subscribe to continue</h1>
      <p className="text-sm text-gray-500 mb-6">
        £5.50/month gets you full access to your subscription tracker.
      </p>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <button
        onClick={startCheckout}
        disabled={loading}
        className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Subscribe — £5.50/month"}
      </button>

      <button onClick={onLogout} className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-700">
        Log out
      </button>
    </div>
  );
}
