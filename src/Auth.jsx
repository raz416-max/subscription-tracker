import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
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
    <div className="max-w-sm mx-auto mt-24 p-6 border border-gray-200 rounded-xl bg-white">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {mode === "signin" ? "Log in" : "Create an account"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {mode === "signin"
          ? "Welcome back to your subscription tracker."
          : "Set up an account to save your subscriptions."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />

        {error && <div className="text-sm text-red-600">{error}</div>}
        {info && <div className="text-sm text-green-600">{info}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
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
        className="w-full text-center text-sm text-gray-500 mt-4 hover:text-gray-700"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
