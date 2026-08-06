/**
 * C-Support — Intent Classifier
 *
 * Maps freeform customer messages to typed intents using:
 * 1. Exact keyword matching (fast path)
 * 2. Fuzzy matching for common typos (Levenshtein ≤ 2)
 * 3. Regex pattern recognition (order numbers, emails, etc.)
 * 4. Sentiment detection (frustration, urgency, escalation)
 * 5. Conversation context (pronouns, references to prior topics)
 *
 * Follows the category taxonomy from the training dataset:
 * ACCOUNT, ORDER, DELIVERY, SHIPPING, REFUND, RETURNS, COMPLAINTS,
 * BILLING, PAYMENT, SUBSCRIPTION, CANCEL, CONTACT, PRODUCT, GENERAL
 */

// ── Types ─────────────────────────────────────────

export type Intent =
  | "greeting"
  | "account_signup"
  | "account_login"
  | "account_password"
  | "account_close"
  | "order_status"
  | "order_cancel"
  | "delivery"
  | "shipping"
  | "refund"
  | "returns"
  | "exchange"
  | "complaint"
  | "billing"
  | "payment"
  | "subscription"
  | "cancellation"
  | "product"
  | "contact"
  | "hours"
  | "thank_you"
  | "help"
  | "acknowledgment"
  | "escalation"
  | "unclear";

export type Sentiment = "neutral" | "frustrated" | "angry" | "confused" | "urgent";

export interface ClassifiedIntent {
  intent: Intent;
  sentiment: Sentiment;
  confidence: number; // 0–1
  keywords: string[]; // matched keywords for debugging
  patterns: string[]; // matched patterns (e.g., "order_number:#5585943")
}

interface IntentRule {
  intent: Intent;
  keywords: string[];
  phrases: string[];
  patterns?: RegExp[];
  boost?: number; // extra confidence for phrase matches
}

// ── Intent Rules (ordered by priority) ────────────

