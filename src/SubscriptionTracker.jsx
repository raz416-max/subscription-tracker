import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Calendar, AlertCircle, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";

const LOCALE = "en-GB";
const CURRENCY_CODE = "GBP";
const currency = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY_CODE });

function advanceIfPast(sub) {
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
  Streaming: "bg-[#F1E9F9] text-[#7A4FA3]",
  Software: "bg-[#E6EEFB] text-[#3A6BC4]",
  Fitness: "bg-[#E8F5EE] text-[#0F8B5F]",
  Music: "bg-[#FBE9F0] text-[#B5457A]",
  Other: "bg-[#F0EEE7] text-[#5C6169]",
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

const fraunces = { fontFamily: "'Fraunces', serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

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
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <p className="text-[#9A9F87] text-sm" style={mono}>Loading your subscriptions…</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#FAFAF7] text-[#15181D]">
      <header className="border-b border-[#E7E4DC] bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={fraunces} className="text-lg font-medium">
            Ledger<span className="text-[#0F8B5F]">.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-[#9A9F87]" style={mono}>{user.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-[#9A9F87] hover:text-[#15181D] transition-colors"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-block text-xs font-medium tracking-wide uppercase text-[#0F8B5F] bg-[#E8F5EE] px-3 py-1 rounded-full mb-3">
            Member
          </div>
          <h1 style={fraunces} className="text-3xl font-medium">Your subscriptions</h1>
          <p className="text-[#5C6169] text-sm mt-1">Everything you pay for, in one honest list.</p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E7E4DC]">
            <div className="text-xs text-[#9A9F87] uppercase tracking-wide mb-1">Monthly</div>
            <div style={mono} className="text-3xl font-medium">{currency.format(monthlyTotal)}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E7E4DC]">
            <div className="text-xs text-[#9A9F87] uppercase tracking-wide mb-1">Yearly</div>
            <div style={mono} className="text-3xl font-medium">{currency.format(yearlyTotal)}</div>
          </div>
        </div>

        {/* Renewal alerts */}
        {soon.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[#F0DDB8] bg-[#FBF3E3] p-5">
            <div className="flex items-center gap-2 text-[#8A6417] font-medium text-sm mb-3">
              <AlertCircle size={16} />
              Renewing soon
            </div>
            <ul className="space-y-1.5">
              {soon.map((s) => (
                <li key={s.id} className="text-sm text-[#8A6417] flex justify-between">
                  <span>{s.name}</span>
                  <span style={mono}>{currency.format(s.price)} · {nextRenewalLabel(s.days)}</span>
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
              className="flex items-center justify-between bg-white border border-[#E7E4DC] rounded-2xl p-4 hover:border-[#0F8B5F] transition-colors"
            >
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.Other}`}>
                    {s.category}
                  </span>
                  <span className="text-xs text-[#9A9F87] flex items-center gap-1">
                    <Calendar size={12} />
                    {nextRenewalLabel(s.days)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div style={mono} className="font-medium">{currency.format(s.price)}</div>
                  <div className="text-xs text-[#9A9F87]">{s.cycle}</div>
                </div>
                <button
                  onClick={() => removeSub(s.id)}
                  className="text-[#D8D5CB] hover:text-[#C0442A] transition-colors"
                  aria-label={`Remove ${s.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {subs.length === 0 && (
            <div className="text-center text-[#9A9F87] text-sm py-10 bg-white rounded-2xl border border-dashed border-[#E7E4DC]">
              No subscriptions yet. Add your first one below.
            </div>
          )}
        </div>

        {/* Add form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-[#D8D5CB] rounded-2xl py-3.5 text-[#9A9F87] hover:border-[#0F8B5F] hover:text-[#0F8B5F] transition-colors"
          >
            <Plus size={16} />
            Add subscription
          </button>
        ) : (
          <form onSubmit={addSub} className="bg-white border border-[#E7E4DC] rounded-2xl p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Name (e.g. Netflix)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-[#E7E4DC] rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:border-[#0F8B5F]"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-[#E7E4DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F8B5F]"
              />
              <select
                value={form.cycle}
                onChange={(e) => setForm({ ...form, cycle: e.target.value })}
                className="border border-[#E7E4DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F8B5F]"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="date"
                value={form.nextDate}
                onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
                className="border border-[#E7E4DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F8B5F]"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border border-[#E7E4DC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F8B5F]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {formError && <div className="text-sm text-[#C0442A]">{formError}</div>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[#15181D] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#0F8B5F] transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="text-[#9A9F87] text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#F0EEE7] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
