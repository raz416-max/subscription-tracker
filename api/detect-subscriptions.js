import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { createClient } from "@supabase/supabase-js";

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function detectRecurring(transactions) {
  const byMerchant = {};

  for (const txn of transactions) {
    if (txn.amount <= 0) continue;
    const name = (txn.merchant_name || txn.name || "Unknown").trim();
    if (!byMerchant[name]) byMerchant[name] = [];
    byMerchant[name].push(txn);
  }

  const candidates = [];

  for (const [merchant, txns] of Object.entries(byMerchant)) {
    if (txns.length < 2) continue;

    txns.sort((a, b) => new Date(a.date) - new Date(b.date));

    const amounts = txns.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountsConsistent = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.05
    );
    if (!amountsConsistent) continue;

    const gaps = [];
    for (let i = 1; i < txns.length; i++) {
      const days =
        (new Date(txns[i].date) - new Date(txns[i - 1].date)) /
        (1000 * 60 * 60 * 24);
      gaps.push(days);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    let cycle = null;
    if (avgGap >= 25 && avgGap <= 35) cycle = "monthly";
    else if (avgGap >= 350 && avgGap <= 380) cycle = "yearly";
    if (!cycle) continue;

    const lastTxn = txns[txns.length - 1];
    const nextDate = new Date(lastTxn.date);
    if (cycle === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);

    candidates.push({
      name: merchant,
      price: Math.round(avgAmount * 100) / 100,
      cycle,
      nextDate: nextDate.toISOString().slice(0, 10),
      occurrences: txns.length,
    });
  }

  return candidates;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const { data: items, error: itemsErr } = await supabase
      .from("plaid_items")
      .select("access_token")
      .eq("user_id", userId);

    if (itemsErr) {
      console.error(itemsErr);
      return res.status(500).json({ error: "Failed to load connected banks" });
    }

    if (!items?.length) {
      return res.status(200).json({ candidates: [] });
    }

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    let allTransactions = [];

    for (const item of items) {
      const response = await plaidClient.transactionsGet({
        access_token: item.access_token,
        start_date: startDate,
        end_date: endDate,
      });
      allTransactions = allTransactions.concat(response.data.transactions);
    }

    const candidates = detectRecurring(allTransactions);

    res.status(200).json({ candidates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
