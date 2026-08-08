import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const fraunces = { fontFamily: "'Fraunces', serif" };

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onAuthed();
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div style={fraunces} className="text-lg font-medium text-center mb-8">
          Ledger<span className="text-[#0F8B5F]">.</span>
        </div>
        <div className="bg-white border border-[#E7E4DC] rounded-2xl p-7">
          <h1 style={fraunces} className="text-xl font-medium mb-1">
            {mode === "signin" ? "Log in" : "Create an account"}
          </h1>
          <p className="text-sm text-[#9A9F87] mb-6">
            {mode === "signin"
              ? "Welcome back to your subscriptions."
              : "Set up an account to save your subscriptions."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#E7E4DC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F8B5F]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-[#E7E4DC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F8B5F]"
            />

            {error && <div className="text-sm text-[#C0442A]">{error}</div>}
            {info && <div className="text-sm text-[#0F8B5F]">{info}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#15181D] text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-[#0F8B5F] transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Log in" : "Sign up"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setInfo("");
            }}
            className="w-full text-center text-sm text-[#9A9F87] mt-5 hover:text-[#15181D] transition-colors"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
