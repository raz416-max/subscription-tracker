import React from "react";
import { Bell, PieChart, Wallet, ArrowRight } from "lucide-react";

const TICKER_ITEMS = [
  "Netflix", "Spotify", "Disney+", "Adobe CC", "iCloud+", "Gym membership",
  "Amazon Prime", "YouTube Premium", "Notion", "PlayStation Plus", "Headspace", "ChatGPT Plus",
];

export default function LandingPage({ onGetStarted, onLogin }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-[#FAFAF7] text-[#15181D]">
      {/* Nav */}
      <header className="border-b border-[#E7E4DC]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ fontFamily: "'Fraunces', serif" }} className="text-lg font-medium">
            Ledger<span className="text-[#0F8B5F]">.</span>
          </div>
          <button
            onClick={onLogin}
            className="text-sm font-medium text-[#15181D] hover:text-[#0F8B5F] transition-colors"
          >
            Log in
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <div className="inline-block text-xs font-medium tracking-wide uppercase text-[#0F8B5F] bg-[#E8F5EE] px-3 py-1 rounded-full mb-6">
            The average person loses £270/year to forgotten renewals
          </div>
          <h1
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-5xl md:text-6xl leading-[1.05] font-medium mb-6"
          >
            Every subscription,<br />
            <span className="italic text-[#0F8B5F]">one honest list.</span>
          </h1>
          <p className="text-lg text-[#5C6169] max-w-md mb-8">
            See exactly what you're paying for, get a nudge before renewals hit,
            and stop finding out about charges after they've already left your account.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-2 bg-[#15181D] text-white px-6 py-3.5 rounded-lg text-sm font-medium hover:bg-[#0F8B5F] transition-colors"
            >
              Get started — £5.50/month
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Live-preview style mock card, echoing the real app UI */}
        <div className="bg-white border border-[#E7E4DC] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="text-xs uppercase tracking-wide text-[#9A9F87] mb-1">This month</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-4xl font-medium mb-6">
            £62.97
          </div>
          <div className="space-y-3">
            {[
              { name: "Gym membership", due: "in 2 days", price: "£34.99" },
              { name: "Netflix", due: "in 6 days", price: "£15.99" },
              { name: "Spotify", due: "in 20 days", price: "£11.99" },
            ].map((row) => (
              <div key={row.name} className="flex items-center justify-between text-sm border-t border-[#F0EEE7] pt-3 first:border-0 first:pt-0">
                <div>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-[#9A9F87] text-xs">{row.due}</div>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[#5C6169]">
                  {row.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ticker — signature element */}
      <div className="border-y border-[#E7E4DC] bg-white py-4 overflow-hidden">
        <div className="flex gap-10 animate-marquee whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-sm text-[#9A9F87] font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
          width: fit-content;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; }
        }
      `}</style>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: Wallet,
            title: "Every cost, one list",
            body: "Add each subscription once. See your real monthly and yearly total, not an estimate.",
          },
          {
            icon: Bell,
            title: "Renewal alerts",
            body: "Get flagged three days before anything renews, so nothing charges you by surprise.",
          },
          {
            icon: PieChart,
            title: "Spending by category",
            body: "Streaming, fitness, software — see where your money actually goes each month.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title}>
            <div className="w-10 h-10 rounded-lg bg-[#E8F5EE] flex items-center justify-center mb-4">
              <Icon size={18} className="text-[#0F8B5F]" />
            </div>
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-sm text-[#5C6169] leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#E7E4DC]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-3xl font-medium mb-10">
            Three steps in
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Add what you pay for", body: "Name, price, billing cycle — takes seconds per subscription." },
              { step: "02", title: "We watch the dates", body: "Every renewal is tracked automatically against today." },
              { step: "03", title: "You stay ahead of it", body: "See your true monthly cost and catch renewals before they hit." },
            ].map(({ step, title, body }) => (
              <div key={step}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm text-[#0F8B5F] mb-3">
                  {step}
                </div>
                <h3 className="font-medium mb-2">{title}</h3>
                <p className="text-sm text-[#5C6169] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-sm mx-auto text-center border border-[#E7E4DC] rounded-2xl p-8 bg-white">
          <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-medium mb-1">
            One plan. Everything included.
          </h3>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-4xl font-medium my-6">
            £5.50<span className="text-base text-[#9A9F87] font-sans"> /month</span>
          </div>
          <ul className="text-sm text-[#5C6169] space-y-2 mb-8 text-left">
            <li>— Unlimited subscriptions tracked</li>
            <li>— Renewal alerts</li>
            <li>— Monthly &amp; yearly totals</li>
            <li>— Cancel anytime</li>
          </ul>
          <button
            onClick={onGetStarted}
            className="w-full bg-[#15181D] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#0F8B5F] transition-colors"
          >
            Get started
          </button>
        </div>
      </section>

      <footer className="border-t border-[#E7E4DC] py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-[#9A9F87]">
          © {new Date().getFullYear()} Ledger
        </div>
      </footer>
    </div>
  );
}
