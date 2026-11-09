/**
 * ShadowExamples
 *
 * Visual shadow showcase for the "Kertas Hangat & Tanah Liat" design system.
 * Displays all 3 shadow tokens (card, float, modal) with preview cards,
 * token names, CSS values, elevation descriptions, usage context, and a
 * side-by-side comparison row. Includes a skeleton shimmer demo.
 *
 * Shadows use a warm brown base — rgba(43,33,28,...) — not cold gray.
 * This keeps elevation feeling grounded and consistent with the paper texture.
 *
 * @example
 * ```tsx
 * import ShadowExamples from '@/components/ui/ShadowExamples'
 *
 * export default function StyleGuidePage() {
 *   return <ShadowExamples />
 * }
 * ```
 */

import React from "react";

interface ShadowToken {
  token: string;
  cssVar: string;
  /** Abbreviated CSS value for display */
  cssValueAbbr: string;
  /** Full CSS value */
  cssValue: string;
  elevation: string;
  elevationLabel: "Resting" | "Floating" | "Overlay";
  usageContext: string;
}

const SHADOW_TOKENS: ShadowToken[] = [
  {
    token: "shadow-card",
    cssVar: "--shadow-card",
    cssValueAbbr: "0 2px 8px -1px rgba(43,33,28,.06), …",
    cssValue:
      "0 2px 8px -1px rgba(43,33,28,.06), 0 1px 3px rgba(43,33,28,.04)",
    elevation: "Resting — minimal lift for cards on paper",
    elevationLabel: "Resting",
    usageContext:
      "Content cards, story cards, list items sitting on the paper background",
  },
  {
    token: "shadow-float",
    cssVar: "--shadow-float",
    cssValueAbbr: "0 8px 24px -4px rgba(43,33,28,.12), …",
    cssValue:
      "0 8px 24px -4px rgba(43,33,28,.12), 0 2px 6px -1px rgba(43,33,28,.06)",
    elevation: "Elevated — clearly lifted above the surface",
    elevationLabel: "Floating",
    usageContext:
      "Dropdowns, date pickers, floating action buttons, sticky headers",
  },
  {
    token: "shadow-modal",
    cssVar: "--shadow-modal",
    cssValueAbbr: "0 24px 48px -12px rgba(43,33,28,.22), …",
    cssValue:
      "0 24px 48px -12px rgba(43,33,28,.22), 0 4px 12px rgba(43,33,28,.08)",
    elevation: "Overlay — highest elevation, above all content",
    elevationLabel: "Overlay",
    usageContext: "Modals, dialogs, bottom sheets, confirmation panels",
  },
];

interface ShadowCardProps {
  shadow: ShadowToken;
}

function ShadowCard({ shadow }: ShadowCardProps) {
  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-2xl border border-[var(--color-line)]"
      style={{
        backgroundColor: "var(--color-surface)",
        boxShadow: `var(${shadow.cssVar})`,
      }}
    >
      {/* Token name */}
      <div className="flex items-center gap-2">
        <code
          className="text-sm font-semibold px-2 py-1 rounded-lg"
          style={{
            backgroundColor: "var(--color-sunken)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          {`var(--${shadow.token})`}
        </code>
      </div>

      {/* CSS value abbreviated */}
      <p
        className="text-xs leading-snug break-all"
        style={{ color: "var(--color-ink-soft)", fontFamily: "monospace" }}
      >
        {shadow.cssValueAbbr}
      </p>

      {/* Elevation label */}
      <p
        className="text-sm font-semibold leading-snug"
        style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
      >
        {shadow.elevation}
      </p>

      {/* Divider */}
      <div
        className="h-px w-full"
        style={{ backgroundColor: "var(--color-line)" }}
        aria-hidden="true"
      />

      {/* Usage context */}
      <div className="flex flex-col gap-1">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-ink-soft)", letterSpacing: "0.07em" }}
        >
          Digunakan untuk
        </span>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          {shadow.usageContext}
        </p>
      </div>
    </div>
  );
}

