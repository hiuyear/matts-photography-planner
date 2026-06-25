# Wedding photo sample mockups

Placeholder SVGs for UI development. Replace with real photography when you have licensed or team-owned assets.

## Filenames

Keep these names so `web/src/lib/sample-photos.ts` keeps working:

| File | Scene | Suggested real photo |
|------|-------|----------------------|
| `ceremony.svg` → `ceremony.webp` | Outdoor ceremony wide shot | Aisle, arch, or vows moment |
| `couple-portrait.svg` → `couple-portrait.webp` | Couple portrait | Golden-hour couple, shoulders up |
| `reception.svg` → `reception.webp` | Reception / party | First dance or tablescape |
| `detail.svg` → `detail.webp` | Detail / rings | Rings, florals, or invitation flat lay |

## Adding real images

1. Export at ~1200px wide, `.webp` or `.jpg`, under 200KB each.
2. Drop files in this folder using the names above (drop the `.svg` once replaced).
3. Update `src` paths in `web/src/lib/sample-photos.ts` if you change extensions.
4. Write descriptive `alt` text for accessibility.

Files here are served at `/samples/<filename>` by Vite.
