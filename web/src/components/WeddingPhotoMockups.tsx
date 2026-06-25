import { cn } from "@/lib/utils";
import { getSamplePhotos, type SamplePhoto } from "@/lib/sample-photos";

type Layout = "strip" | "grid" | "polaroid";

export function WeddingPhotoMockups({
  layout = "strip",
  count = 4,
  className,
  photos,
}: {
  layout?: Layout;
  count?: number;
  className?: string;
  photos?: SamplePhoto[];
}) {
  const items = photos ?? getSamplePhotos(count);

  if (layout === "grid") {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {items.map((photo) => (
          <MockupCard key={photo.id} photo={photo} compact />
        ))}
      </div>
    );
  }

  if (layout === "polaroid") {
    return (
      <div className={cn("relative flex justify-center gap-4 py-2", className)}>
        {items.map((photo, i) => (
          <MockupCard
            key={photo.id}
            photo={photo}
            className={cn(
              "w-[42%] max-w-[160px] sm:max-w-[180px]",
              i % 2 === 0 ? "-rotate-2 translate-y-1" : "rotate-2 -translate-y-1",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((photo) => (
        <MockupCard
          key={photo.id}
          photo={photo}
          className="w-36 shrink-0 snap-center sm:w-40"
        />
      ))}
    </div>
  );
}

function MockupCard({
  photo,
  className,
  compact,
}: {
  photo: SamplePhoto;
  className?: string;
  compact?: boolean;
}) {
  const rotation = photo.rotation ?? 0;

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border border-white/80 bg-white/90 shadow-[var(--shadow-soft)]",
        className,
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className={cn("relative overflow-hidden bg-[color:var(--gold-soft)]/20", compact ? "aspect-[4/5]" : "aspect-[4/5]")}>
        <img
          src={photo.src}
          alt={photo.alt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      {!compact && (
        <figcaption className="px-2.5 py-2 text-center font-display text-xs text-muted-foreground">
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}
