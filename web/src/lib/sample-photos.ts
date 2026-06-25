export interface SamplePhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  rotation?: number;
}

/**
 * Wedding photo sample mockups for UI previews.
 * Replace files in public/samples/ — see public/samples/README.md.
 */
export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: "ceremony",
    src: "/samples/ceremony.svg",
    alt: "Outdoor wedding ceremony with floral arch",
    caption: "Sarah & David — ceremony",
    rotation: -2,
  },
  {
    id: "couple-portrait",
    src: "/samples/couple-portrait.svg",
    alt: "Golden-hour couple portrait",
    caption: "Engagement session",
    rotation: 3,
  },
  {
    id: "reception",
    src: "/samples/reception.svg",
    alt: "Evening reception with string lights",
    caption: "Reception",
    rotation: -1.5,
  },
  {
    id: "detail",
    src: "/samples/detail.svg",
    alt: "Wedding rings detail shot",
    caption: "Detail",
    rotation: 2,
  },
];

export function getSamplePhotos(count?: number): SamplePhoto[] {
  if (count == null) return SAMPLE_PHOTOS;
  return SAMPLE_PHOTOS.slice(0, count);
}
