/**
 * extract_examples.mjs
 *
 * Reads both training JSON files, categorizes entries into 10 groups,
 * and extracts the top 3 most representative user→assistant pairs per category.
 *
 * Output: policy/extracted_examples.json
 */

import fs from "fs";
import path from "path";

// ── Paths ──────────────────────────────────────────────────────────────
const FILE_1 = path.resolve("policy/train.json");
const FILE_2 = path.resolve(
  "policy/customer_support_training_dataset.json"
);
const OUTPUT = path.resolve("policy/extracted_examples.json");

// ── Category Mappings ──────────────────────────────────────────────────
// Each group maps to an array of raw category strings found in the data.
const CATEGORY_MAP = {
  ACCOUNT: [
    "ACCOUNT",
  ],
  ORDER: [
    "ORDER",
  ],
  DELIVERY_SHIPPING: [
    "DELIVERY",
    "SHIPPING",
  ],
  REFUND_RETURNS: [
    "REFUND",
    "RETURNS",
    "RETURNS AND EXCHANGES",
  ],
  COMPLAINTS: [
    "COMPLAINTS",
  ],
  BILLING_PAYMENT: [
    "PAYMENT",
    "BILLING",
    "BILLING AND PAYMENTS",
    "INVOICE",
  ],
  SUBSCRIPTION: [
    "SUBSCRIPTION",
  ],
  CANCEL: [
    "CANCEL",
  ],
  CONTACT_GENERAL: [
    "CONTACT",
    "GENERAL INQUIRY",
    "GENERAL",
    "CUSTOMER SERVICE",
  ],
  PRODUCT: [
    "PRODUCT",
    "PRODUCT SUPPORT",
  ],
};

// ── Intent diversity sub-groups ─────────────────────────────────────────
// Within each mapped group, we define intent buckets so we pick 3
// diverse examples (one from each bucket where possible).
const INTENT_BUCKETS = {
  ACCOUNT: [
    // Signup / registration
    ["open_account", "create_account", "registration_problems"],
    // Login / password
    ["recover_password", "change_account", "edit_account", "switch_account"],
    // Close / delete
    ["close_account", "delete_account"],
    // Misc
    ["order_history"],
  ],
  ORDER: [
    // Place order
    ["place_order"],
    // Track / status
    ["track_order"],
    // Change / modify
    ["change_order"],
    // Cancel
    ["cancel_order"],
    // Invoice
    ["request_invoice"],
  ],
  DELIVERY_SHIPPING: [
    // Track delivery
    ["track_delivery", "delivery_time"],
    // Delivery issues
    ["delivery_issue", "wrong_item", "damaged_delivery", "missing_item"],
    // Shipping address / costs
    [
      "set_up_shipping_address",
      "change_shipping_address",
      "shipping_costs",
      "delivery_period",
      "delivery_options",
    ],
  ],
  REFUND_RETURNS: [
    // Return policy / request return
    ["return_policy", "refund_policy", "check_refund_policy"],
    // Return product / request refund
    ["return_product", "return_product_online", "return_product_in_store", "request_refund", "get_refund"],
    // Refund status / track
    ["refund_status", "track_refund"],
  ],
  COMPLAINTS: [
    // Report problem
    ["report_problem", "report_poor_signal_coverage"],
    // Compensation
    ["get_compensation"],
    // General complaint
    ["complaint"],
  ],
  BILLING_PAYMENT: [
    // Payment issues
    ["payment_issue", "dispute_invoice"],
    // Payment methods
    ["payment_methods", "check_payment_methods", "check_mobile_payments", "pay", "schedule_payments"],
    // Invoices
    ["invoices", "check_invoice", "get_invoice"],
    // Billing tickets
    ["ticket_resolution"],
  ],
  SUBSCRIPTION: [
    // Sign up for plan
    ["sign_up_for_plan"],
    // Change plan / provider
    ["change_plan", "change_provider"],
    // Cancel
    ["cancel_plan", "check_cancellation_fee"],
    // Newsletter
    ["newsletter_subscription"],
  ],
  CANCEL: [
    // Check cancellation fee
    ["check_cancellation_fee"],
  ],
  CONTACT_GENERAL: [
    // Contact human agent
    ["human_agent", "contact_human_agent"],
    // Customer service
    ["customer_service", "contact_customer_service"],
    // General inquiry
    ["general_inquiry", "ticket_resolution"],
  ],
  PRODUCT: [
    // Product info / availability
    ["product_information", "availability_online", "availability", "availability_in_store"],
    // Product issues
    ["product_issue"],
    // Exchange
    ["exchange_product", "exchange_product_in_store"],
    // Product support tickets
    ["ticket_resolution"],
  ],
};

// ── Quality scoring helpers ────────────────────────────────────────────

/**
 * Score an entry for quality / representativeness.
 * Higher = better.
 */