const INTENT_RULES: IntentRule[] = [
  // ── Escalation (highest priority) ──
  {
    intent: "escalation",
    keywords: [
      "human", "agent", "real person", "talk to someone", "speak to someone",
      "representative", "supervisor", "manager", "manager", "ceo",
    ],
    phrases: [
      "talk to a human", "speak to a human", "connect me to",
      "transfer me to", "i want to talk to", "i need a real person",
      "connect me with a human", "get me a manager", "where is a real person",
    ],
  },

  // ── Greetings ──
  {
    intent: "greeting",
    keywords: ["hello", "hi", "hey", "sup", "yo", "howdy", "greetings"],
    phrases: [
      "good morning", "good afternoon", "good evening",
      "what's up", "whats up", "how's it going",
    ],
    patterns: [/^(hi|hey|hello|yo|sup)\s*[!.?]*$/i],
  },

  // ── Thank you ──
  {
    intent: "thank_you",
    keywords: ["thank", "thanks", "appreciate", "grateful"],
    phrases: [
      "thank you", "thanks a lot", "thanks so much",
      "really appreciate", "that helps", "you're great", "you're awesome",
    ],
  },

  // ── Help / What can you do ──
  {
    intent: "help",
    keywords: ["help", "capabilities", "options", "menu"],
    phrases: [
      "what can you do", "what do you do", "what are you",
      "how does this work", "what can i ask", "i need help",
      "can you help me", "help me",
    ],
  },

  // ── Account: Signup / Registration ──
  {
    intent: "account_signup",
    keywords: [
      "signup", "sign up", "register", "registration", "creating account",
      "create account", "new account", "join", "signing up", "sign up issue",
      "sign up problem", "signing up issue", "account creation",
    ],
    phrases: [
      "i have issue signing", "i have a problem signing up",
      "issue with signing up", "problem with sign up",
      "can't sign up", "cannot sign up", "unable to sign up",
      "can't create an account", "cannot create account",
      "trouble signing up", "trouble creating account",
      "sign up not working", "signup not working",
      "register not working", "registration not working",
      "problem creating account", "issue creating account",
      "i can't register", "i cannot register",
    ],
  },

  // ── Account: Login / Password ──
  {
    intent: "account_login",
    keywords: [
      "login", "log in", "sign in", "signin", "forgot password",
      "reset password", "password reset", "locked out", "can't login",
      "cannot login", "can't log in", "can't sign in",
      "authentication", "verify", "verification",
    ],
    phrases: [
      "i can't login", "i cannot login", "i can't log in",
      "i can't sign in", "i cannot sign in",
      "forgot my password", "forgot password", "reset my password",
      "password is not working", "password doesn't work",
      "i'm locked out", "im locked out", "locked out of my account",
      "can't access my account", "unable to access my account",
      "not receiving verification", "didn't receive verification email",
    ],
  },

  // ── Account: Close ──
  {
    intent: "account_close",
    keywords: ["close account", "delete account", "deactivate"],
    phrases: [
      "close my account", "delete my account", "deactivate my account",
      "i don't want my account", "cancel my account",
      "how to close account", "how to delete account",
    ],
  },

  // ── Order: Status / Tracking ──
  {
    intent: "order_status",
    keywords: [
      "order status", "track order", "where is my order",
      "order tracking", "order update", "dispatched",
    ],
    phrases: [
      "where is my order", "what is my order status",
      "track my order", "can you track my order",
      "when will my order arrive", "when will it arrive",
      "has my order shipped", "is my order coming",
      "where is my package", "where is my delivery",
      "order hasn't arrived", "order not arrived",
      "still waiting for my order", "haven't received my order",
      "didn't receive my order", "not received my order",
    ],
    patterns: [/#\d{5,}/, /\bORD[-\s]?\d{4,}/i, /\border\s*(number|num|#)?\s*:?\s*\d+/i],
  },

  // ── Order: Cancel ──
  {
    intent: "order_cancel",
    keywords: ["cancel order", "cancel my order"],
    phrases: [
      "cancel my order", "i want to cancel my order",
      "can i cancel my order", "how to cancel order",
      "stop my order", "don't want my order anymore",
      "i don't want this order", "remove my order",
    ],
  },

  // ── Delivery / Shipping ──
  {
    intent: "delivery",
    keywords: [
      "delivery", "deliver", "shipping", "shipped", "ship",
      "track", "tracking", "courier", "logistics",
    ],
    phrases: [
      "where is my delivery", "when will it be delivered",
      "delivery status", "shipping status",
      "how long does shipping take", "how long is delivery",
      "standard shipping", "express shipping",
      "free shipping", "shipping cost", "delivery time",
      "has it been shipped", "is it on the way",
    ],
  },

  // ── Refund ──
  {
    intent: "refund",
    keywords: [
      "refund", "money back", "reimburse", "reimbursement",
      "charged incorrectly", "wrong charge", "overcharged",
      "charged twice", "double charged", "incorrect charge",
      "incorrect amount", "wrong amount", "debited",
    ],
    phrases: [
      "i want a refund", "i need a refund", "can i get a refund",
      "money back", "i want my money back", "give me my money back",
      "charged incorrectly", "wrong charge", "overcharged",
      "charged twice", "double charged", "incorrect charge",
      "i was charged incorrectly", "my payment was debited incorrectly",
      "charged wrong amount", "charged the wrong amount",
      "refund my money", "process my refund",
    ],
  },

  // ── Returns / Exchanges ──
  {
    intent: "returns",
    keywords: [
      "return", "returned", "returning", "send back",
      "wrong item", "damaged", "broken", "defective",
      "not as described", "doesn't match",
    ],
    phrases: [
      "i want to return", "i need to return", "can i return",
      "return this item", "return my order",
      "wrong item received", "received wrong item",
      "item is damaged", "item arrived damaged", "item is broken",
      "item is defective", "not what i ordered",
      "doesn't match the description", "not as described",
      "i'd like to exchange", "can i exchange",
    ],
  },

  // ── Complaint ──
  {
    intent: "complaint",
    keywords: [
      "complaint", "unhappy", "frustrated", "angry", "disappointed",
      "terrible", "worst", "awful", "horrible", "unacceptable",
      "not happy", "poor service", "bad experience", "disgusted",
    ],
    phrases: [
      "i'm unhappy", "i am unhappy", "i'm not happy", "not happy with",
      "very disappointed", "i'm frustrated", "this is frustrating",
      "i'm angry", "this is unacceptable", "poor service",
      "worst experience", "bad experience", "terrible service",
      "i want to complain", "i have a complaint",
      "i just said", "i already told you", "i already said",
    ],
  },

  // ── Billing / Payment ──
  {
    intent: "payment",
    keywords: [
      "payment", "pay", "card", "credit card", "debit card",
      "invoice", "receipt", "coupon", "discount", "promo",
      "promotion", "voucher", "offer",
    ],
    phrases: [
      "payment methods", "payment options", "how to pay",
      "do you accept", "credit card", "debit card",
      "paypal", "apply coupon", "use promo code",
      "discount code", "promo code", "voucher code",
      "payment failed", "payment error", "payment not working",
      "can't pay", "unable to pay", "payment declined",
    ],
  },

  // ── Subscription ──
  {
    intent: "subscription",
    keywords: ["subscription", "subscribe", "plan", "renew", "renewal"],
    phrases: [
      "my subscription", "cancel subscription", "renew subscription",
      "change plan", "upgrade plan", "downgrade plan",
      "subscription expired", "plan expired",
      "how to subscribe", "what plans do you have",
      "pricing", "how much does it cost",
    ],
  },

  // ── Cancellation ──
  {
    intent: "cancellation",
    keywords: ["cancel", "cancellation"],
    phrases: [
      "i want to cancel", "how do i cancel", "cancel my",
      "stop my subscription", "end my subscription",
    ],
  },

  // ── Product ──
  {
    intent: "product",
    keywords: [
      "product", "products", "item", "items", "size", "color",
      "colour", "material", "spec", "specs", "specification",
      "feature", "features", "available", "in stock", "out of stock",
      "availability", "catalog", "collection",
    ],
    phrases: [
      "do you have", "is this available", "what sizes",
      "what colors", "what material", "product details",
      "tell me about", "more information about",
      "in stock", "out of stock", "when will it be back",
      "do you sell", "what do you sell",
    ],
  },

  // ── Contact / Hours ──
  {
    intent: "contact",
    keywords: [
      "contact", "phone", "email", "address", "location",
      "hour", "hours", "open", "close", "closing time",
      "business hours", "working hours", "visit", "store",
    ],
    phrases: [
      "how can i contact", "how to contact", "what are your hours",
      "when are you open", "when do you open", "when do you close",
      "where are you located", "what is your address",
      "your phone number", "your email address",
      "business hours", "working hours", "store hours",
    ],
  },
];

// ── Common Typos Map ──────────────────────────────
// Maps misspelled words to their correct forms for fuzzy matching

const TYPO_MAP: Record<string, string[]> = {
  payment: ["paymenr", "paymet", "payent", "paymnet", "paymant", "pament", "paymnt"],
  refund: ["refnd", "refun", "refud", "reufnd"],
  shipping: ["shiping", "shpping", "shippping"],
  delivery: ["delivary", "delivry", "dilevery", "delivr"],
  subscription: ["subcription", "suscription", "subscribtion"],
  register: ["registr", "regster", "regiser"],
  password: ["passwrd", "passord", "pasword", "passwod"],
  account: ["acount", "acconut", "accont"],
  return: ["retun", "retrun", "retur"],
  exchange: ["exchage", "exchnage", "excahnge"],
  complaint: ["complent", "complant", "compaint"],
  product: ["prodcut", "produt", "produuct"],
  cancel: ["cancle", "cnacel", "caancel"],
  invoice: ["invioce", "invlice", "invpoice"],
};

// ── Pattern Recognizers ───────────────────────────

const ORDER_NUMBER_PATTERNS: RegExp[] = [
  /#(\d{5,})/,                    // #5585943
  /\bORD[-\s]?(\d{4,})/i,        // ORD-12345, ORD 12345
  /\border\s*(?:number|num|#)?\s*:?\s*(\d{4,})/i,  // order number: 12345
  /\b(\d{8,12})\b/,               // 8-12 digit numbers (possible order IDs)
];

const EMAIL_PATTERN = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/;

const PHONE_PATTERN = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

// ── Levenshtein Distance ──────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// ── Fuzzy Typo Detection ──────────────────────────

function findTypoMatch(word: string): string | null {
  const lower = word.toLowerCase();
  // Check direct typo map first
  for (const [correct, typos] of Object.entries(TYPO_MAP)) {
    if (typos.includes(lower)) return correct;
  }
  // Fuzzy: check if any typo in the map is within edit distance 2
  for (const [correct, typos] of Object.entries(TYPO_MAP)) {
    for (const typo of typos) {
      if (levenshtein(lower, typo) <= 2) return correct;
    }
  }
  return null;
}

// ── Sentiment Detection ───────────────────────────

function detectSentiment(msg: string): Sentiment {
  const lower = msg.toLowerCase();

  // Angry / very frustrated
  if (
    /\b(terrible|worst|awful|horrible|unacceptable|disgusting|hate|furious|pissed|wtf|damn)\b/.test(lower) ||
    /\b(angry|mad|livid|outraged)\b/.test(lower)
  ) return "angry";

  // Frustrated
  if (
    /\b(frustrated|annoyed|irritated|upset|unhappy|disappointed|not happy|not satisfied)\b/.test(lower) ||
    /\b(this is ridiculous|this is stupid|are you kidding|are you serious)\b/.test(lower) ||
    /\bi just said\b|\bi already (told|said|explained)\b|\bmultiple times\b|\bover and over\b/.test(lower)
  ) return "frustrated";

  // Urgent
  if (
    /\b(urgent|asap|immediately|right now|emergency|critical|deadline)\b/.test(lower) ||
    /\bneed this (now|today|asap|urgent)\b/.test(lower)
  ) return "urgent";

  // Confused
  if (
    /\b(confused|confusing|don't understand|doesn't make sense|what do you mean|what are you talking)\b/.test(lower) ||
    /\bhuh\??\s*$|\bwhat\?\s*$/.test(lower)
  ) return "confused";

  return "neutral";
}

// ── Order Number Extraction ───────────────────────

function extractOrderNumber(msg: string): string | null {
  for (const pattern of ORDER_NUMBER_PATTERNS) {
    const match = msg.match(pattern);
    if (match) return match[0]; // return the full match including prefix
  }
  return null;
}

// ── Main Classifier ───────────────────────────────

export function classifyIntent(
  userMessage: string,
  conversationHistory?: Array<{ role: string; content: string }>
): ClassifiedIntent {
  const msg = userMessage.toLowerCase().trim();
  const sentiment = detectSentiment(msg);
  const keywords: string[] = [];
  const patterns: string[] = [];

  // ── 1. Check for order number pattern (highest priority if present) ──
  const orderNum = extractOrderNumber(msg);
  if (orderNum) {
    patterns.push(`order_number:${orderNum}`);
  }

  // ── 2. Check for email/phone patterns ──
  if (EMAIL_PATTERN.test(userMessage)) {
    patterns.push("email_detected");
  }
  if (PHONE_PATTERN.test(userMessage)) {
    patterns.push("phone_detected");
  }

  // ── 3. Fuzzy typo correction ──
  const words = msg.split(/\s+/);
  let correctedMsg = msg;
  for (const word of words) {
    const correction = findTypoMatch(word);
    if (correction && correction !== word.toLowerCase()) {
      correctedMsg = correctedMsg.replace(word, correction);
      keywords.push(`typo:${word}→${correction}`);
    }
  }

  // ── 4. Match against intent rules ──
  let bestMatch: { intent: Intent; score: number; matchedKeywords: string[] } | null = null;

  for (const rule of INTENT_RULES) {
    let score = 0;
    const matchedKw: string[] = [];

    // Check phrases (higher weight — more specific)
    for (const phrase of rule.phrases) {
      if (correctedMsg.includes(phrase) || msg.includes(phrase)) {
        score += 3;
        matchedKw.push(`phrase:"${phrase}"`);
      }
    }

    // Check keywords
    for (const keyword of rule.keywords) {
      if (correctedMsg.includes(keyword) || msg.includes(keyword)) {
        score += 1;
        matchedKw.push(`kw:"${keyword}"`);
      }
    }

    // Check regex patterns
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(correctedMsg) || pattern.test(msg)) {
          score += 2;
          matchedKw.push(`pattern:${pattern.source}`);
        }
      }
    }

    // Apply boost
    if (score > 0 && rule.boost) {
      score += rule.boost;
    }

    // Sentiment boost for complaint
    if (rule.intent === "complaint" && sentiment === "angry") {
      score += 2;
    }
    if (rule.intent === "complaint" && sentiment === "frustrated") {
      score += 1;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { intent: rule.intent, score, matchedKeywords: matchedKw };
    }
  }

  // ── 5. Context-aware disambiguation ──
  if (bestMatch && conversationHistory && conversationHistory.length > 0) {
    const lastAssistantMsg = [...conversationHistory]
      .reverse()
      .find((m) => m.role === "assistant")?.content.toLowerCase() || "";

    // If last assistant asked about order number and current message is just a number
    if (
      orderNum &&
      (lastAssistantMsg.includes("order number") || lastAssistantMsg.includes("order details"))
    ) {
      bestMatch = { intent: "order_status", score: 10, matchedKeywords: ["context:order_number_response"] };
    }

    // If user is repeating themselves or expressing frustration after a generic response
    if (
      sentiment === "frustrated" &&
      bestMatch.intent === "unclear" &&
      (msg.includes("i just said") || msg.includes("i already told") || msg.includes("again"))
    ) {
      // Try to infer from the last user message
      const lastUserMsg = [...conversationHistory]
        .reverse()
        .find((m) => m.role === "user")?.content.toLowerCase() || "";
      // Re-classify the previous message
      const reClassified = classifyIntent(lastUserMsg);
      if (reClassified.intent !== "unclear") {
        bestMatch = { intent: reClassified.intent, score: 5, matchedKeywords: ["context:repeated_complaint"] };
      }
    }
  }

  // ── 6. Resolve ──
  if (bestMatch && bestMatch.score >= 1) {
    // Calculate confidence (cap at 1.0)
    const confidence = Math.min(bestMatch.score / 6, 1.0);
    keywords.push(...bestMatch.matchedKeywords);

    return {
      intent: bestMatch.intent,
      sentiment,
      confidence,
      keywords,
      patterns,
    };
  }

  // ── 7. Order number without clear intent → treat as order status ──
  if (orderNum) {
    return {
      intent: "order_status",
      sentiment,
      confidence: 0.8,
      keywords: ["order_number_detected"],
      patterns,
    };
  }

  // ── 8. Fallback: unclear ──
  return {
    intent: "unclear",
    sentiment,
    confidence: 0.2,
    keywords,
    patterns,
  };
}
