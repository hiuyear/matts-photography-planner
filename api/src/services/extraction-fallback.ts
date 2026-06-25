import type { ExtractionResult, Menu } from "../types/contracts.js";

/** Rule-based extraction when the LLM is unavailable or returns invalid JSON. */
export function runFallbackExtraction(menu: Menu, transcript: string): ExtractionResult {
  const lower = transcript.toLowerCase();
  const email = transcript.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const firstName =
    transcript.match(/\b(?:hi|hey|thanks)\s+([A-Z][a-z]+)/)?.[1] ??
    transcript.match(/\b(?!Matt\b)([A-Z][a-z]+):/)?.[1] ??
    null;
  const clientName = email ? nameFromEmail(email) : firstName;

  const lineItems: ExtractionResult["line_items"] = menu.menu.map((item) => ({
    id: item.id,
    label: item.label,
    selected: false,
    price: item.default_price,
    quantity: 1,
    price_source: "default" as const,
    source_quote: "",
  }));

  const byId = new Map(lineItems.map((item) => [item.id, item]));

  const select = (
    id: string,
    quote: string,
    patch: Partial<(typeof lineItems)[number]> = {},
  ) => {
    const item = byId.get(id);
    if (!item) return;
    Object.assign(item, { selected: true, source_quote: quote }, patch);
  };

  const reject = (id: string, quote: string) => {
    const item = byId.get(id);
    if (!item) return;
    item.selected = false;
    item.source_quote = quote;
  };

  if (/\b(elopement package|just the elopement|want the elopement)\b/i.test(transcript)) {
    select("elopement", findSentence(transcript, /elopement/i));
    reject("wedding_base", "");
  } else if (/\b(full wedding package|wedding package|base wedding package)\b/i.test(transcript)) {
    select("wedding_base", findSentence(transcript, /wedding package|base wedding/i));
  }

  if (/\b(no engagement|without engagement|don't want.*engagement)\b/i.test(transcript)) {
    reject("engagement", findSentence(transcript, /engagement/i));
  } else if (/\b(engagement session|engagement photos)\b/i.test(transcript)) {
    if (/\b(maybe|thinking|check|leave it|not sure)\b/i.test(findSentence(transcript, /engagement/i))) {
      reject("engagement", findSentence(transcript, /engagement/i));
    } else {
      select("engagement", findSentence(transcript, /engagement/i));
    }
  }

  if (/\b(no second shooter|don't want.*second shooter|pull that back)\b/i.test(transcript)) {
    reject("second_shooter", findSentence(transcript, /second shooter|pull that back/i));
  } else if (/\b(second shooter)\b/i.test(transcript)) {
    if (/\b(maybe|thinking|check|not sure|get back)\b/i.test(findSentence(transcript, /second shooter/i))) {
      reject("second_shooter", findSentence(transcript, /second shooter/i));
    } else {
      select("second_shooter", findSentence(transcript, /second shooter/i));
    }
  }

  const hours = parseHourQuantity(lower);
  if (hours > 0 && /\b(extra hours?|hours?)\b/i.test(transcript)) {
    select("extra_hour", findSentence(transcript, /extra hours?|hours/i), { quantity: hours });
  }

  if (/\b(waive.*travel|no travel charge)\b/i.test(transcript)) {
    select("travel", findSentence(transcript, /waive|travel charge/i), {
      price: 0,
      price_source: "quoted",
    });
  } else if (/\b(no travel|local|in the city)\b/i.test(transcript)) {
    reject("travel", findSentence(transcript, /travel|local|city/i));
  } else if (/\b(add the travel|travel fee|standard two hundred)\b/i.test(transcript)) {
    select("travel", findSentence(transcript, /travel/i));
  }

  const tbdItems = [];
  if (/\bdrone\b/i.test(transcript)) {
    tbdItems.push({
      label: "Drone coverage",
      note: "Off-menu item. Confirm price before sending.",
      source_quote: findSentence(transcript, /drone/i),
    });
  }
  if (/\balbum\b/i.test(transcript)) {
    tbdItems.push({
      label: "Printed photo album",
      note: "Off-menu item. Confirm size, page count, and price.",
      source_quote: findSentence(transcript, /album/i),
    });
  }

  const selectedLabels = lineItems
    .filter((item) => item.selected)
    .map((item) => item.label.toLowerCase());

  return {
    client: { name: clientName, email },
    line_items: lineItems,
    tbd_items: tbdItems,
    deposit_paid: parseDeposit(lower),
    summary:
      selectedLabels.length > 0
        ? `Selected: ${selectedLabels.join(", ")}.`
        : "No canonical services clearly selected.",
  };
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0];
  const parts = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  return parts.length > 0 ? parts.join(" ") : null;
}

function findSentence(transcript: string, pattern: RegExp) {
  return (
    transcript
      .split(/\n|(?<=[.!?])\s+/)
      .map((part) => part.replace(/^[^:]+:\s*/, "").trim())
      .find((part) => pattern.test(part)) ?? ""
  );
}

function parseHourQuantity(lower: string) {
  if (/\bthree extra hours?\b/.test(lower)) return 3;
  if (/\btwo extra hours?\b/.test(lower)) return 2;
  if (/\bone extra hours?\b/.test(lower)) return 1;
  const match = lower.match(/\b(\d+)\s+extra hours?\b/);
  return match ? Number(match[1]) : 0;
}

function parseDeposit(lower: string) {
  const match = lower.match(/\$?(\d[\d,]*)\s+deposit/);
  return match ? Number(match[1].replaceAll(",", "")) : null;
}