function scoreEntry(entry) {
  const msgs = entry.messages;
  if (!msgs || msgs.length < 3) return -1;

  const userMsg = msgs.find((m) => m.role === "user");
  const asstMsg = msgs.find((m) => m.role === "assistant");
  if (!userMsg || !asstMsg) return -1;

  const userText = userMsg.content || "";
  const asstText = asstMsg.content || "";

  let score = 0;

  // Response length: prefer substantive responses (50-500 chars ideal)
  if (asstText.length >= 80 && asstText.length <= 600) score += 30;
  else if (asstText.length >= 40) score += 15;
  else score += 0; // too short = probably not helpful

  // User message: prefer natural, concise questions (10-200 chars ideal)
  if (userText.length >= 10 && userText.length <= 200) score += 20;
  else if (userText.length >= 5) score += 10;

  // Penalize very long user messages (likely pasted emails, not typical queries)
  if (userText.length > 500) score -= 15;

  // Penalize entries with lots of placeholder text (empty URLs like ".")
  const placeholderCount = (asstText.match(/\s\.\s/g) || []).length;
  score -= placeholderCount * 5;

  // Prefer complete, well-structured responses (lists, steps)
  if (/\d+\.\s/.test(asstText)) score += 10;
  if (/\*\*/.test(asstText)) score += 5;

  // Penalize very short user messages that are just keywords
  if (userText.split(" ").length <= 3 && userText.length < 20) score -= 5;

  // Slight bonus for non-empty source
  if (entry.source && entry.source.length > 0) score += 2;

  return score;
}

// ── Main logic ─────────────────────────────────────────────────────────

function main() {
  console.log("Reading data files...");

  const data1 = JSON.parse(fs.readFileSync(FILE_1, "utf8"));
  const data2 = JSON.parse(fs.readFileSync(FILE_2, "utf8"));
  const allEntries = [...data1, ...data2];

  console.log(`Total entries loaded: ${allEntries.length}`);

  // Build reverse lookup: raw category → our group name
  const rawToGroup = {};
  for (const [group, rawCats] of Object.entries(CATEGORY_MAP)) {
    for (const raw of rawCats) {
      rawToGroup[raw] = group;
    }
  }

  // Categorize all entries
  const grouped = {};
  for (const group of Object.keys(CATEGORY_MAP)) {
    grouped[group] = [];
  }

  let uncategorized = 0;
  for (const entry of allEntries) {
    const rawCat = entry.category;
    const group = rawToGroup[rawCat];
    if (group) {
      grouped[group].push(entry);
    } else {
      uncategorized++;
    }
  }

  console.log(`Uncategorized entries (skipped): ${uncategorized}`);
  for (const [group, entries] of Object.entries(grouped)) {
    console.log(`  ${group}: ${entries.length} entries`);
  }

  // Select top 3 per category
  const result = {};

  for (const [group, entries] of Object.entries(grouped)) {
    if (entries.length === 0) {
      result[group] = { mapped_from: CATEGORY_MAP[group], examples: [] };
      continue;
    }

    // Group entries by their raw category for diversity
    const byRawCat = {};
    for (const e of entries) {
      if (!byRawCat[e.category]) byRawCat[e.category] = [];
      byRawCat[e.category].push(e);
    }

    // Get intent buckets for this group
    const intentBuckets = INTENT_BUCKETS[group] || [];

    const selected = [];
    const usedIndices = new Set();

    // Strategy 1: Pick best from each intent bucket (for diversity)
    for (const bucket of intentBuckets) {
      if (selected.length >= 3) break;

      // Find entries matching any intent in this bucket
      const candidates = [];
      for (let i = 0; i < entries.length; i++) {
        if (usedIndices.has(i)) continue;
        if (bucket.includes(entries[i].intent)) {
          candidates.push({ entry: entries[i], index: i, score: scoreEntry(entries[i]) });
        }
      }

      // Sort by score descending
      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        const best = candidates[0];
        selected.push(best.entry);
        usedIndices.add(best.index);
      }
    }

    // Strategy 2: If we still need more, fill from top-scored remaining
    if (selected.length < 3) {
      const remaining = [];
      for (let i = 0; i < entries.length; i++) {
        if (usedIndices.has(i)) continue;
        remaining.push({ entry: entries[i], index: i, score: scoreEntry(entries[i]) });
      }
      remaining.sort((a, b) => b.score - a.score);

      for (const r of remaining) {
        if (selected.length >= 3) break;
        selected.push(r.entry);
        usedIndices.add(r.index);
      }
    }

    // Format output
    result[group] = {
      mapped_from: CATEGORY_MAP[group],
      total_entries_in_group: entries.length,
      examples: selected.map((e, idx) => {
        const userMsg = e.messages.find((m) => m.role === "user");
        const asstMsg = e.messages.find((m) => m.role === "assistant");
        return {
          rank: idx + 1,
          raw_category: e.category,
          intent: e.intent,
          source: e.source,
          user_message: userMsg.content,
          assistant_message: asstMsg.content,
        };
      }),
    };
  }

  // Write output
  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf8");
  console.log(`\nOutput written to: ${OUTPUT}`);

  // Print summary
  console.log("\n=== EXTRACTION SUMMARY ===");
  for (const [group, data] of Object.entries(result)) {
    console.log(`\n${group} (from: ${data.mapped_from.join(", ")}) — ${data.total_entries_in_group} total entries`);
    for (const ex of data.examples) {
      const userPreview = ex.user_message.substring(0, 80).replace(/\n/g, " ");
      console.log(`  [${ex.rank}] intent=${ex.intent} | "${userPreview}..."`);
    }
  }
}

main();
