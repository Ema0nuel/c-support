/**
 * C-Support — Policy-Aware Response Engine
 *
 * Generates contextually relevant customer support responses by:
 * 1. Matching the classified intent to a response template
 * 2. Searching business policies (from onboarding) for relevant entries
 * 3. Injecting business name, niche, and policy details into the response
 * 4. Adapting tone based on personality and customer sentiment
 * 5. Handling conversation history for context continuity
 *
 * Templates are modeled after the training dataset patterns (136k examples)
 * from bitext_ecommerce, bitext_telco, bitext_general, etc.
 */

import type { Intent, Sentiment, ClassifiedIntent } from "./intent-classifier";

// ── Types ─────────────────────────────────────────

export interface BusinessContext {
  businessName: string;
  businessNiche: string;
  businessOrigin: string;
  policiesInput: string;
  suggestedPolicies?: Array<{ category: string; description: string }>;
}

export interface ConversationContext {
  lastUserMessage?: string;
  lastAssistantMessage?: string;
  topicHistory: Intent[]; // intents from previous turns
}

export type PersonalityId = "professional" | "friendly" | "concise" | "empathetic";

interface ResponseTemplate {
  intent: Intent;
  responses: {
    neutral: string[];
    frustrated: string[];
    angry: string[];
    confused: string[];
    urgent: string[];
  };
}

// ── Policy Search ──────────────────────────────────
// Scans the raw policiesInput text for sections relevant to the intent

const INTENT_POLICY_KEYWORDS: Record<Intent, string[]> = {
  greeting: [],
  account_signup: ["account", "registration", "sign up", "signup", "register", "create account"],
  account_login: ["login", "password", "account access", "sign in", "authentication", "forgot"],
  account_password: ["password", "reset password", "forgot password", "change password", "password reset"],
  account_close: ["account closure", "delete account", "close account", "deactivate"],
  order_status: ["order", "tracking", "status", "dispatch", "shipment"],
  order_cancel: ["cancel", "cancellation", "order modification"],
  delivery: ["delivery", "shipping", "dispatch", "courier", "logistics"],
  shipping: ["shipping", "delivery", "freight", "courier"],
  refund: ["refund", "money back", "reimbursement", "return policy"],
  returns: ["return", "returns", "send back", "defective", "damaged"],
  exchange: ["exchange", "swap", "replace", "replacement"],
  complaint: ["complaint", "quality", "satisfaction", "service"],
  billing: ["billing", "invoice", "receipt", "charge"],
  payment: ["payment", "pay", "card", "transaction", "checkout"],
  subscription: ["subscription", "plan", "renewal", "recurring"],
  cancellation: ["cancel", "cancellation", "terminate"],
  product: ["product", "item", "catalog", "stock", "availability", "specification"],
  contact: ["contact", "phone", "email", "address", "reach"],
  hours: ["hours", "open", "close", "business hours", "working hours"],
  thank_you: [],
  help: [],
  acknowledgment: [],
  escalation: ["escalation", "supervisor", "human agent"],
  unclear: [],
};

function findRelevantPolicies(
  intent: Intent,
  policiesInput: string,
  suggestedPolicies?: Array<{ category: string; description: string }>
): string[] {
  const results: string[] = [];
  const keywords = INTENT_POLICY_KEYWORDS[intent] || [];

  if (!policiesInput && !suggestedPolicies) return results;

  // Search raw policy text for relevant sections
  if (policiesInput) {
    const lines = policiesInput.split(/\n/).filter((l) => l.trim());
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          results.push(line.trim());
          break;
        }
      }
    }
  }

  // Search structured policies from AI analysis
  if (suggestedPolicies) {
    for (const policy of suggestedPolicies) {
      const catLower = policy.category.toLowerCase();
      const descLower = policy.description.toLowerCase();
      for (const kw of keywords) {
        if (catLower.includes(kw) || descLower.includes(kw)) {
          const entry = `${policy.category}: ${policy.description}`;
          if (!results.includes(entry)) {
            results.push(entry);
          }
          break;
        }
      }
    }
  }

  // Deduplicate and return top 3 most relevant
  return [...new Set(results)].slice(0, 3);
}

