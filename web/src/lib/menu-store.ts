export type Unit = "flat" | "per_hour" | "per_person";

export interface MenuItem {
  id: string;
  label: string;
  default_price: number;
  unit: Unit;
}

export interface Menu {
  business_name: string;
  from_email: string;
  currency: "USD";
  menu: MenuItem[];
}

export const DEFAULT_MENU: Menu = {
  business_name: "Nix Hernandez Photography",
  from_email: "matt@nixhernandez.com",
  currency: "USD",
  menu: [
    { id: "wedding_base", label: "Wedding package (base)", default_price: 4599, unit: "flat" },
    { id: "elopement", label: "Elopement package", default_price: 1800, unit: "flat" },
    { id: "engagement", label: "Engagement session", default_price: 750, unit: "flat" },
    { id: "second_shooter", label: "Second shooter", default_price: 600, unit: "flat" },
    { id: "extra_hour", label: "Extra coverage hour", default_price: 350, unit: "per_hour" },
    { id: "travel", label: "Travel fee", default_price: 200, unit: "flat" },
  ],
};

const KEY = "fieldinvoice.menu";
const DRAFT_KEY = "fieldinvoice.menu.draft";
const EXTRACTION_KEY = "fieldinvoice.extraction";

export function loadMenu(): Menu | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Menu) : null;
  } catch {
    return null;
  }
}

export function saveMenu(m: Menu) {
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function loadDraft(): Menu {
  if (typeof window === "undefined") return DEFAULT_MENU;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Menu) : { ...DEFAULT_MENU };
  } catch {
    return { ...DEFAULT_MENU };
  }
}

export function saveDraft(m: Menu) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(m));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export interface Extraction {
  client: { name: string | null; email: string | null };
  line_items: Array<{
    id: string;
    label: string;
    selected: boolean;
    price: number;
    quantity: number;
    price_source: "default" | "quoted";
    source_quote: string;
  }>;
  tbd_items: Array<{ label: string; note: string; source_quote: string }>;
  deposit_paid: number | null;
  summary: string;
}

export function saveExtraction(e: Extraction) {
  localStorage.setItem(EXTRACTION_KEY, JSON.stringify(e));
}

export function loadExtraction(): Extraction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXTRACTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function formatMoney(cents: number, _currency = "USD") {
  return `$${cents.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
