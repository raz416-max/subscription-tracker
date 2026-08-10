import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Calendar, AlertCircle, LogOut, Pencil, X, Search, Download, BarChart3, Lock } from "lucide-react";
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

const CATEGORY_BAR_COLORS = {
  Streaming: "#7A4FA3",
  Software: "#3A6BC4",
  Fitness: "#0F8B5F",
  Music: "#B5457A",
  Other: "#5C6169",
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

function monthlyEquivalent(s) {
  return s.cycle === "monthly" ? s.price : s.price / 12;
}

function downloadCSV(subs) {
  const header = ["Name", "Price", "Cycle", "Next renewal", "Category"];
  const rows = subs.map((s) => [s.name, s.price.toFixed(2), s.cycle, s.nextDate, s.category]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "subscriptions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const fraunces = { fontFamily: "'Fraunces', serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const BASIC_LIMIT = 5;
const EMPTY_FORM = { name: "", price: "", cycle: "monthly", nextDate: "", category: "Streaming" };

export default function SubscriptionTracker({ user, plan, onLogout }) {
  const [subs, setSubs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const isPremium = plan === "premium";

  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

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

  function validateForm() {
    if (!form.name || !form.price || !form.nextDate) {
      setFormError("Fill in every field.");
      return false;
    }
    if (Number(form.price) <= 0) {
      setFormError("Price must be greater than 0.");
      return false;
    }
    return true;
  }

  async function addSub(e) {
    e.preventDefault();
    if (!validateForm()) return;
    if (plan === "basic" && subs.length >= BASIC_LIMIT) {
      setFormError(`Basic is limited to ${BASIC_LIMIT} subscriptions. Upgrade to Premium for unlimited tracking.`);
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
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setFormError("");

    const { error } = await supabase
      .from("subscriptions")
      .update({
        name: form.name,
        price: parseFloat(form.price),
        cycle: form.cycle,
        next_date: form.nextDate,
        category: form.category,
      })
      .eq("id", editingId);

    if (error) {
      setFormError("Couldn't save changes — try again.");
      return;
    }

    setSubs((prev) =>
      prev.map((s) =>
        s.id === editingId
          ? { ...s, name: form.name, price: parseFloat(form.price), cycle: form.cycle, nextDate: form.nextDate, category: form.category }
          : s
      )
    );
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startEdit(s) {
    setShowForm(false);
    setEditingId(s.id);
    setFormError("");
    setForm({ name: s.name, price: String(s.price), cycle: s.cycle, nextDate: s.nextDate, category: s.category });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function closeForm() {
    setShowForm(false);
    setFormError("");
    setForm(EMPTY_FORM);
  }

  async function removeSub(id) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    if (error) console.error(error);
  }

  const monthlyTotal = useMemo(() => {
    return subs.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  }, [subs]);

  const yearlyTotal = monthlyTotal * 12;

  const upcoming = useMemo(() => {
    return [...subs]
      .map((s) => ({ ...s, days: daysUntil(s.nextDate) }))
      .sort((a, b) => a.days - b.days);
  }, [subs]);

  const soon = upcoming.filter((s) => s.days <= 3 && s.days >= 0);

  const visible = useMemo(() => {
    return upcoming.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [upcoming, search, activeCategory]);

  const categoryBreakdown = useMemo(() => {
    const totals = {};
    subs.forEach((s) => {
      totals[s.category] = (totals[s.category] || 0) + monthlyEquivalent(s);
    });
    const max = Math.max(1, ...Object.values(totals));
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total, pct: (total / max) * 100 }));
  }, [subs]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <p className="text-[#9A9F87] text-sm" style={mono}>Loading your subscriptions…</p>
      </div>
    );
  }

  const editingForm = editingId !== null;

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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className={`inline-block text-xs font-medium tracking-wide uppercase px-3 py-1 rounded-full mb-3 ${
              isPremium ? "text-[#0F8B5F] bg-[#E8F5EE]" : "text-[#5C6169] bg-[#F0EEE7]"
            }`}>
              {isPremium ? "Premium member" : "Member"}
            </div>
            <h1 style={fraunces} className="text-3xl font-medium">Your subscriptions</h1>
            <p className="text-[#5C6169] text-sm mt-1">Everything you pay for, in one honest list.</p>
          </div>
          {isPremium && subs.length > 0 && (
            <button
              onClick={() => downloadCSV(subs)}
              className="flex items-center gap-1.5 text-sm text-[#5C6169] hover:text-[#0F8B5F] border border-[#E7E4DC] rounded-lg px-3 py-2 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
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

        {/* Spending by category — Premium feature */}
        {subs.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#E7E4DC] mb-6">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <BarChart3 size={15} className="text-[#0F8B5F]" />
              Spending by category
              {!isPremium && <Lock size={12} className="text-[#9A9F87]" />}
            </div>
            {isPremium ? (
              <div className="space-y-3">
                {categoryBreakdown.map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#5C6169]">{c.category}</span>
                      <span style={mono} className="text-[#5C6169]">{currency.format(c.total)}/mo</span>
                    </div>
                    <div className="h-2 bg-[#F0EEE7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.pct}%`, backgroundColor: CATEGORY_BAR_COLORS[c.category] || "#5C6169" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#9A9F87]">
                See exactly where your money goes each month — available on Premium.
              </div>
            )}
          </div>
        )}

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

        {/* Search & filter */}
        {subs.length > 0 && (
          <div className="mb-4">
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9F87]" />
              <input
                type="text"
                placeholder="Search subscriptions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-[#E7E4DC] rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0F8B5F]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeCategory === c
                      ? "bg-[#15181D] text-white border-[#15181D]"
                      : "bg-white text-[#5C6169] border-[#E7E4DC] hover:border-[#0F8B5F]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2 mb-6">
          {visible.map((s) => (
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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div style={mono} className="font-medium">{currency.format(s.price)}</div>
                  <div className="text-xs text-[#9A9F87]">{s.cycle}</div>
                </div>
                <button
                  onClick={() => startEdit(s)}
                  className="text-[#D8D5CB] hover:text-[#0F8B5F] transition-colors"
                  aria-label={`Edit ${s.name}`}
                >
                  <Pencil size={15} />
                </button>
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
          {subs.length > 0 && visible.length === 0 && (
            <div className="text-center text-[#9A9F87] text-sm py-10 bg-white rounded-2xl border border-dashed border-[#E7E4DC]">
              No subscriptions match your search.
            </div>
          )}
        </div>

        {/* Edit form */}
        {editingForm && (
          <form onSubmit={saveEdit} className="bg-white border border-[#0F8B5F] rounded-2xl p-5 space-y-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Editing subscription</span>
              <button type="button" onClick={cancelEdit} className="text-[#9A9F87] hover:text-[#15181D]">
                <X size={16} />
              </button>
            </div>
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
                className="bg-[#0F8B5F] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#0C7350] transition-colors"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-[#9A9F87] text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#F0EEE7] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Add form */}
        {!editingForm && plan === "basic" && (
          <div className="text-xs text-[#9A9F87] mb-2 text-right" style={mono}>
            {subs.length} / {BASIC_LIMIT} subscriptions
          </div>
        )}
        {!editingForm && (!showForm ? (
          plan === "basic" && subs.length >= BASIC_LIMIT ? (
            <div className="w-full text-center border border-dashed border-[#D8D5CB] rounded-2xl py-3.5 text-[#9A9F87] text-sm">
              You've reached the Basic limit of {BASIC_LIMIT}. Upgrade to Premium for unlimited tracking.
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-[#D8D5CB] rounded-2xl py-3.5 text-[#9A9F87] hover:border-[#0F8B5F] hover:text-[#0F8B5F] transition-colors"
            >
              <Plus size={16} />
              Add subscription
            </button>
          )
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
        ))}
      </div>
    </div>
  );
}