/** Three cards side by side with increasing elevation */
function ComparisonRow() {
  return (
    <section className="flex flex-col gap-5">
      <h2
        className="text-base font-semibold uppercase tracking-widest"
        style={{
          color: "var(--color-ink-soft)",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
        }}
      >
        Elevation Comparison
      </h2>

      <div className="flex flex-wrap gap-8 items-end">
        {SHADOW_TOKENS.map((shadow) => (
          <div key={shadow.token} className="flex flex-col items-center gap-3">
            <div
              className="rounded-2xl border border-[var(--color-line)]"
              style={{
                width: "120px",
                height: "80px",
                backgroundColor: "var(--color-surface)",
                boxShadow: `var(${shadow.cssVar})`,
              }}
              aria-label={`${shadow.elevationLabel} elevation preview`}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
            >
              {shadow.elevationLabel}
            </span>
            <code
              className="text-[0.688rem]"
              style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
            >
              {`--${shadow.token}`}
            </code>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Skeleton shimmer demo */
function SkeletonDemo() {
  return (
    <section className="flex flex-col gap-5">
      <h2
        className="text-base font-semibold uppercase tracking-widest"
        style={{
          color: "var(--color-ink-soft)",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
        }}
      >
        Skeleton Shimmer
      </h2>

      <p
        className="text-sm leading-relaxed max-w-prose"
        style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
      >
        Gunakan kelas{" "}
        <code
          className="text-sm px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-sunken)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          skeleton
        </code>{" "}
        pada elemen placeholder. Shimmer menggunakan{" "}
        <code
          className="text-sm px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-sunken)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          --color-sunken
        </code>{" "}
        dan{" "}
        <code
          className="text-sm px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-sunken)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          --color-line
        </code>{" "}
        agar tetap di atas paper texture.
      </p>

      {/* Skeleton card */}
      <div
        className="flex flex-col gap-3 p-6 rounded-2xl border border-[var(--color-line)]"
        style={{
          backgroundColor: "var(--color-surface)",
          boxShadow: "var(--shadow-card)",
          maxWidth: "320px",
        }}
        aria-label="Skeleton loading placeholder"
        aria-busy="true"
      >
        {/* Title bar */}
        <div
          className="skeleton h-4 rounded-lg"
          style={{ width: "60%" }}
          aria-hidden="true"
        />
        {/* Body bars */}
        <div
          className="skeleton h-3 rounded-lg"
          style={{ width: "100%" }}
          aria-hidden="true"
        />
        <div
          className="skeleton h-3 rounded-lg"
          style={{ width: "80%" }}
          aria-hidden="true"
        />
        <div
          className="skeleton h-3 rounded-lg"
          style={{ width: "90%" }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

/** Note about warm brown shadow base */
function WarmBaseNote() {
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-xl border border-[var(--color-line)]"
      style={{ backgroundColor: "var(--color-sunken)", maxWidth: "560px" }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
      >
        Warm Brown Base — bukan abu-abu dingin
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
      >
        Ketiga shadow menggunakan{" "}
        <code
          className="text-xs px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-line)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          rgba(43, 33, 28, ...)
        </code>{" "}
        sebagai warna dasar — yaitu{" "}
        <code
          className="text-xs px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-line)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          --color-ink
        </code>{" "}
        dengan opacity. Ini memastikan bayangan tetap terasa hangat dan
        konsisten dengan paper texture, bukan terlihat seperti bayangan layar
        komputer.
      </p>
    </div>
  );
}

/** Note about paper texture */
function PaperTextureNote() {
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-xl border border-[var(--color-line)]"
      style={{ backgroundColor: "var(--color-sunken)", maxWidth: "560px" }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
      >
        Paper Texture Background
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
      >
        Latar halaman menggunakan{" "}
        <code
          className="text-xs px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-line)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          --color-paper (#FBF6EE)
        </code>{" "}
        dengan subtle paper texture dari{" "}
        <code
          className="text-xs px-1 py-0.5 rounded"
          style={{
            backgroundColor: "var(--color-line)",
            color: "var(--color-clay)",
            fontFamily: "monospace",
          }}
        >
          globals.css
        </code>
        . Shadow terlihat paling natural di atas latar paper — hindari
        menaruh kartu berlapis di atas background gelap.
      </p>
    </div>
  );
}

export default function ShadowExamples() {
  return (
    <div
      className="min-h-screen p-8 md:p-12"
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
          Shadows & Elevation
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          Tiga level elevasi untuk sistem desain Kertas Hangat & Tanah Liat.
          Gunakan via{" "}
          <code
            className="text-sm px-1 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-sunken)",
              color: "var(--color-clay)",
              fontFamily: "monospace",
            }}
          >
            style=&#123;&#123; boxShadow: &apos;var(--shadow-card)&apos; &#125;&#125;
          </code>
          .
        </p>
      </header>

      {/* Notes row */}
      <div className="flex flex-wrap gap-4 mb-12">
        <WarmBaseNote />
        <PaperTextureNote />
      </div>

      {/* Shadow token cards */}
      <section className="mb-14">
        <h2
          className="text-base font-semibold uppercase tracking-widest mb-5"
          style={{
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
          }}
        >
          Shadow Tokens
        </h2>

        <div className="flex flex-wrap gap-6">
          {SHADOW_TOKENS.map((shadow) => (
            <div key={shadow.token} style={{ width: "280px", flexShrink: 0 }}>
              <ShadowCard shadow={shadow} />
            </div>
          ))}
        </div>
      </section>

      {/* Comparison row */}
      <div className="mb-14">
        <ComparisonRow />
      </div>

      {/* Skeleton demo */}
      <div className="mb-14">
        <SkeletonDemo />
      </div>

      {/* Footer note */}
      <footer className="mt-4 pt-6 border-t border-[var(--color-line)]">
        <p
          className="text-xs"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          Shadow tokens didefinisikan di{" "}
          <code style={{ fontFamily: "monospace" }}>app/globals.css</code>.
          Selalu gunakan{" "}
          <code style={{ fontFamily: "monospace" }}>style=&#123;&#123; boxShadow: &apos;var(--shadow-*)&apos; &#125;&#125;</code>{" "}
          — jangan hardcode nilai shadow secara langsung.
        </p>
      </footer>
    </div>
  );
}
