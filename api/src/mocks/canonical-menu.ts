import type { Menu } from "../types/contracts.js";

/** Hardcoded demo menu from PRD — Contract A */
export const CANONICAL_MENU: Menu = {
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
