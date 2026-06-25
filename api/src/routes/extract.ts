import { Router } from "express";
import type { ExtractionResult, Menu, Transcript } from "../types/contracts.js";
import { SAMPLE_EXTRACTION } from "../mocks/sample-extraction.js";

export const extractRouter = Router();

interface ExtractRequest {
  menu: Menu;
  transcript: Transcript | string;
}

/**
 * POST /extract — LLM extraction (Contract C)
 *
 * Person 3 owns the real LLM logic. This endpoint validates input and
 * returns SAMPLE_EXTRACTION when EXTRACT_STUB=true (default until LLM is wired).
 * Set EXTRACT_STUB=false and implement runExtraction() to go live.
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

  const useStub = process.env.EXTRACT_STUB !== "false";

  if (useStub) {
    return res.json(SAMPLE_EXTRACTION);
  }

  // Person 3: replace this with real LLM call
  try {
    const result = await runExtraction(body.menu, transcriptText);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return res.status(500).json({ error: message });
  }
});

/** Placeholder for Person 3's LLM implementation */
async function runExtraction(_menu: Menu, _transcript: string): Promise<ExtractionResult> {
  throw new Error("LLM extraction not implemented — set EXTRACT_STUB=true or wire Person 3's code");
}
