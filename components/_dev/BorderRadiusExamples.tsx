/**
 * BorderRadiusExamples
 *
 * Visual border-radius showcase for the "Kertas Hangat & Tanah Liat" design system.
 * Displays all 7 radius tokens with preview boxes, token names, pixel values,
 * and real-world usage examples (photo card, story card, modal).
 *
 * @example
 * ```tsx
 * import BorderRadiusExamples from '@/components/ui/BorderRadiusExamples'
 *
 * export default function StyleGuidePage() {
 *   return <BorderRadiusExamples />
 * }
 * ```
 */

import React from "react";

interface RadiusToken {
  token: string;
  /** CSS variable name, e.g. "--radius-lg" */
  cssVar: string;
  px: number;
  usage: string;
  /** If true, render an elongated pill shape instead of a square */
  isPill?: boolean;
}

const RADIUS_TOKENS: RadiusToken[] = [
  {
    token: "radius-sm",
    cssVar: "--radius-sm",
    px: 6,
    usage: "Small chips, micro badges",
  },
  {
    token: "radius-md",
    cssVar: "--radius-md",
    px: 8,
    usage: "Inputs, small cards",
  },
  {
    token: "radius-lg",
    cssVar: "--radius-lg",
    px: 12,
    usage: "Photo cards, image thumbnails",
  },
  {
    token: "radius-xl",
    cssVar: "--radius-xl",
    px: 16,
    usage: "Skeleton loaders, standard cards",
  },
  {
    token: "radius-2xl",
    cssVar: "--radius-2xl",
    px: 20,
    usage: "Story cards, plan cards",
  },
  {
    token: "radius-3xl",
    cssVar: "--radius-3xl",
    px: 28,
    usage: "Modals, dialogs, bottom sheets",
  },
  {
    token: "radius-full",
    cssVar: "--radius-full",
    px: 9999,
    usage: "Pill buttons, avatar chips",
    isPill: true,
  },
];

interface RadiusCardProps {
  data: RadiusToken;
}

function RadiusCard({ data }: RadiusCardProps) {
  const displayPx = data.px >= 9999 ? "9999px" : `${data.px}px`;

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--color-line)]"
      style={{ backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Preview shape */}
      {data.isPill ? (
        <div
          style={{
            width: "120px",
            height: "40px",
            borderRadius: `var(${data.cssVar})`,
            backgroundColor: "var(--color-clay-tint)",
            border: "1.5px solid var(--color-line)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      ) : (
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: `var(${data.cssVar})`,
            backgroundColor: "var(--color-clay-tint)",
            border: "1.5px solid var(--color-line)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}

      {/* Token name */}
      <code
        className="text-[0.75rem] font-semibold text-center leading-tight"
        style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
      >
        {`var(--${data.token})`}
      </code>

      {/* Pixel value */}
      <span
        className="text-[0.75rem] font-mono"
        style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
      >
        {displayPx}
      </span>

      {/* Use case */}
      <p
        className="text-[0.75rem] text-center leading-snug"
        style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
      >
        {data.usage}
      </p>
    </div>
  );
}

function CircleExample() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circle with initials */}
      <div
        className="flex items-center justify-center"
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "9999px",
          backgroundColor: "var(--color-clay)",
          color: "var(--color-white)",
          fontFamily: "var(--font-sans)",
          fontSize: "1.125rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
        aria-label="Avatar example: initials DP"
      >
        DP
      </div>
      <code
        className="text-[0.75rem] font-semibold text-center"
        style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
      >
        rounded-full
      </code>
      <span
        className="text-[0.75rem] font-mono"
        style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
      >
        w-16 h-16
      </span>
      <p
        className="text-[0.75rem] text-center leading-snug"
        style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
      >
        Avatar / profile circle
      </p>
    </div>
  );
}

