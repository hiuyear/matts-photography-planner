import { Router } from "express";
import type { Menu, Transcript } from "../types/contracts.js";
import { SAMPLE_EXTRACTION } from "../mocks/sample-extraction.js";
import { runFallbackExtraction } from "../services/extraction-fallback.js";
import { hasLlmConfigured, runExtraction } from "../services/extraction.js";

export const extractRouter = Router();

interface ExtractRequest {
  menu: Menu;
  transcript: Transcript | string;
}

/**
 * POST /extract — menu + transcript in, Contract C out.
 * Uses lib/extraction/prompt.md via OpenAI-compatible LLM (Ollama by default).
 * Set EXTRACT_STUB=true for mock output; LLM failures fall back to rule-based extraction.
 */
extractRouter.post("/", async (req, res) => {
  const body = req.body as ExtractRequest;

  if (!body.menu || !Array.isArray(body.menu.menu)) {
    return res.status(400).json({ error: "menu (Contract A) is required" });
  }

  const transcriptText =
    typeof body.transcript === "string" ? body.transcript : body.transcript?.text;

  if (!transcriptText || transcriptText.trim().length === 0) {
    return res.status(400).json({ error: "transcript text is required" });
  }

  const forceStub = process.env.EXTRACT_STUB === "true";
  const useLlm = !forceStub && hasLlmConfigured();

  if (!useLlm) {
    return res.json(SAMPLE_EXTRACTION);
  }

  try {
    const result = await runExtraction(body.menu, transcriptText.trim());
    return res.json(result);
  } catch (err) {
    console.warn("[extract] LLM failed; using rule-based fallback", err);
    return res.json(runFallbackExtraction(body.menu, transcriptText.trim()));
  }
});
