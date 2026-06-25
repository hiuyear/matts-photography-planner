import type { Transcript } from "../types/contracts.js";

const FATHOM_BASE = "https://api.fathom.ai/external/v1";

export interface FathomMeetingSummary {
  recording_id: number;
  title: string;
  created_at: string;
  has_summary: boolean;
}

interface TranscriptItem {
  speaker: { display_name: string };
  text: string;
  timestamp: string;
}

interface FathomMeeting {
  recording_id: number;
  title: string;
  created_at: string;
  default_summary?: { markdown_formatted?: string | null } | null;
  transcript?: TranscriptItem[] | null;
}

interface FathomMeetingsResponse {
  items: FathomMeeting[];
  next_cursor?: string | null;
}

interface FathomTranscriptResponse {
  transcript: TranscriptItem[];
}

function getApiKey(): string {
  const key = process.env.FATHOM_API_KEY;
  if (!key) {
    throw new Error("FATHOM_API_KEY is not set");
  }
  return key;
}

async function fathomFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${FATHOM_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    headers: { "X-Api-Key": getApiKey() },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fathom API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

function flattenTranscript(items: TranscriptItem[]): string {
  return items.map((item) => `${item.speaker.display_name}: ${item.text}`).join("\n");
}

/** List Fathom meetings that have a summary */
export async function listFathomMeetings(): Promise<FathomMeetingSummary[]> {
  const data = await fathomFetch<FathomMeetingsResponse>("/meetings", {
    include_summary: "true",
    limit: "20",
  });

  return (data.items ?? [])
    .filter((m) => m.default_summary?.markdown_formatted?.trim())
    .map((m) => ({
      recording_id: m.recording_id,
      title: m.title,
      created_at: m.created_at,
      has_summary: true,
    }));
}

/** Fetch a meeting transcript as Contract B */
export async function fetchFathomTranscript(recordingId: string): Promise<Transcript> {
  const data = await fathomFetch<FathomTranscriptResponse>(
    `/recordings/${encodeURIComponent(recordingId)}/transcript`
  );

  const items = data.transcript ?? [];
  if (items.length === 0) {
    throw new Error(`Recording ${recordingId} has no transcript`);
  }

  return { source: "fathom", text: flattenTranscript(items) };
}
