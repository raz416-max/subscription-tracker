import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "./supabaseClient";

// Change these two lines to switch currency/locale (e.g. "en-GB" / "GBP" for UK).
const LOCALE = "en-US";
const CURRENCY_CODE = "USD";
const currency = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY_CODE });

function advanceIfPast(sub) {
  // If a renewal date has passed, roll it forward to the next cycle
  // (handles the case where the app wasn't opened on the exact renewal day).
  let next = new Date(sub.nextDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  while (next < today) {
    if (sub.cycle === "monthly") {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
  }
  return { ...sub, nextDate: next.toISOString().slice(0, 10) };
}

const CATEGORY_COLORS = {
  Streaming: "bg-purple-100 text-purple-700",
  Software: "bg-blue-100 text-blue-700",
  Fitness: "bg-green-100 text-green-700",
  Music: "bg-pink-100 text-pink-700",
  Other: "bg-gray-100 text-gray-700",
};

const CATEGORIES = ["Streaming", "Software", "Fitness", "Music", "Other"];

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function nextRenewalLabel(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days}d`;
}

export default function SubscriptionTracker({ user, onLogout }) {
  const [subs, setSubs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    cycle: "monthly",
    nextDate: "",
    category: "Streaming",
  });
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  // Load this user's subscriptions from Supabase on mount.
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("next_date", { ascending: true });

      if (error) {
        console.error(error);
        setSubs([]);
      } else {
        const mapped = data.map((row) => ({
          id: row.id,
          name: row.name,
          price: row.price,
          cycle: row.cycle,
          nextDate: row.next_date,
          category: row.category,
        }));
        setSubs(mapped.map(advanceIfPast));
      }
      setLoaded(true);
    })();
  }, [user.id]);

  async function addSub(e) {
    e.preventDefault();
    if (!form.name || !form.price || !form.nextDate) {
      setFormError("Fill in every field.");
      return;
    }
    if (Number(form.price) <= 0) {
      setFormError("Price must be greater than 0.");
      return;
    }
    setFormError("");

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        name: form.name,
        price: parseFloat(form.price),
        cycle: form.cycle,
        next_date: form.nextDate,
        category: form.category,
      })
      .select()
      .single();

    if (error) {
      setFormError("Couldn't save that — try again.");
      return;
    }

    setSubs((prev) => [
      ...prev,
      {
        id: data.id,
        name: data.name,
        price: data.price,
        cycle: data.cycle,
        nextDate: data.next_date,
        category: data.category,
      },
    ]);
    setForm({ name: "", price: "", cycle: "monthly", nextDate: "", category: "Streaming" });
    setShowForm(false);
  }

  function closeForm() {
    setShowForm(false);
    setFormError("");
  }

  async function removeSub(id) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    if (error) console.error(error);
  }

  const monthlyTotal = useMemo(() => {
    return subs.reduce((sum, s) => {
      return sum + (s.cycle === "monthly" ? s.price : s.price / 12);
    }, 0);
  }, [subs]);

  const yearlyTotal = monthlyTotal * 12;

  const upcoming = useMemo(() => {
    return [...subs]
      .map((s) => ({ ...s, days: daysUntil(s.nextDate) }))
      .sort((a, b) => a.days - b.days);
  }, [subs]);

  const soon = upcoming.filter((s) => s.days <= 3 && s.days >= 0);

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
        <p className="text-gray-400 text-sm">Loading your subscriptions…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Track what you pay for, and never miss a renewal.</p>
        </div>
        <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-700">
          Log out
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Monthly</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{currency.format(monthlyTotal)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Yearly</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{currency.format(yearlyTotal)}</div>
        </div>
      </div>

      {/* Renewal alerts */}
      {soon.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-2">
            <AlertCircle size={16} />
            Renewing soon
          </div>
          <ul className="space-y-1">
            {soon.map((s) => (
              <li key={s.id} className="text-sm text-amber-800">
                {s.name} — {currency.format(s.price)} ({nextRenewalLabel(s.days)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* List */}
      <div className="space-y-2 mb-6">
        {upcoming.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="font-medium text-gray-900">{s.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.Other}`}>
                    {s.category}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {nextRenewalLabel(s.days)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium text-gray-900">{currency.format(s.price)}</div>
                <div className="text-xs text-gray-400">{s.cycle}</div>
              </div>
              <button
                onClick={() => removeSub(s.id)}
                className="text-gray-300 hover:text-red-500 transition-colors"
                aria-label={`Remove ${s.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {subs.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">No subscriptions yet. Add your first one below.</div>
        )}
      </div>

      {/* Add form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-3 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus size={16} />
          Add subscription
        </button>
      ) : (
        <form onSubmit={addSub} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name (e.g. Netflix)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.cycle}
              onChange={(e) => setForm({ ...form, cycle: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="date"
              value={form.nextDate}
              onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {formError && <div className="text-sm text-red-600">{formError}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="text-gray-500 text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
