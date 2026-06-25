import type { GranolaNoteSummary, Transcript } from "../types/contracts.js";

const GRANOLA_BASE = "https://public-api.granola.ai/v1";

function getApiKey(): string {
  const key = process.env.GRANOLA_API_KEY;
  if (!key) {
    throw new Error("GRANOLA_API_KEY is not set");
  }
  return key;
}

async function granolaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${GRANOLA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Granola API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

interface GranolaNotesResponse {
  notes?: Array<{
    id: string;
    title?: string;
    created_at?: string;
    summary?: string | null;
  }>;
}

interface GranolaNoteDetail {
  id: string;
  title?: string;
  transcript?: string;
  summary?: string | null;
}

/** List Granola notes that have a summary (demo requirement) */
export async function listGranolaNotes(): Promise<GranolaNoteSummary[]> {
  const data = await granolaFetch<GranolaNotesResponse>("/notes");
  const notes = data.notes ?? [];

  return notes
    .filter((n) => n.summary && n.summary.trim().length > 0)
    .map((n) => ({
      id: n.id,
      title: n.title ?? "Untitled note",
      created_at: n.created_at ?? "",
      has_summary: true,
    }));
}

/** Fetch a single note's transcript as Contract B */
export async function fetchGranolaTranscript(noteId: string): Promise<Transcript> {
  const note = await granolaFetch<GranolaNoteDetail>(
    `/notes/${encodeURIComponent(noteId)}?include=transcript`
  );

  if (!note.summary || note.summary.trim().length === 0) {
    throw new Error(`Note ${noteId} has no summary — skipping per demo rules`);
  }

  const text = note.transcript?.trim();
  if (!text) {
    throw new Error(`Note ${noteId} has no transcript`);
  }

  return { source: "granola", text };
}