// ── Response Templates ─────────────────────────────
// Modeled after 136k training examples

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  // ── Greeting ──
  {
    intent: "greeting",
    responses: {
      neutral: [
        "Hello! Welcome to {biz} support. How can I assist you today?",
        "Hi there! Welcome to {biz}. I'm here to help — what can I do for you?",
      ],
      frustrated: [
        "Hello, I understand you may have had a frustrating experience. I'm here to help — what's going on?",
      ],
      angry: [
        "Hello, I'm sorry to hear things haven't been going well. I'm here to help resolve this for you.",
      ],
      confused: [
        "Hello! Welcome to {biz} support. Don't worry, I'll guide you through whatever you need.",
      ],
      urgent: [
        "Hello! I see this might be urgent. Let me help you right away — what do you need?",
      ],
    },
  },

  // ── Account: Signup ──
  {
    intent: "account_signup",
    responses: {
      neutral: [
        "I'd be happy to help you create your {biz} account. Here's what you need:\n\n1. Visit our website and click \"Sign Up\" or \"Create Account\"\n2. Enter your email address and create a secure password\n3. Check your inbox for a verification email\n4. Click the verification link to activate your account\n\n{policy}\n\nIf you run into any issues during signup, let me know and I'll walk you through it.",
        "Creating a {biz} account is straightforward. You'll need a valid email address and a password (minimum 8 characters with at least one number). After registering, you'll receive a verification email — click the link to activate your account.\n\n{policy}\n\nIs there a specific step you're having trouble with?",
      ],
      frustrated: [
        "I'm sorry you're having trouble signing up. Let me help you resolve this step by step:\n\n1. Make sure your email address is entered correctly (no typos)\n2. Your password needs at least 8 characters and one number\n3. Try clearing your browser cache or using a different browser\n4. Check your spam/junk folder for the verification email\n5. If you still can't sign up, the email may already be registered — try the \"Forgot Password\" option\n\n{policy}\n\nIf none of these steps work, I can escalate this to our technical team. Could you share the email you're trying to register with?",
        "I understand how frustrating signup issues can be. Let's get this sorted:\n\n• Are you receiving any error messages? If so, what do they say?\n• Have you tried a different browser or device?\n• Is the verification email landing in your spam folder?\n\n{policy}\n\nPlease share any details about what happens when you try to sign up, and I'll pinpoint the issue.",
      ],
      angry: [
        "I'm really sorry you're experiencing issues with signup — I understand how frustrating this is. Let me help you right away.\n\nFirst, let me check if there are any known issues. In the meantime:\n1. Try using a different browser (Chrome, Firefox, or Safari)\n2. Clear your browser cache and cookies\n3. Check your spam folder for the verification email\n\n{policy}\n\nIf this still doesn't work, I'll escalate this immediately to our technical team. Your account creation is important to us.",
      ],
      confused: [
        "No worries, I'll walk you through the signup process:\n\n1. Go to our website and look for the \"Sign Up\" or \"Create Account\" button\n2. Enter your email and choose a password\n3. You'll receive a verification email — click the link inside\n4. That's it! Your account is ready\n\n{policy}\n\nWhich step are you stuck on? I can guide you through it.",
      ],
      urgent: [
        "I understand this is urgent. Let me help you create your account right away.\n\nThe fastest way: visit our website, click \"Sign Up\", enter your email and password, then verify via the email we send you.\n\n{policy}\n\nIf you need immediate assistance, I can escalate this to a team member.",
      ],
    },
  },

  // ── Account: Login ──
  {
    intent: "account_login",
    responses: {
      neutral: [
        "I can help with that. Here are the steps to get back into your account:\n\n1. Go to the login page and click \"Forgot Password\"\n2. Enter your registered email address\n3. Check your inbox for the password reset link\n4. Create a new password and log in\n\n{policy}\n\nIf you're still having trouble, let me know what error message you're seeing.",
        "For login issues, try these steps:\n\n• Make sure Caps Lock is off and you're using the correct email\n• Use the \"Forgot Password\" link to reset your password\n• Clear your browser cookies and try again\n• If you're locked out, wait 15 minutes before retrying\n\n{policy}\n\nWhich of these applies to your situation?",
      ],
      frustrated: [
        "I understand login issues are frustrating. Let's fix this quickly:\n\n1. Click \"Forgot Password\" on the login page\n2. Check your email (including spam folder) for the reset link\n3. Create a new password\n\n{policy}\n\nIf you're not receiving the reset email, there may be an issue with the email address on file. Let me know and I'll look into it.",
      ],
      angry: [
        "I'm sorry you're locked out — I know how aggravating that is. Let's get you back in right now.\n\nPlease try the \"Forgot Password\" option on the login page. If the reset email doesn't arrive within a few minutes, check your spam folder.\n\n{policy}\n\nIf this still doesn't work, I'll escalate this to our team immediately.",
      ],
      confused: [
        "No problem, let me help you get logged in:\n\n1. On the login page, enter your email address\n2. If you've forgotten your password, click \"Forgot Password\" — we'll send you a reset link\n3. Check your email and follow the instructions\n\n{policy}\n\nIf you're not sure which email you used, let me know and I can help you figure it out.",
      ],
      urgent: [
        "Let me help you get back into your account quickly.\n\nUse the \"Forgot Password\" link on the login page — you'll receive a reset email within minutes. If you don't see it, check your spam folder.\n\n{policy}\n\nIf this is time-critical, I can escalate to get you immediate support.",
      ],
    },
  },

  // ── Account: Close ──
  {
    intent: "account_close",
    responses: {
      neutral: [
        "I can help you close your {biz} account. Before you proceed, here's what you should know:\n\n• Any active subscriptions will be cancelled\n• Your data will be permanently deleted after 30 days\n• You can download your data before closing\n\nTo close your account:\n1. Log in to your account\n2. Go to Account Settings\n3. Select \"Close Account\" or \"Delete Account\"\n4. Follow the confirmation steps\n\n{policy}\n\nIs there anything specific that made you decide to close your account? I'd like to understand if we can help.",
      ],
      frustrated: [
        "I'm sorry to hear you want to close your account. I understand something may not have met your expectations.\n\nTo close your account:\n1. Log in and go to Account Settings\n2. Select \"Close Account\"\n3. Follow the prompts\n\n{policy}\n\nBefore you go, would you mind sharing what led to this decision? Your feedback helps us improve.",
      ],
      angry: [
        "I understand you want to close your account, and I respect that decision. I'm sorry your experience wasn't what you expected.\n\nTo proceed: log in, go to Account Settings, and select \"Close Account.\"\n\n{policy}\n\nIf there's anything we could have done differently, I'd genuinely appreciate hearing about it.",
      ],
      confused: [
        "Sure, I can help with that. Here's how to close your {biz} account:\n\n1. Log in to your account on our website\n2. Go to Account Settings or Profile\n3. Look for \"Close Account\" or \"Delete Account\"\n4. Follow the prompts to confirm\n\n{policy}\n\nWould you like me to guide you through any of these steps?",
      ],
      urgent: [
        "I'll help you close your account right away. Go to Account Settings and select \"Close Account.\" The process takes just a few minutes.\n\n{policy}\n\nLet me know if you need any assistance during the process.",
      ],
    },
  },

  // ── Order: Status ──
  {
    intent: "order_status",
    responses: {
      neutral: [
        "I'd be happy to check on your order. To look it up, could you share your order number? You can find it in your confirmation email.\n\nIn the meantime, here's what to expect with {biz} shipping:\n• Standard shipping: 3–5 business days\n• Express shipping: 1–2 business days\n\n{policy}\n\nOnce you share the order number, I can give you the exact status.",
        "Let me help you track your order. You can find your order number in the confirmation email you received after placing the order.\n\n{policy}\n\nPlease share your order number and I'll check the status right away.",
      ],
      frustrated: [
        "I understand the wait is frustrating. Let me check on your order right away.\n\nCould you please share your order number? You can find it in your confirmation email. Once I have that, I can give you the exact delivery status.\n\n{policy}\n\nI'll do my best to get you an update as quickly as possible.",
      ],
      angry: [
        "I'm sorry your order hasn't arrived as expected. That's not the experience we want for you. Let me investigate this immediately.\n\nPlease share your order number so I can check the current status and, if needed, escalate this with our shipping team.\n\n{policy}\n",
      ],
      confused: [
        "Of course! To check your order status, I'll need your order number — it's in the confirmation email you received when you placed the order.\n\n{policy}\n\nOnce you share that, I can look up exactly where your order is.",
      ],
      urgent: [
        "Let me check on your order right away. Please share your order number (from your confirmation email) and I'll get you an immediate status update.\n\n{policy}\n",
      ],
    },
  },

  // ── Order: Cancel ──
  {
    intent: "order_cancel",
    responses: {
      neutral: [
        "I can help you cancel your order. Whether this is possible depends on the current status:\n\n• If the order hasn't shipped yet: I can cancel it and process a full refund\n• If the order has already shipped: you'll need to return it once delivered for a refund\n\n{policy}\n\nCould you share your order number so I can check if cancellation is still possible?",
        "To cancel your order, I'll need your order number. Please note:\n\n• Orders can only be cancelled before they've been dispatched\n• If already shipped, you can return the item upon delivery for a full refund\n\n{policy}\n\nShare your order number and I'll check right away.",
      ],
      frustrated: [
        "I understand you need to cancel this order. Let me check if it's still possible.\n\nPlease share your order number. If the order hasn't shipped yet, I can cancel it immediately. If it has shipped, we can arrange a return once it arrives.\n\n{policy}\n",
      ],
      angry: [
        "I'm sorry for the inconvenience. Let me cancel your order as quickly as possible.\n\nPlease share your order number. If it hasn't been dispatched yet, I'll cancel it right away and ensure your refund is processed.\n\n{policy}\n",
      ],
      confused: [
        "No problem! To cancel your order:\n\n1. Share your order number with me\n2. I'll check if the order has been shipped\n3. If not shipped, I'll cancel it and process your refund\n4. If already shipped, you can return it when it arrives\n\n{policy}\n\nWhat's your order number?",
      ],
      urgent: [
        "Let me cancel your order immediately. Please share your order number and I'll check if it can still be stopped before shipping.\n\n{policy}\n",
      ],
    },
  },

  // ── Delivery / Shipping ──
  {
    intent: "delivery",
    responses: {
      neutral: [
        "Here's what I can tell you about {biz} shipping:\n\n• Standard shipping: 3–5 business days\n• Express shipping: 1–2 business days\n• You'll receive a tracking number via email once your order ships\n• You can track your order using the link in your confirmation email\n\n{policy}\n\nIs there a specific order you'd like me to check on?",
        "Great question! At {biz}, here's how shipping works:\n\n1. After placing your order, you'll receive a confirmation email\n2. Once shipped, you'll get a tracking number\n3. Standard delivery takes 3–5 business days\n4. Express options are available at checkout\n\n{policy}\n\nLet me know if you need help with a specific order.",
      ],
      frustrated: [
        "I understand the shipping delay is frustrating. Let me help you get answers.\n\nCould you share your order number? I can check the current status. Standard shipping at {biz} is 3–5 business days, but if your order is overdue, I'll escalate this with our logistics team.\n\n{policy}\n",
      ],
      angry: [
        "I'm sorry your delivery hasn't arrived on time. That's not acceptable, and I want to resolve this for you.\n\nPlease share your order number so I can investigate immediately. If there's been a delay, I'll escalate with our shipping team.\n\n{policy}\n",
      ],
      confused: [
        "Sure, let me explain how shipping works at {biz}:\n\n1. After checkout, you'll receive an order confirmation email\n2. When your order ships, we'll send you a tracking number\n3. Standard delivery: 3–5 business days\n4. Express delivery: 1–2 business days\n\n{policy}\n\nDo you have a specific question about an order?",
      ],
      urgent: [
        "I understand this is time-sensitive. Let me check your shipping status right away.\n\nPlease share your order number and I'll give you an immediate update. If there's a delay, I'll escalate with our logistics team.\n\n{policy}\n",
      ],
    },
  },

  // ── Refund ──
  {
    intent: "refund",
    responses: {
      neutral: [
        "I can help you with your refund request. Here's how it works at {biz}:\n\n1. Refund eligibility: items returned within 30 days of purchase in original condition\n2. Processing time: 2–3 business days after we receive the return\n3. Refund method: credited back to your original payment method within 5–7 business days\n\n{policy}\n\nCould you share your order number and the reason for the refund so I can process this for you?",
        "I'd be happy to assist with your refund. At {biz}, our policy covers:\n\n• Full refund within 30 days of purchase\n• Items must be in original condition\n• Refund processed to original payment method\n\n{policy}\n\nTo get started, please share your order number.",
      ],
      frustrated: [
        "I understand your frustration with the charge. Let me help you get this resolved.\n\nFor incorrect charges at {biz}, here's what I'll do:\n1. Review your order and payment details\n2. Process a correction or refund\n3. Ensure the amount is credited back within 5–7 business days\n\n{policy}\n\nPlease share your order number and I'll look into this right away.",
      ],
      angry: [
        "I'm very sorry about the incorrect charge. That's not acceptable, and I'll make sure this is resolved.\n\nLet me investigate immediately:\n1. I'll review the charge on your account\n2. Process the correction or full refund\n3. Ensure it's credited within 5–7 business days\n\n{policy}\n\nPlease share your order number so I can prioritize this.",
      ],
      confused: [
        "No problem, let me explain the refund process:\n\n1. Share your order number with me\n2. I'll review your order and the charge\n3. If eligible, I'll process the refund\n4. You'll see the credit in 5–7 business days\n\n{policy}\n\nWhat's your order number?",
      ],
      urgent: [
        "I'll handle this refund request right away. Please share your order number and I'll review the charge immediately.\n\n{policy}\n",
      ],
    },
  },

  // ── Returns / Exchanges ──
  {
    intent: "returns",
    responses: {
      neutral: [
        "I can help you with a return or exchange. Here's the process at {biz}:\n\n1. Items can be returned within 30 days of receiving your order\n2. Items must be in original condition with tags attached\n3. I'll provide a prepaid return shipping label\n4. Once we receive the item, your refund or exchange is processed within 3–5 business days\n\n{policy}\n\nCould you tell me what item you'd like to return and the reason?",
        "I'd be happy to assist with your return. At {biz}, our return policy allows:\n\n• Returns within 30 days of delivery\n• Items in original, unworn condition with tags\n• Free return shipping with a prepaid label\n• Full refund or exchange\n\n{policy}\n\nWhat item would you like to return?",
      ],
      frustrated: [
        "I'm sorry you need to return an item. Let me make this as smooth as possible.\n\nHere's what I'll do:\n1. Generate a prepaid return label for you\n2. You ship the item back at no cost\n3. Once received, your refund or exchange is processed in 3–5 business days\n\n{policy}\n\nPlease share your order number and which item needs to be returned.",
      ],
      angry: [
        "I'm sorry you received an item that wasn't right. That's not the standard we hold at {biz}, and I'll fix this immediately.\n\nI'll provide a prepaid return label right away. Once you send the item back, your refund or replacement will be processed within 3–5 business days.\n\n{policy}\n\nPlease share your order number and I'll get this sorted.",
      ],
      confused: [
        "No worries, I'll walk you through the return process:\n\n1. Tell me which item you want to return and why\n2. I'll send you a prepaid return shipping label\n3. Pack the item and drop it off\n4. Once we receive it, your refund or exchange is processed in 3–5 days\n\n{policy}\n\nWhich item would you like to return?",
      ],
      urgent: [
        "I'll process your return right away. Please share your order number and which item needs to be returned, and I'll generate a prepaid shipping label immediately.\n\n{policy}\n",
      ],
    },
  },

  // ── Complaint ──
  {
    intent: "complaint",
    responses: {
      neutral: [
        "I'm sorry to hear you're not satisfied. Your feedback is important to us, and I want to make this right.\n\nCould you tell me more about what happened? Specifically:\n• What issue did you experience?\n• When did it occur?\n• What would you consider a fair resolution?\n\n{policy}\n\nI'll do everything I can to resolve this for you.",
      ],
      frustrated: [
        "I completely understand your frustration, and I'm sorry you've had this experience. That's not the level of service {biz} aims to provide.\n\nLet me help fix this. Could you share:\n• What specifically went wrong?\n• Your order number (if applicable)\n• What resolution you're looking for\n\n{policy}\n\nI'll prioritize getting this resolved for you.",
      ],
      angry: [
        "I'm truly sorry about your experience. I understand your frustration, and you have every right to be upset. This is not the standard we hold at {biz}.\n\nI want to make this right immediately. Please share:\n• What happened\n• Your order number (if applicable)\n• What would resolve this for you\n\n{policy}\n\nI'll personally ensure this gets the attention it deserves.",
      ],
      confused: [
        "I'm sorry things haven't been clear. Let me help sort this out.\n\nCould you tell me what specifically you're unhappy about? Whether it's an order, a billing issue, or something else — I'll make sure we get to the bottom of it.\n\n{policy}\n\nI'm here to help.",
      ],
      urgent: [
        "I understand this needs immediate attention. Let me help resolve this right away.\n\nPlease share the details of what went wrong and your order number if applicable. I'll prioritize this and get back to you as quickly as possible.\n\n{policy}\n",
      ],
    },
  },

  // ── Payment ──
  {
    intent: "payment",
    responses: {
      neutral: [
        "Here's what I can help with regarding payments at {biz}:\n\n• We accept Visa, Mastercard, American Express, and PayPal\n• Promo codes are entered at checkout\n• Invoices are sent to your email after purchase\n\n{policy}\n\nWhat specific payment question or issue do you have?",
        "Great question! At {biz}, we offer several payment options:\n\n• Credit/Debit cards (Visa, Mastercard, Amex)\n• PayPal\n• Other digital payment methods\n\n{policy}\n\nDo you have a specific payment question or are you experiencing an issue?",
      ],
      frustrated: [
        "I understand payment issues are stressful. Let me help resolve this.\n\nCould you describe what happened? For example:\n• Was your payment declined?\n• Were you charged the wrong amount?\n• Did a transaction fail?\n\n{policy}\n\nI'll look into this right away.",
      ],
      angry: [
        "I'm sorry you're having payment problems. I understand this is concerning, and I'll help resolve it immediately.\n\nPlease share the details of what happened — whether it's a failed payment, incorrect charge, or transaction error — and I'll investigate right away.\n\n{policy}\n",
      ],
      confused: [
        "No problem, let me clarify our payment options at {biz}:\n\n• We accept major credit/debit cards (Visa, Mastercard, Amex)\n• PayPal is also available\n• Promo codes can be entered at checkout\n\n{policy}\n\nWhat would you like to know about payments?",
      ],
      urgent: [
        "I'll help with your payment issue right away. Please share the details — whether it's a failed transaction, incorrect charge, or payment error — and I'll investigate immediately.\n\n{policy}\n",
      ],
    },
  },

  // ── Subscription ──
  {
    intent: "subscription",
    responses: {
      neutral: [
        "I can help with your {biz} subscription. Here's what you need to know:\n\n• View your current plan in Account Settings\n• Upgrade or downgrade at any time\n• Cancellations take effect at the end of the billing cycle\n\n{policy}\n\nWhat would you like to do with your subscription?",
      ],
      frustrated: [
        "I understand subscription issues can be frustrating. Let me help you right away.\n\nCould you tell me what's going on? For example:\n• Billing issue with your subscription?\n• Need to change your plan?\n• Want to cancel?\n\n{policy}\n",
      ],
      angry: [
        "I'm sorry you're having trouble with your subscription. Let me resolve this for you immediately.\n\nPlease share the details of the issue — whether it's billing, plan changes, or cancellation — and I'll take care of it.\n\n{policy}\n",
      ],
      confused: [
        "No worries, let me explain. At {biz}, you can manage your subscription in Account Settings:\n\n• View your current plan and billing cycle\n• Upgrade or downgrade your plan\n• Cancel your subscription\n\n{policy}\n\nWhat would you like to do?",
      ],
      urgent: [
        "I'll help with your subscription right away. Please share what you need — plan change, cancellation, or billing issue — and I'll handle it immediately.\n\n{policy}\n",
      ],
    },
  },

  // ── Cancellation ──
  {
    intent: "cancellation",
    responses: {
      neutral: [
        "I can help you with the cancellation. Here's what to know:\n\n• Cancellations take effect at the end of the current billing cycle\n• You'll retain access until then\n• Any outstanding charges will be handled per our policy\n\n{policy}\n\nWhat would you like to cancel? Your subscription, an order, or something else?",
      ],
      frustrated: [
        "I understand you want to cancel, and I'll help make that happen smoothly.\n\nCould you let me know what you'd like to cancel — your subscription, a specific order, or something else? I'll process it right away.\n\n{policy}\n",
      ],
      angry: [
        "I'm sorry things didn't work out. I'll help you cancel right away.\n\nPlease let me know what you'd like to cancel, and I'll process it immediately. Your access will continue until the end of the current billing cycle.\n\n{policy}\n",
      ],
      confused: [
        "Sure, I can help with that. What would you like to cancel?\n\n• A subscription or membership\n• An order that hasn't shipped yet\n• Something else\n\n{policy}\n\nLet me know and I'll guide you through it.",
      ],
      urgent: [
        "I'll process your cancellation right away. Please let me know what you'd like to cancel — subscription, order, or other — and I'll handle it immediately.\n\n{policy}\n",
      ],
    },
  },

  // ── Product ──
  {
    intent: "product",
    responses: {
      neutral: [
        "I'd be happy to help with product information. At {biz}, I can assist with:\n\n• Availability and stock status\n• Size guides and measurements\n• Material and care instructions\n• Product comparisons\n\n{policy}\n\nWhich product are you interested in?",
        "Great question! Here's what I can help with regarding {biz} products:\n\n• Current availability and stock\n• Detailed specifications and features\n• Size and color options\n• Pricing and promotions\n\n{policy}\n\nWhat product would you like to know about?",
      ],
      frustrated: [
        "I'm sorry you're having trouble finding product information. Let me help.\n\nCould you tell me which specific product you're looking for? I can check availability, specifications, and any other details you need.\n\n{policy}\n",
      ],
      angry: [
        "I understand your frustration. Let me get you the product information you need right away.\n\nPlease tell me which product you're interested in, and I'll provide all the details — availability, specifications, pricing, everything.\n\n{policy}\n",
      ],
      confused: [
        "No problem! I can help you find product information. Just let me know:\n\n• Which product you're interested in\n• What details you need (availability, size, price, etc.)\n\n{policy}\n\nI'll look it up for you.",
      ],
      urgent: [
        "Let me help you right away. Which product are you interested in? I can immediately check availability, pricing, and any other details you need.\n\n{policy}\n",
      ],
    },
  },

  // ── Contact / Hours ──
  {
    intent: "contact",
    responses: {
      neutral: [
        "Here's how to reach {biz}:\n\n• Live chat: Right here, available during business hours\n• Email: support@[businessname].com\n• Phone: Available Mon–Fri, 9:00 AM – 6:00 PM\n• Response time: Usually within 2 hours during business hours\n\n{policy}\n\nIs there something specific I can help you with right now?",
      ],
      frustrated: [
        "I'm sorry you've had trouble reaching us. You've got me right here — let me help directly.\n\n{policy}\n\nWhat do you need assistance with?",
      ],
      angry: [
        "I apologize for the difficulty in reaching support. I'm here now and ready to help.\n\n{policy}\n\nPlease tell me what you need and I'll resolve it for you.",
      ],
      confused: [
        "No worries! You're already talking to {biz} support right here. I can help with orders, payments, returns, account issues, and more.\n\n{policy}\n\nWhat do you need help with?",
      ],
      urgent: [
        "You've reached {biz} support — I'm here to help immediately. What do you need?\n\n{policy}\n",
      ],
    },
  },

  // ── Thank you ──
  {
    intent: "thank_you",
    responses: {
      neutral: [
        "You're welcome! I'm glad I could help. If you have any other questions about {biz}, feel free to ask anytime.",
      ],
      frustrated: [
        "You're welcome! I hope things are looking better now. Don't hesitate to reach out if you need anything else.",
      ],
      angry: [
        "You're welcome. I'm glad we could resolve this. If anything else comes up, I'm here to help.",
      ],
      confused: [
        "You're welcome! Happy to help. Let me know if anything else comes up.",
      ],
      urgent: [
        "You're welcome! Glad I could help quickly. Let me know if you need anything else.",
      ],
    },
  },

  // ── Help ──
  {
    intent: "help",
    responses: {
      neutral: [
        "I'm here to help! At {biz}, I can assist you with:\n\n• Orders — status, tracking, modifications, cancellations\n• Returns & exchanges — initiating returns, policies\n• Refunds — processing and timelines\n• Shipping — options, delivery times, tracking\n• Account — login, password, registration, closure\n• Products — availability, specs, sizing, comparisons\n• Payments — billing, promo codes, invoices\n• Subscriptions — plans, changes, cancellations\n\n{policy}\n\nWhat would you like help with?",
      ],
      frustrated: [
        "I'm sorry things haven't been smooth. I'm here to help with whatever you need at {biz} — orders, returns, payments, account issues, anything.\n\n{policy}\n\nWhat can I help you with?",
      ],
      angry: [
        "I'm here to help fix whatever isn't working. Please tell me what you need and I'll make it right.\n\n{policy}\n",
      ],
      confused: [
        "No problem! I'm your {biz} support assistant. I can help with:\n\n• Orders and deliveries\n• Returns and refunds\n• Payments and billing\n• Account issues\n• Product questions\n\n{policy}\n\nWhat do you need help with?",
      ],
      urgent: [
        "I'm here to help right away. What do you need at {biz}? Orders, payments, returns, account issues — I can handle it all.\n\n{policy}\n",
      ],
    },
  },

  // ── Acknowledgment (yes, no, ok, got it) ──
  {
    intent: "acknowledgment",
    responses: {
      neutral: [
        "Understood. Is there anything else I can help you with regarding your {biz} account or order?",
      ],
      frustrated: [
        "Got it. I'm here if you need anything else — just let me know.",
      ],
      angry: [
        "Noted. I'm still here if you need further assistance with anything.",
      ],
      confused: [
        "Got it. If you have any other questions, I'm happy to help.",
      ],
      urgent: [
        "Understood. Let me know if you need anything else — I'm right here.",
      ],
    },
  },

  // ── Escalation ──
  {
    intent: "escalation",
    responses: {
      neutral: [
        "I understand you'd like to speak with a human agent. I've noted your request and a team member will be with you shortly.\n\nIn the meantime, is there anything I can help resolve while you wait?",
      ],
      frustrated: [
        "I completely understand. Let me connect you with a human agent who can give this their full attention.\n\nA team member will be with you shortly. Is there anything you'd like me to note about your issue before they join?",
      ],
      angry: [
        "I understand, and I'm sorry your experience has led to this. Let me connect you with a senior team member right away.\n\nA human agent will join shortly. I'll make sure they have all the context from our conversation.",
      ],
      confused: [
        "Of course! I'll connect you with a human agent who can provide more personalized assistance.\n\nA team member will be with you shortly. In the meantime, feel free to describe your issue so they have context.",
      ],
      urgent: [
        "I'm escalating this to a human agent right now. A team member will join shortly to assist you immediately.\n\nPlease hold on — help is on the way.",
      ],
    },
  },

  // ── Unclear (fallback) ──
  {
    intent: "unclear",
    responses: {
      neutral: [
        "Thanks for reaching out! I want to make sure I give you the best help possible.\n\nCould you tell me a bit more about what you need? For example:\n• Are you having an issue with an order?\n• Do you have a question about our products or policies?\n• Need help with your account or payment?\n\n{policy}\nThe more details you share, the better I can assist you.",
      ],
      frustrated: [
        "I hear you, and I want to help. Could you tell me a bit more about what's going on? Whether it's an order, payment, account, or product issue — I'm here to assist.\n\n{policy}\n",
      ],
      angry: [
        "I understand you're frustrated, and I want to resolve this. Could you share more details about the issue? Order, payment, account — I'll help with whatever it is.\n\n{policy}\n",
      ],
      confused: [
        "No worries! I'm here to help with anything you need at {biz}.\n\nCould you tell me what you're looking for? I can help with orders, payments, returns, account issues, and more.\n\n{policy}\n",
      ],
      urgent: [
        "I want to help you right away. Could you share a bit more about what you need? I can assist with orders, payments, returns, account issues — whatever it is.\n\n{policy}\n",
      ],
    },
  },
];

