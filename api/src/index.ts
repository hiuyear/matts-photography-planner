import "dotenv/config";
import cors from "cors";
import express from "express";
import { extractRouter } from "./routes/extract.js";
import { sendInvoiceRouter } from "./routes/send-invoice.js";
import { transcriptRouter } from "./routes/transcript.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fieldinvoice-api" });
});

app.use("/transcript", transcriptRouter);
app.use("/extract", extractRouter);
app.use("/send-invoice", sendInvoiceRouter);

app.listen(PORT, () => {
  console.log(`FieldInvoice API running on http://localhost:${PORT}`);
  console.log(`  GET  /health`);
  console.log(`  GET  /transcript?source=granola`);
  console.log(`  GET  /transcript?source=granola&note_id=<id>`);
  console.log(`  POST /transcript          (paste fallback)`);
  console.log(`  POST /extract             (Contract C)`);
  console.log(`  POST /send-invoice        (Contract D → email)`);
});
