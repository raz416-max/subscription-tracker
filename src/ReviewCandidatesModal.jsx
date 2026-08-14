import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function ReviewCandidatesModal({ userId, onClose, onConfirm }) {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/detect-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.candidates) {
          setCandidates(data.candidates);
          const initial = {};
          data.candidates.forEach((c, i) => (initial[i] = true));
          setSelected(initial);
        } else {
          setError("Couldn't load detected subscriptions.");
        }
      } catch (err) {
        console.error(err);
        setError("Couldn't load detected subscriptions.");
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, [userId]);

  function toggle(i) {
    setSelected((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  async function confirmSelected() {
    const toAdd = candidates.filter((_, i) => selected[i]);
    if (toAdd.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("subscriptions").insert(
      toAdd.map((c) => ({
        user_id: userId,
        name: c.name,
        price: c.price,
        cycle: c.cycle,
        next_date: c.nextDate,
        category: "Other",
      }))
    );
    setSaving(false);

    if (error) {
      console.error(error);
      setError("Couldn't save selected subscriptions.");
      return;
    }

    onConfirm?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-medium mb-1">Review detected subscriptions</h2>
        <p className="text-sm text-[#5C6169] mb-4">
          We found these recurring charges. Uncheck anything that isn't a subscription.
        </p>

        {loading && (
          <p className="text-sm text-[#9A9F87] py-6 text-center">Scanning your transactions…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-[#C0442A] py-4">{error}</p>
        )}

        {!loading && !error && candidates.length === 0 && (
          <p className="text-sm text-[#9A9F87] py-6 text-center">
            No recurring charges found yet. Try again after a bit more transaction history builds up.
          </p>
        )}

        {!loading && candidates.length > 0 && (
          <div className="space-y-2 mb-4">
            {candidates.map((c, i) => (
              <label
                key={i}
                className="flex items-center justify-between border border-[#E7E4DC] rounded-lg px-3 py-2 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!selected[i]}
                    onChange={() => toggle(i)}
                  />
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-[#9A9F87]">
                      {c.cycle} · seen {c.occurrences}x
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium">£{c.price.toFixed(2)}</div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={confirmSelected}
            disabled={saving || loading}
            className="bg-[#15181D] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#0F8B5F] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add selected"}
          </button>
          <button
            onClick={onClose}
            className="text-[#9A9F87] text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#F0EEE7] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
