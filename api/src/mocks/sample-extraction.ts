import type { ExtractionResult } from "../types/contracts.js";

/** Hardcoded Contract C for frontend dev before LLM is ready */
export const SAMPLE_EXTRACTION: ExtractionResult = {
  client: { name: "Sarah & James", email: "sarah.james@example.com" },
  line_items: [
    {
      id: "wedding_base",
      label: "Wedding package (base)",
      selected: true,
      price: 4599,
      quantity: 1,
      price_source: "default",
      source_quote: "So the base wedding package is forty-five ninety-nine.",
    },
    {
      id: "second_shooter",
      label: "Second shooter",
      selected: true,
      price: 600,
      quantity: 1,
      price_source: "default",
      source_quote: "Yeah, let's add the second shooter.",
    },
    {
      id: "extra_hour",
      label: "Extra coverage hour",
      selected: true,
      price: 350,
      quantity: 2,
      price_source: "default",
      source_quote: "We'll need two extra hours for the reception.",
    },
    {
      id: "engagement",
      label: "Engagement session",
      selected: false,
      price: 750,
      quantity: 1,
      price_source: "default",
      source_quote: "We might do engagement photos, still thinking about it.",
    },
    {
      id: "elopement",
      label: "Elopement package",
      selected: false,
      price: 1800,
      quantity: 1,
      price_source: "default",
      source_quote: "",
    },
    {
      id: "travel",
      label: "Travel fee",
      selected: false,
      price: 200,
      quantity: 1,
      price_source: "default",
      source_quote: "",
    },
  ],
  tbd_items: [
    {
      label: "Drone coverage",
      note: "Discussed but no price quoted — Matt said he'd follow up",
      source_quote: "Can you do drone shots? Yeah I can, let me get you a number on that.",
    },
  ],
  deposit_paid: 500,
  summary: "Wedding package with second shooter and 2 extra hours. Drone coverage TBD.",
};