// ── Sentiment → key mapping ───────────────────────

function getSentimentKey(sentiment: Sentiment): keyof ResponseTemplate["responses"] {
  switch (sentiment) {
    case "angry": return "angry";
    case "frustrated": return "frustrated";
    case "confused": return "confused";
    case "urgent": return "urgent";
    default: return "neutral";
  }
}

// ── Personality adjustments ────────────────────────

function applyPersonality(
  response: string,
  personalityId: PersonalityId
): string {
  switch (personalityId) {
    case "concise":
      // Shorten: remove bullet points and numbered steps, keep core message
      return response
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          // Keep non-empty lines that aren't bullet/number lists
          if (!trimmed) return false;
          if (/^[•\-\*]\s/.test(trimmed)) return false;
          if (/^\d+\.\s/.test(trimmed)) return false;
          return true;
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    case "friendly":
      // Add warmth markers
      return response
        .replace(/^(Hello|Hi|Sure|Of course)/m, (_, match) => `${match}! 😊`)
        .replace(/Let me help/i, "I'd love to help")
        .replace(/I can help/i, "I'd be happy to help")
        .replace(/Could you/i, "Would you mind")
        .replace(/Is there anything else I can help you with\?/g, "Is there anything else I can help with? I'm always here! 😊");

    case "empathetic":
      // Add empathetic markers
      return response
        .replace(/I understand/i, "I completely understand how you feel")
        .replace(/I'm sorry to hear/i, "I'm truly sorry to hear")
        .replace(/I'm sorry/i, "I'm really sorry");

    case "professional":
    default:
      return response;
  }
}

// ── Main Engine ────────────────────────────────────

export function generateResponse(
  classified: ClassifiedIntent,
  businessContext: BusinessContext,
  personalityId: PersonalityId,
  conversationContext?: ConversationContext
): string {
  const biz = businessContext.businessName.trim() || "our company";
  const sentimentKey = getSentimentKey(classified.sentiment);

  // ── 1. Find the template for this intent ──
  const template = RESPONSE_TEMPLATES.find((t) => t.intent === classified.intent);

  if (!template) {
    // Should never happen — "unclear" covers all fallbacks
    return `Thanks for reaching out to ${biz} support! How can I help you today?`;
  }

  // ── 2. Get sentiment-appropriate response pool ──
  let pool = template.responses[sentimentKey];

  // Fall back to neutral if specific sentiment pool is empty
  if (!pool || pool.length === 0) {
    pool = template.responses.neutral;
  }

  // ── 3. Pick a response (rotate through options based on conversation length) ──
  const historyLen = conversationContext?.topicHistory?.length || 0;
  const responseIndex = historyLen % pool.length;
  let response = pool[responseIndex];

  // ── 4. Find relevant business policies ──
  const relevantPolicies = findRelevantPolicies(
    classified.intent,
    businessContext.policiesInput,
    businessContext.suggestedPolicies
  );

  // ── 5. Inject policy context ──
  let policyBlock = "";
  if (relevantPolicies.length > 0) {
    policyBlock = "**Our policy:**\n" + relevantPolicies.map((p) => `• ${p}`).join("\n");
  }
  response = response.replace(/\{policy\}/g, policyBlock).trim();

  // ── 6. Replace business name placeholder ──
  response = response.replace(/\{biz\}/g, biz);

  // ── 7. Clean up orphaned {policy} tags ──
  response = response.replace(/\{policy\}/g, "").replace(/\n{3,}/g, "\n\n").trim();

  // ── 8. Apply personality adjustments ──
  response = applyPersonality(response, personalityId);

  return response;
}
