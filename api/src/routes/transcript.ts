import { Router } from "express";
import type { Transcript } from "../types/contracts.js";
import { fetchFathomTranscript, listFathomMeetings } from "../services/fathom.js";
import { fetchGranolaTranscript, listGranolaNotes } from "../services/granola.js";

export const transcriptRouter = Router();

/**
 * GET /transcript?source=fathom                        — list meetings with summaries
 * GET /transcript?source=fathom&recording_id=          — fetch one as Contract B
 * GET /transcript?source=granola                       — list Granola notes (legacy)
 * GET /transcript?source=granola&note_id=              — fetch Granola note as Contract B
 */
transcriptRouter.get("/", async (req, res) => {
  const source = req.query.source as string;

  if (source === "fathom") {
    const recordingId = req.query.recording_id as string | undefined;

    try {
      if (recordingId) {
        const transcript = await fetchFathomTranscript(recordingId);
        return res.json(transcript);
      }

      const meetings = await listFathomMeetings();
      return res.json({ meetings });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fathom fetch failed";
      const status = message.includes("FATHOM_API_KEY") ? 503 : 502;
      return res.status(status).json({ error: message });
    }
  }

  if (source === "granola") {
    const noteId = req.query.note_id as string | undefined;

    try {
      if (noteId) {
        const transcript = await fetchGranolaTranscript(noteId);
        return res.json(transcript);
      }

      const notes = await listGranolaNotes();
      return res.json({ notes });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Granola fetch failed";
      const status = message.includes("GRANOLA_API_KEY") ? 503 : 502;
      return res.status(status).json({ error: message });
    }
  }

  return res.status(400).json({
    error: 'Invalid source. Use source=fathom, source=granola, or POST /transcript with source "paste".',
  });
});

/**
 * POST /transcript — paste fallback, wraps text into Contract B
 * Body: { "text": "full transcript string" }
 */
transcriptRouter.post("/", (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "text is required" });
  }

  const transcript: Transcript = { source: "paste", text: text.trim() };
  return res.json(transcript);
});
