import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function PageShell({
  children,
  step,
  totalSteps,
}: {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SparkleField />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-6">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground">
            <span className="font-display text-xl tracking-tight">
              Field<span className="text-gold-gradient">Invoice</span>
            </span>
            <span className="sparkle text-base">🥂</span>
          </Link>
          {step && totalSteps ? (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    i < step ? "bg-[var(--gold)]" : "bg-[var(--silver)]"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <span className="sparkle inline-block">✨</span> crafted for matt
        </footer>
      </div>
    </div>
  );
}

function SparkleField() {
  const sparkles = [
    { top: "8%", left: "6%", size: "text-xl", delay: "0s" },
    { top: "18%", right: "10%", size: "text-2xl", delay: "0.6s" },
    { top: "42%", left: "4%", size: "text-lg", delay: "1.2s" },
    { top: "62%", right: "6%", size: "text-xl", delay: "0.3s" },
    { top: "80%", left: "8%", size: "text-base", delay: "1.5s" },
    { top: "32%", right: "20%", size: "text-sm", delay: "0.9s" },
    { top: "72%", left: "30%", size: "text-lg", delay: "2s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparkles.map((s, i) => (
        <span
          key={i}
          className={`sparkle absolute ${s.size} opacity-50`}
          style={{ top: s.top, left: s.left, right: s.right, animationDelay: s.delay }}
        >
          ✨
        </span>
      ))}
    </div>
  );
}
