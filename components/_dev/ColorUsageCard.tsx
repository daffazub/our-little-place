/**
 * ColorUsageCard
 *
 * Reusable card that IS the demonstration of proper color usage following the
 * 60/30/10 rule from the "Kertas Hangat & Tanah Liat" design system:
 *   - 60% → bg-surface (paper/surface backgrounds)
 *   - 30% → ink tones (text, borders, dividers)
 *   - 10% → one accent element (clay/sage/honey/error/heart)
 *
 * @example
 * ```tsx
 * import ColorUsageCard, { ColorUsageCardDemo } from '@/components/ui/ColorUsageCard'
 *
 * // Single card
 * <ColorUsageCard
 *   title="Simpan Kenangan"
 *   description="Setiap momen layak diingat."
 *   accentVariant="clay"
 *   showRatioBar
 * />
 *
 * // All variants
 * <ColorUsageCardDemo />
 * ```
 */

import React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AccentVariant = "clay" | "sage" | "honey" | "error" | "heart";

export interface ColorUsageCardProps {
  title: string;
  description?: string;
  accentVariant?: AccentVariant;
  showRatioBar?: boolean;
}

// ---------------------------------------------------------------------------
// Accent config
// ---------------------------------------------------------------------------

interface AccentConfig {
  /** Background CSS variable */
  bg: string;
  /** Text CSS variable */
  text: string;
  /** Human-readable label for the badge */
  label: string;
  /** Semantic role description */
  role: string;
}

const ACCENT_MAP: Record<AccentVariant, AccentConfig> = {
  clay: {
    bg: "var(--color-clay)",
    text: "var(--color-white)",
    label: "Simpan",
    role: "Primary CTA / button",
  },
  sage: {
    bg: "var(--color-sage)",
    text: "var(--color-white)",
    label: "Selesai",
    role: "Success / completed",
  },
  honey: {
    bg: "var(--color-honey)",
    text: "var(--color-ink)",
    label: "Spesial",
    role: "Special marker / highlight",
  },
  error: {
    bg: "var(--color-error)",
    text: "var(--color-white)",
    label: "Hapus",
    role: "Danger / destructive action",
  },
  heart: {
    bg: "var(--color-heart)",
    text: "var(--color-white)",
    label: "Suka",
    role: "Love / favorite action",
  },
};

// ---------------------------------------------------------------------------
// RatioBar
// ---------------------------------------------------------------------------

interface RatioBarProps {
  accent: AccentConfig;
}

function RatioBar({ accent }: RatioBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-ink-soft)", letterSpacing: "0.07em" }}
      >
        60 / 30 / 10 Rule
      </span>
      <div className="flex rounded-lg overflow-hidden h-5" aria-label="60/30/10 color ratio bar">
        {/* 60% — surface */}
        <div
          className="flex items-center justify-center"
          style={{
            flex: "6",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRight: "none",
            borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
          }}
          title="60% — surface background"
        >
          <span
            className="text-[0.625rem] font-semibold"
            style={{ color: "var(--color-ink-soft)" }}
          >
            60%
          </span>
        </div>
        {/* 30% — line/ink tones */}
        <div
          className="flex items-center justify-center"
          style={{
            flex: "3",
            backgroundColor: "var(--color-line)",
            border: "1px solid var(--color-line)",
            borderLeft: "none",
            borderRight: "none",
          }}
          title="30% — ink tones / borders"
        >
          <span
            className="text-[0.625rem] font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            30%
          </span>
        </div>
        {/* 10% — accent */}
        <div
          className="flex items-center justify-center"
          style={{
            flex: "1",
            backgroundColor: accent.bg,
            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
          }}
          title="10% — accent element"
        >
          <span
            className="text-[0.625rem] font-semibold"
            style={{ color: accent.text }}
          >
            10%
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorUsageCard
// ---------------------------------------------------------------------------

/**
 * ColorUsageCard — a card that demonstrates proper 60/30/10 color usage.
 * The card itself is the example: bg-surface (60%), ink tones for text &
 * borders (30%), and one accent element at the bottom (10%).
 */
export default function ColorUsageCard({
  title,
  description,
  accentVariant = "clay",
  showRatioBar = false,
}: ColorUsageCardProps) {
  const accent = ACCENT_MAP[accentVariant];

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl border border-[var(--color-line)]"
      style={{
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
        minWidth: "220px",
        maxWidth: "320px",
      }}
    >
      {/* Heading — ink (30% zone) */}
      <h3
        className="text-base font-bold leading-snug"
        style={{
          fontFamily: "var(--font-heading)",
          color: "var(--color-ink)",
        }}
      >
        {title}
      </h3>

      {/* Body text — ink-soft (30% zone) */}
      {description && (
        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          {description}
        </p>
      )}

      {/* Ratio bar (optional) */}
      {showRatioBar && <RatioBar accent={accent} />}

      {/* Divider (30% zone) */}
      <div
        className="h-px w-full"
        style={{ backgroundColor: "var(--color-line)" }}
        aria-hidden="true"
      />

      {/* Accent badge / button — the 10% element */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          {accent.role}
        </span>
        <button
          type="button"
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: accent.bg,
            color: accent.text,
            border: "none",
            cursor: "default",
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
          }}
          aria-label={`${accent.label} — ${accent.role}`}
        >
          {accent.label}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorUsageCardDemo
// ---------------------------------------------------------------------------

const DEMO_VARIANTS: Array<{
  variant: AccentVariant;
  title: string;
  description: string;
}> = [
  {
    variant: "clay",
    title: "Tanah Liat — CTA",
    description:
      "Gunakan clay hanya untuk satu primary CTA per halaman. Ini adalah 10% yang paling penting.",
  },
  {
    variant: "sage",
    title: "Sage — Sukses",
    description:
      "Sage menandai tindakan yang berhasil atau sesuatu yang sudah terlaksana.",
  },
  {
    variant: "honey",
    title: "Madu — Penanda Spesial",
    description:
      "Honey hanya digunakan sebagai latar atau penanda. Selalu pasangkan dengan teks ink di atasnya.",
  },
  {
    variant: "error",
    title: "Error — Bahaya",
    description:
      "Error digunakan untuk tindakan destruktif atau state gagal. Gunakan jarang-jarang.",
  },
  {
    variant: "heart",
    title: "Heart — Suka",
    description:
      "Heart dikhususkan untuk interaksi afektif — tombol suka, favorit, dan ekspresi cinta.",
  },
];

/**
 * ColorUsageCardDemo — renders all 5 accent variants side by side with
 * showRatioBar enabled, wrapped in a bg-paper container.
 */
export function ColorUsageCardDemo() {
  return (
    <div
      className="min-h-screen p-8 md:p-12"
      style={{ backgroundColor: "var(--color-paper)" }}
    >
      <header className="mb-10 max-w-2xl">
        <h1
          className="text-3xl font-bold mb-3 leading-tight"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-ink)",
          }}
        >
          60 / 30 / 10 — Color Usage
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          Setiap kartu adalah contoh langsung aturan 60/30/10: latar surface
          (60%), teks &amp; border ink (30%), satu elemen aksen saja (10%).
        </p>
      </header>

      <div className="flex flex-wrap gap-5">
        {DEMO_VARIANTS.map(({ variant, title, description }) => (
          <ColorUsageCard
            key={variant}
            title={title}
            description={description}
            accentVariant={variant}
            showRatioBar
          />
        ))}
      </div>
    </div>
  );
}
