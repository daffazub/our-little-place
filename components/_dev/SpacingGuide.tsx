/**
 * SpacingGuide
 *
 * Visual spacing scale reference for the "Kertas Hangat & Tanah Liat" design system.
 * Shows each spacing step with a proportional bar, Tailwind token, pixel/rem values,
 * and common use-case notes. Also includes layout spacing conventions for page,
 * card, and stack patterns.
 *
 * @example
 * ```tsx
 * import SpacingGuide from '@/components/ui/SpacingGuide'
 *
 * export default function StyleGuidePage() {
 *   return <SpacingGuide />
 * }
 * ```
 */

interface SpacingStep {
  /** Tailwind numeric scale value */
  step: number;
  /** Pixel value = step * 4 */
  px: number;
  /** Common use-case description */
  usage: string;
}

const SPACING_STEPS: SpacingStep[] = [
  { step: 1, px: 4, usage: "Icon padding, hairline gaps" },
  { step: 2, px: 8, usage: "Tight inner padding (badge, chip)" },
  { step: 3, px: 12, usage: "Small gap between inline elements" },
  { step: 4, px: 16, usage: "Standard card inner padding" },
  { step: 5, px: 20, usage: "Comfortable card padding" },
  { step: 6, px: 24, usage: "Large card / section padding" },
  { step: 8, px: 32, usage: "Page section padding" },
  { step: 10, px: 40, usage: "Generous section vertical rhythm" },
  { step: 12, px: 48, usage: "Section vertical spacing" },
  { step: 16, px: 64, usage: "Hero / page-level vertical spacing" },
];

interface LayoutConventionData {
  label: string;
  description: string;
  steps: { breakpoint: string; token: string }[];
}

const LAYOUT_CONVENTIONS: LayoutConventionData[] = [
  {
    label: "Page Horizontal",
    description: "Horizontal page padding — expands at each breakpoint",
    steps: [
      { breakpoint: "Mobile", token: "px-4 (16px)" },
      { breakpoint: "Tablet", token: "px-6 (24px)" },
      { breakpoint: "Desktop", token: "px-8 (32px)" },
    ],
  },
  {
    label: "Card Inner",
    description: "Padding inside a card — scales with card size",
    steps: [
      { breakpoint: "Compact", token: "p-4 (16px)" },
      { breakpoint: "Default", token: "p-5 (20px)" },
      { breakpoint: "Spacious", token: "p-6 (24px)" },
    ],
  },
  {
    label: "Stack Gap",
    description: "Vertical gap between stacked items in a list or feed",
    steps: [
      { breakpoint: "Tight", token: "gap-3 (12px)" },
      { breakpoint: "Default", token: "gap-4 (16px)" },
      { breakpoint: "Loose", token: "gap-6 (24px)" },
    ],
  },
];

interface SpacingRowProps {
  step: SpacingStep;
}

function SpacingRow({ step }: SpacingRowProps) {
  const rem = (step.px / 16).toFixed(step.px % 16 === 0 ? 0 : 4).replace(/\.?0+$/, "");

  return (
    <div
      className="flex items-center gap-5 py-3 border-b border-[var(--color-line)]"
      style={{ borderColor: "var(--color-line)" }}
    >
      {/* Bar */}
      <div
        className="flex-shrink-0 h-5 rounded-sm"
        style={{
          width: `${step.px}px`,
          backgroundColor: "var(--color-clay)",
          minWidth: "4px",
        }}
        aria-hidden="true"
      />

      {/* Token + values */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 flex-1 min-w-0">
        <code
          className="text-sm font-semibold"
          style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
        >
          {`*-${step.step}`}
        </code>
        <span
          className="text-[0.75rem] font-mono"
          style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
        >
          {step.px}px
        </span>
        <span
          className="text-[0.75rem] font-mono"
          style={{ color: "var(--color-ink-soft)", fontFamily: "monospace" }}
        >
          {rem}rem
        </span>
        <span
          className="text-[0.75rem] leading-snug"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          {step.usage}
        </span>
      </div>
    </div>
  );
}

interface LayoutConventionCardProps {
  data: LayoutConventionData;
}

function LayoutConventionCard({ data }: LayoutConventionCardProps) {
  return (
    <div
      className="rounded-xl border border-[var(--color-line)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Card header */}
      <div
        className="px-5 py-4 border-b border-[var(--color-line)]"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
        >
          {data.label}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          {data.description}
        </p>
      </div>

      {/* Breakpoint steps */}
      <div
        className="flex divide-x divide-[var(--color-line)]"
        style={{ backgroundColor: "var(--color-sunken)" }}
      >
        {data.steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 px-3 py-4">
            <span
              className="text-[0.688rem] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
            >
              {s.breakpoint}
            </span>
            <code
              className="text-sm font-semibold"
              style={{ color: "var(--color-clay)", fontFamily: "monospace" }}
            >
              {s.token}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpacingGuide() {
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
          Spacing Scale
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          Skala jarak berbasis grid 4px dari Tailwind. Setiap step nilainya{" "}
          <code
            className="text-sm px-1 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-sunken)",
              color: "var(--color-clay)",
              fontFamily: "monospace",
            }}
          >
            step × 4px
          </code>
          . Bar lebar proporsional, dirender dengan warna clay.
        </p>
      </header>

      {/* Spacing scale */}
      <section className="mb-14 max-w-3xl">
        <h2
          className="text-base font-semibold uppercase tracking-widest mb-1"
          style={{
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
          }}
        >
          Base Scale
        </h2>

        {/* Column labels */}
        <div
          className="flex items-center gap-5 py-2 mb-1"
          style={{ borderBottom: "2px solid var(--color-line)" }}
        >
          <div className="flex-shrink-0" style={{ width: "64px" }} aria-hidden="true" />
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0 flex-1 min-w-0">
            <span
              className="text-[0.688rem] font-semibold uppercase tracking-widest w-[3.5rem]"
              style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
            >
              Token
            </span>
            <span
              className="text-[0.688rem] font-semibold uppercase tracking-widest w-[3rem]"
              style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
            >
              px
            </span>
            <span
              className="text-[0.688rem] font-semibold uppercase tracking-widest w-[3.5rem]"
              style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
            >
              rem
            </span>
            <span
              className="text-[0.688rem] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
            >
              Use case
            </span>
          </div>
        </div>

        {SPACING_STEPS.map((step) => (
          <SpacingRow key={step.step} step={step} />
        ))}
      </section>

      {/* Layout conventions */}
      <section className="max-w-4xl">
        <h2
          className="text-base font-semibold uppercase tracking-widest mb-5"
          style={{
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
          }}
        >
          Layout Conventions
        </h2>
        <div className="flex flex-col gap-4">
          {LAYOUT_CONVENTIONS.map((conv) => (
            <LayoutConventionCard key={conv.label} data={conv} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="mt-14 pt-6 border-t border-[var(--color-line)]">
        <p
          className="text-xs"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          Base unit: 4px. Token{" "}
          <code style={{ fontFamily: "monospace" }}>*-N</code> setara dengan{" "}
          <code style={{ fontFamily: "monospace" }}>N × 4px</code>. Gunakan
          token spacing yang tersedia — hindari nilai arbitrari kecuali ada
          kebutuhan eksplisit.
        </p>
      </footer>
    </div>
  );
}
