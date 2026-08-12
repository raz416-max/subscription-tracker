import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function ConnectBankButton({ userId, onSuccess }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLinkToken() {
      setLoading(true);
      try {
        const res = await fetch("/api/create-link-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        setLinkToken(data.link_token);
      } catch (err) {
        console.error("Failed to fetch link token", err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchLinkToken();
  }, [userId]);

  const onPlaidSuccess = useCallback(
    async (publicToken) => {
      try {
        const res = await fetch("/api/exchange-public-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken, userId }),
        });
        const data = await res.json();
        if (data.success) {
          onSuccess?.();
        }
      } catch (err) {
        console.error("Failed to exchange public token", err);
      }
    },
    [userId, onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="bg-black text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
    >
      {loading ? "Loading..." : "Connect your bank"}
    </button>
  );
}
