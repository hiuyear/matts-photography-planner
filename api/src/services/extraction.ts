import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtractionResult, Menu } from "../types/contracts.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const LINE_ITEM_SKELETON = [
  { id: "wedding_base", label: "Wedding package (base)", selected: false, price: 4599, quantity: 1, price_source: "default" as const, source_quote: "" },
  { id: "elopement", label: "Elopement package", selected: false, price: 1800, quantity: 1, price_source: "default" as const, source_quote: "" },
  { id: "engagement", label: "Engagement session", selected: false, price: 750, quantity: 1, price_source: "default" as const, source_quote: "" },
  { id: "second_shooter", label: "Second shooter", selected: false, price: 600, quantity: 1, price_source: "default" as const, source_quote: "" },
  { id: "extra_hour", label: "Extra coverage hour", selected: false, price: 350, quantity: 1, price_source: "default" as const, source_quote: "" },
  { id: "travel", label: "Travel fee", selected: false, price: 200, quantity: 1, price_source: "default" as const, source_quote: "" },
];

let cachedPrompt: { systemPrompt: string; schema: object } | null = null;

async function loadPromptFiles(): Promise<{ systemPrompt: string; schema: object }> {
  if (cachedPrompt) return cachedPrompt;

  const [systemPrompt, schemaRaw] = await Promise.all([
    readFile(path.join(repoRoot, "lib/extraction/prompt.md"), "utf8"),
    readFile(path.join(repoRoot, "lib/extraction/schema.json"), "utf8"),
  ]);

  cachedPrompt = { systemPrompt, schema: JSON.parse(schemaRaw) as object };
  return cachedPrompt;
}

function getLlmConfig(): { apiKey: string; model: string; apiUrl: string } | null {
  const apiKey = process.env.LLM_API_KEY ?? process.env.LOVABLE_API_KEY;
  const model = process.env.LLM_MODEL ?? (process.env.LOVABLE_API_KEY ? "google/gemini-2.5-flash" : undefined);

  if (!apiKey || !model) return null;

  const apiUrl =
    process.env.LLM_API_URL ??
    (process.env.LOVABLE_API_KEY
      ? "https://ai.gateway.lovable.dev/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions");

  return { apiKey, model, apiUrl };
}

function stripCodeFences(content: string): string {
  return content.replace(/^```json\s*|\s*```$/g, "").trim();
}

async function callLlm(
  systemPrompt: string,
  userContent: string,
  config: { apiKey: string; model: string; apiUrl: string }
): Promise<string> {
  const res = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${body.slice(0, 400)}`);
  }

  const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("LLM response missing JSON content");
  }

  return stripCodeFences(content);
}

function normalizeExtraction(raw: ExtractionResult, menu: Menu): ExtractionResult {
  const byId = new Map(raw.line_items?.map((li) => [li.id, li]) ?? []);

  const line_items = menu.menu.map((m) => {
    const found = byId.get(m.id);
    return (
      found ?? {
        id: m.id,
        label: m.label,
        selected: false,
        price: m.default_price,
        quantity: 1,
        price_source: "default" as const,
        source_quote: "",
      }
    );
  });

  let deposit_paid: number | null = raw.deposit_paid ?? null;
  if (typeof deposit_paid === "boolean") {
    deposit_paid = null;
  }

  return {
    client: raw.client ?? { name: null, email: null },
    line_items,
    tbd_items: raw.tbd_items ?? [],
    deposit_paid,
    summary: raw.summary ?? "",
  };
}

export function hasLlmConfigured(): boolean {
  return getLlmConfig() !== null;
}

export async function runExtraction(menu: Menu, transcript: string): Promise<ExtractionResult> {
  const config = getLlmConfig();
  if (!config) {
    throw new Error("LLM not configured — set LLM_API_KEY + LLM_MODEL (or LOVABLE_API_KEY)");
  }

  const { systemPrompt, schema } = await loadPromptFiles();

  const userContent = [
    "Extract the invoice JSON for this transcript.",
    "",
    "The output must match this JSON Schema:",
    JSON.stringify(schema),
    "",
    "Canonical menu:",
    JSON.stringify(menu),
    "",
    "Required line_items skeleton. Return exactly these six IDs in this order, including unselected items:",
    JSON.stringify(LINE_ITEM_SKELETON),
    "",
    "Transcript:",
    transcript,
  ].join("\n");

  let content = await callLlm(systemPrompt, userContent, config);

  try {
    return normalizeExtraction(JSON.parse(content) as ExtractionResult, menu);
  } catch {
    content = await callLlm(
      "Return ONLY valid JSON matching the prior schema. No prose, no markdown.",
      content,
      config
    );
    return normalizeExtraction(JSON.parse(content) as ExtractionResult, menu);
  }
}