function RealWorldUsage() {
  return (
    <section className="max-w-5xl">
      <h2
        className="text-base font-semibold uppercase tracking-widest mb-5"
        style={{
          color: "var(--color-ink-soft)",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
        }}
      >
        Real-World Usage
      </h2>

      <div className="flex flex-wrap gap-6">
        {/* Photo card */}
        <div className="flex flex-col gap-2">
          <div
            style={{
              width: "160px",
              height: "110px",
              borderRadius: "var(--radius-lg)",
              border: "4px solid var(--color-white)",
              boxShadow: "var(--shadow-float)",
              background: "linear-gradient(135deg, var(--color-clay-tint) 0%, var(--color-honey) 100%)",
              flexShrink: 0,
            }}
            aria-label="Photo card placeholder"
            role="img"
          />
          <p
            className="text-[0.75rem] font-semibold"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
          >
            Photo Card
          </p>
          <code
            className="text-[0.688rem]"
            style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
          >
            radius-lg · border-4 · shadow-float
          </code>
        </div>

        {/* Story card */}
        <div className="flex flex-col gap-2">
          <div
            className="flex flex-col gap-2 p-4"
            style={{
              width: "160px",
              minHeight: "110px",
              borderRadius: "var(--radius-2xl)",
              backgroundColor: "var(--color-surface)",
              border: "1.5px solid var(--color-line)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="rounded"
              style={{
                width: "32px",
                height: "4px",
                backgroundColor: "var(--color-clay-tint)",
              }}
              aria-hidden="true"
            />
            <div
              className="rounded"
              style={{
                width: "80px",
                height: "4px",
                backgroundColor: "var(--color-line)",
              }}
              aria-hidden="true"
            />
            <div
              className="rounded"
              style={{
                width: "60px",
                height: "4px",
                backgroundColor: "var(--color-line)",
              }}
              aria-hidden="true"
            />
          </div>
          <p
            className="text-[0.75rem] font-semibold"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
          >
            Story Card
          </p>
          <code
            className="text-[0.688rem]"
            style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
          >
            radius-2xl · shadow-card
          </code>
        </div>

        {/* Modal */}
        <div className="flex flex-col gap-2">
          <div
            className="flex flex-col gap-3 p-5"
            style={{
              width: "200px",
              minHeight: "120px",
              borderRadius: "var(--radius-3xl)",
              backgroundColor: "var(--color-surface)",
              border: "1.5px solid var(--color-line)",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div
              className="rounded"
              style={{
                width: "80px",
                height: "5px",
                backgroundColor: "var(--color-clay-tint)",
              }}
              aria-hidden="true"
            />
            <div
              className="rounded"
              style={{
                width: "120px",
                height: "4px",
                backgroundColor: "var(--color-line)",
              }}
              aria-hidden="true"
            />
            <div
              className="rounded"
              style={{
                width: "100px",
                height: "4px",
                backgroundColor: "var(--color-line)",
              }}
              aria-hidden="true"
            />
            <div
              className="rounded-full self-start mt-2"
              style={{
                width: "72px",
                height: "28px",
                backgroundColor: "var(--color-clay)",
              }}
              aria-hidden="true"
            />
          </div>
          <p
            className="text-[0.75rem] font-semibold"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
          >
            Modal / Dialog
          </p>
          <code
            className="text-[0.688rem]"
            style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
          >
            radius-3xl · shadow-modal
          </code>
        </div>
      </div>
    </section>
  );
}

export default function BorderRadiusExamples() {
  return (
    <div
      className="min-h-screen px-6 py-12 md:px-12"
      style={{ backgroundColor: "var(--color-paper)" }}
    >
      {/* Page header */}
      <header className="mb-10 max-w-2xl">
        <h1
          className="text-3xl font-bold mb-3 leading-tight"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-ink)",
          }}
        >
          Border Radius
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          Tujuh token radius untuk sistem desain Kertas Hangat & Tanah Liat.
          Gunakan via CSS variable{" "}
          <code
            className="text-sm px-1 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-sunken)",
              color: "var(--color-clay)",
              fontFamily: "monospace",
            }}
          >
            borderRadius: &#39;var(--radius-*)&#39;
          </code>{" "}
          pada inline style atau{" "}
          <code
            className="text-sm px-1 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-sunken)",
              color: "var(--color-clay)",
              fontFamily: "monospace",
            }}
          >
            rounded-[...]
          </code>{" "}
          dengan Tailwind arbitrary value.
        </p>
      </header>

      {/* Token grid */}
      <section className="mb-14">
        <h2
          className="text-base font-semibold uppercase tracking-widest mb-5"
          style={{
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
          }}
        >
          Radius Tokens
        </h2>

        <div className="flex flex-wrap gap-4">
          {RADIUS_TOKENS.map((r) => (
            <RadiusCard key={r.token} data={r} />
          ))}

          {/* Circle example in-grid */}
          <div
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--color-line)]"
            style={{
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <CircleExample />
          </div>
        </div>
      </section>

      {/* Real-world usage */}
      <RealWorldUsage />

      {/* Footer note */}
      <footer className="mt-14 pt-6 border-t border-[var(--color-line)]">
        <p
          className="text-xs"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          Gunakan CSS variable secara langsung:{" "}
          <code style={{ fontFamily: "monospace" }}>
            style=&#123;&#123; borderRadius: &#39;var(--radius-xl)&#39; &#125;&#125;
          </code>
          . Token radius didefinisikan di{" "}
          <code style={{ fontFamily: "monospace" }}>app/globals.css</code>.
        </p>
      </footer>
    </div>
  );
}
