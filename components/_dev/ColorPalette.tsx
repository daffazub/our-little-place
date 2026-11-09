/**
 * ColorPalette
 *
 * Interactive color swatch gallery for the "Kertas Hangat & Tanah Liat" design system.
 *
 * @example
 * ```tsx
 * import ColorPalette from '@/components/ui/ColorPalette'
 *
 * export default function StyleGuidePage() {
 *   return <ColorPalette />
 * }
 * ```
 */

interface SwatchData {
  token: string;
  hex: string;
  /** WCAG contrast ratio string, e.g. "13.8:1 AAA" — empty if not applicable */
  wcag: string;
  /** Short note on intended usage */
  usage: string;
}

interface SwatchGroupData {
  title: string;
  swatches: SwatchData[];
}

const SWATCH_GROUPS: SwatchGroupData[] = [
  {
    title: "Paper Tones",
    swatches: [
      {
        token: "--color-paper",
        hex: "#FBF6EE",
        wcag: "",
        usage: "Latar utama halaman (60% rule)",
      },
      {
        token: "--color-surface",
        hex: "#FFFDF8",
        wcag: "",
        usage: "Latar kartu & modal",
      },
      {
        token: "--color-sunken",
        hex: "#F3EADB",
        wcag: "",
        usage: "Input, area tenggelam",
      },
    ],
  },
  {
    title: "Structure Tones",
    swatches: [
      {
        token: "--color-line",
        hex: "#E6DAC6",
        wcag: "",
        usage: "Border & divider",
      },
    ],
  },
  {
    title: "Text Tones",
    swatches: [
      {
        token: "--color-ink",
        hex: "#2B211C",
        wcag: "13.8:1 AAA",
        usage: "Teks utama di atas paper",
      },
      {
        token: "--color-ink-soft",
        hex: "#6B5B50",
        wcag: "5.4:1 AA",
        usage: "Teks sekunder & caption",
      },
    ],
  },
  {
    title: "Clay Accent",
    swatches: [
      {
        token: "--color-clay",
        hex: "#C2512F",
        wcag: "4.7:1 AA (white)",
        usage: "Primer CTA, 10% accent",
      },
      {
        token: "--color-clay-deep",
        hex: "#A8421F",
        wcag: "",
        usage: "Hover/pressed state primer",
      },
      {
        token: "--color-clay-tint",
        hex: "#F6DCCF",
        wcag: "",
        usage: "Latar badge clay, teks #7A2E14",
      },
    ],
  },
  {
    title: "Sage",
    swatches: [
      {
        token: "--color-sage",
        hex: "#5F7A61",
        wcag: "4.7:1 AA (white)",
        usage: "Sukses / terlaksana",
      },
      {
        token: "--color-sage-tint",
        hex: "#DDE7D8",
        wcag: "",
        usage: "Latar badge sage",
      },
    ],
  },
  {
    title: "Honey & Dusk",
    swatches: [
      {
        token: "--color-honey",
        hex: "#E9B44C",
        wcag: "8.1:1 AAA (ink on honey)",
        usage: "Hanya latar/penanda — gunakan ink di atasnya",
      },
      {
        token: "--color-dusk",
        hex: "#DCE6EC",
        wcag: "",
        usage: "Info / tenang",
      },
    ],
  },
  {
    title: "Error & Heart",
    swatches: [
      {
        token: "--color-error",
        hex: "#B3261E",
        wcag: "6.7:1 AAA",
        usage: "State error di atas surface",
      },
      {
        token: "--color-heart",
        hex: "#C73E56",
        wcag: "",
        usage: "Tombol suka / favorit",
      },
    ],
  },
  {
    title: "Category Colors",
    swatches: [
      {
        token: "--color-cat-nongkrong",
        hex: "#C9A66B",
        wcag: "",
        usage: "Kategori Nongkrong",
      },
      {
        token: "--color-cat-liburan",
        hex: "#7FA3B5",
        wcag: "",
        usage: "Kategori Liburan",
      },
      {
        token: "--color-cat-kuliner",
        hex: "#C2512F",
        wcag: "",
        usage: "Kategori Kuliner",
      },
      {
        token: "--color-cat-perayaan",
        hex: "#E9B44C",
        wcag: "",
        usage: "Kategori Perayaan",
      },
      {
        token: "--color-cat-random",
        hex: "#9C8FB0",
        wcag: "",
        usage: "Kategori Random",
      },
    ],
  },
];

interface SwatchCardProps {
  swatch: SwatchData;
}

function SwatchCard({ swatch }: SwatchCardProps) {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Color box */}
      <div
        className="w-20 h-20 rounded-lg border border-[var(--color-line)] flex-shrink-0"
        style={{ backgroundColor: `var(${swatch.token})` }}
        aria-hidden="true"
      />

      {/* Token name */}
      <p
        className="text-[0.75rem] font-mono font-semibold leading-tight break-all"
        style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
      >
        {swatch.token}
      </p>

      {/* Hex value */}
      <p
        className="text-[0.75rem] font-mono"
        style={{ color: "var(--color-ink-soft)" }}
      >
        {swatch.hex}
      </p>

      {/* WCAG badge */}
      {swatch.wcag && (
        <span
          className="inline-block text-[0.688rem] font-semibold px-2 py-0.5 rounded-full w-fit"
          style={{
            backgroundColor: "var(--color-sage-tint)",
            color: "var(--color-sage-deep)",
          }}
        >
          {swatch.wcag}
        </span>
      )}

      {/* Usage note */}
      <p
        className="text-[0.75rem] leading-snug"
        style={{ color: "var(--color-ink-soft)" }}
      >
        {swatch.usage}
      </p>
    </div>
  );
}

interface SwatchGroupProps {
  group: SwatchGroupData;
}

function SwatchGroup({ group }: SwatchGroupProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2
        className="text-base font-semibold tracking-wide uppercase"
        style={{
          color: "var(--color-ink-soft)",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.08em",
        }}
      >
        {group.title}
      </h2>
      <div className="flex flex-wrap gap-4">
        {group.swatches.map((swatch) => (
          <SwatchCard key={swatch.token} swatch={swatch} />
        ))}
      </div>
    </section>
  );
}

export default function ColorPalette() {
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
          Kertas Hangat & Tanah Liat
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          Color palette reference — 60% paper/surface backgrounds, 30% ink
          tones, 10% clay accent. WCAG ratios measured against{" "}
          <code
            className="text-sm px-1 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-sunken)",
              color: "var(--color-clay)",
              fontFamily: "monospace",
            }}
          >
            #FBF6EE
          </code>{" "}
          paper background.
        </p>
      </header>

      {/* Swatch groups */}
      <main className="flex flex-col gap-10 max-w-5xl">
        {SWATCH_GROUPS.map((group) => (
          <SwatchGroup key={group.title} group={group} />
        ))}
      </main>

      {/* Footer note */}
      <footer className="mt-14 pt-6 border-t border-[var(--color-line)]">
        <p
          className="text-xs"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          WCAG contrast ratios: ink/paper 13.8:1 AAA · ink-soft/paper 5.4:1 AA
          · white/clay 4.7:1 AA · white/sage 4.7:1 AA · ink/honey 8.1:1 AAA ·
          error/surface 6.7:1 AAA
        </p>
      </footer>
    </div>
  );
}
