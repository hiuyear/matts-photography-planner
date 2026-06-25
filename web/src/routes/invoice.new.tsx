import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadMenu } from "@/lib/menu-store";
import { DEMO_TRANSCRIPT } from "@/lib/demo-transcript";
import { api, type FathomMeeting } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/invoice/new")({
  component: NewInvoice,
});

type SourceTab = "fathom" | "paste";

function NewInvoice() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SourceTab>("paste");
  const [transcript, setTranscript] = useState("");
  const [meetings, setMeetings] = useState<FathomMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [pullingId, setPullingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loadMenu()) navigate({ to: "/onboarding/welcome", replace: true });
  }, [navigate]);

  useEffect(() => {
    if (tab !== "fathom") return;

    setLoadingMeetings(true);
    api
      .listFathomMeetings()
      .then((data) => setMeetings(data.meetings ?? []))
      .catch((e) => {
        toast.error("Could not load Fathom meetings", { description: (e as Error).message });
        setMeetings([]);
      })
      .finally(() => setLoadingMeetings(false));
  }, [tab]);

  function startProcessing(text: string) {
    sessionStorage.setItem("fieldinvoice.transcript", text);
    sessionStorage.setItem("fieldinvoice.transcriptSource", tab);
    navigate({ to: "/invoice/processing" });
  }

  async function pullMeeting(recordingId: number) {
    setPullingId(recordingId);
    try {
      const result = await api.fetchFathomTranscript(recordingId);
      startProcessing(result.text);
    } catch (e) {
      toast.error("Could not pull transcript", { description: (e as Error).message });
    } finally {
      setPullingId(null);
    }
  }

  async function processPaste() {
    if (!transcript.trim()) return;
    try {
      const result = await api.pasteTranscript(transcript.trim());
      startProcessing(result.text);
    } catch (e) {
      toast.error("Could not process transcript", { description: (e as Error).message });
    }
  }

  return (
    <PageShell>
      <div className="glass-card rounded-2xl p-7">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[color:var(--gold)]">
          New invoice <span className="sparkle">✨</span>
        </div>
        <h1 className="font-display text-3xl">Drop in your consultation call</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pull from Fathom or paste a transcript. We'll turn it into a draft invoice.
        </p>

        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            variant={tab === "fathom" ? "default" : "outline"}
            className={tab === "fathom" ? "btn-gold h-9" : "h-9"}
            onClick={() => setTab("fathom")}
          >
            Pull from Fathom
          </Button>
          <Button
            type="button"
            variant={tab === "paste" ? "default" : "outline"}
            className={tab === "paste" ? "btn-gold h-9" : "h-9"}
            onClick={() => setTab("paste")}
          >
            Paste transcript
          </Button>
        </div>

        {tab === "fathom" ? (
          <div className="mt-5">
            {loadingMeetings ? (
              <p className="text-sm text-muted-foreground">Loading Fathom meetings…</p>
            ) : meetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-white/50 p-6 text-sm text-muted-foreground">
                No Fathom meetings found. Record a call in Fathom first, or use paste as a fallback.
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--border)] rounded-xl border border-[color:var(--border)] bg-white/70">
                {meetings.map((m) => (
                  <li key={m.recording_id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <div className="text-sm font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : "Recent meeting"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="btn-gold"
                      disabled={pullingId === m.recording_id}
                      onClick={() => pullMeeting(m.recording_id)}
                    >
                      {pullingId === m.recording_id ? "Pulling…" : "Use this call →"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-5">
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the full call transcript here..."
              className="min-h-56 resize-y bg-white/70"
            />
            <button
              onClick={() => setTranscript(DEMO_TRANSCRIPT)}
              className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
            >
              🥂 Load demo transcript (Sarah & David)
            </button>
            <div className="mt-6 flex items-center justify-between gap-3">
              <Link to="/">
                <Button variant="ghost" className="h-11">← Home</Button>
              </Link>
              <Button
                onClick={processPaste}
                disabled={!transcript.trim()}
                className="btn-gold h-11 px-6"
              >
                Process call →
              </Button>
            </div>
          </div>
        )}

        {tab === "fathom" && (
          <div className="mt-6 flex justify-start">
            <Link to="/">
              <Button variant="ghost" className="h-11">← Home</Button>
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}
