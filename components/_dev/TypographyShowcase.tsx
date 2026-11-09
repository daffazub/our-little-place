/**
 * TypographyShowcase
 *
 * Typography scale reference for the "Kertas Hangat & Tanah Liat" design system.
 * Shows all type roles with live Indonesian samples, Tailwind classes, and pairing rules.
 *
 * @example
 * ```tsx
 * import TypographyShowcase from '@/components/ui/TypographyShowcase'
 *
 * export default function StyleGuidePage() {
 *   return <TypographyShowcase />
 * }
 * ```
 */

interface TypeRoleData {
  role: string;
  description: string;
  fontFamily: "heading" | "sans";
  size: string;
  weight: string;
  lineHeight: string;
  tailwindClass: string;
  sample: string;
}

const TYPE_ROLES: TypeRoleData[] = [
  {
    role: "Display / Hero",
    description: "Judul besar halaman, emosional & hangat",
    fontFamily: "heading",
    size: "2rem – 2.5rem",
    weight: "700",
    lineHeight: "1.15",
    tailwindClass: "font-heading text-4xl font-bold leading-tight",
    sample: "Tempat kecil kita, penuh cerita.",
  },
  {
    role: "H1 / Section",
    description: "Judul seksi utama",
    fontFamily: "heading",
    size: "1.5rem – 1.75rem",
    weight: "700",
    lineHeight: "1.25",
    tailwindClass: "font-heading text-2xl font-bold leading-snug",
    sample: "Kenangan yang kita simpan bersama",
  },
  {
    role: "H2 / Subheading",
    description: "Sub-judul & label seksi",
    fontFamily: "sans",
    size: "1.125rem – 1.25rem",
    weight: "600",
    lineHeight: "1.35",
    tailwindClass: "font-sans text-xl font-semibold leading-snug",
    sample: "Agenda minggu ini",
  },
  {
    role: "Body",
    description: "Teks paragraf utama",
    fontFamily: "sans",
    size: "0.938rem – 1rem",
    weight: "400 – 500",
    lineHeight: "1.6",
    tailwindClass: "font-sans text-base font-normal leading-relaxed",
    sample:
      "Hari itu kita duduk di warung kopi kecil, ngobrol sampai lupa waktu. Hujan turun pelan-pelan, tapi rasanya hangat sekali.",
  },
  {
    role: "Caption / Label",
    description: "Meta info, timestamp, badge teks",
    fontFamily: "sans",
    size: "0.75rem – 0.813rem",
    weight: "500",
    lineHeight: "1.4",
    tailwindClass: "font-sans text-xs font-medium leading-normal",
    sample: "3 hari lalu · Nongkrong",
  },
  {
    role: "Button",
    description: "Label tombol & aksi",
    fontFamily: "sans",
    size: "0.813rem",
    weight: "600 – 700",
    lineHeight: "1",
    tailwindClass: "font-sans text-[0.813rem] font-semibold leading-none",
    sample: "Tambah kenangan",
  },
];

interface FontFamilyShowcaseData {
  name: string;
  family: "heading" | "sans";
  description: string;
  useCase: string;
}

const FONT_FAMILIES: FontFamilyShowcaseData[] = [
  {
    name: "Fraunces",
    family: "heading",
    description: "Warm serif dengan karakter ekspresif",
    useCase: "Untuk konten emosional & dibaca — heading, judul, quote",
  },
  {
    name: "Figtree",
    family: "sans",
    description: "Humanist sans-serif yang bersih dan ramah",
    useCase: "Untuk teks UI & aksi — body, label, tombol, caption",
  },
];

const CHARSET = "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z";
const CHARSETLOWER = "a b c d e f g h i j k l m n o p q r s t u v w x y z";
const NUMBERS = "0 1 2 3 4 5 6 7 8 9";

interface TypeRoleCardProps {
  role: TypeRoleData;
}

function TypeRoleCard({ role }: TypeRoleCardProps) {
  const isHeading = role.fontFamily === "heading";

  return (
    <div
      className="rounded-2xl border border-[var(--color-line)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Sample text area */}
      <div
        className="px-6 py-7"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <p
          style={{
            fontFamily: isHeading ? "var(--font-heading)" : "var(--font-sans)",
            fontSize: role.size.split("–")[1]?.trim() ?? role.size,
            fontWeight: role.weight.includes("–")
              ? role.weight.split("–")[1]?.trim()
              : role.weight,
            lineHeight: role.lineHeight,
            color: "var(--color-ink)",
          }}
        >
          {role.sample}
        </p>
      </div>

      {/* Metadata row */}
      <div
        className="px-6 py-4 border-t border-[var(--color-line)] flex flex-wrap items-start gap-x-6 gap-y-2"
        style={{ backgroundColor: "var(--color-sunken)" }}
      >
        {/* Role label */}
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span
            className="text-[0.688rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Role
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            {role.role}
          </span>
        </div>

        {/* Font */}
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[0.688rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Font
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
          >
            {isHeading ? "Fraunces (font-heading)" : "Figtree (font-sans)"}
          </span>
        </div>

        {/* Size */}
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[0.688rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Size
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
          >
            {role.size}
          </span>
        </div>

        {/* Weight */}
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[0.688rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Weight
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
          >
            {role.weight}
          </span>
        </div>

        {/* Line height */}
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[0.688rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Line-height
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-ink)", fontFamily: "monospace" }}
          >
            {role.lineHeight}
          </span>
        </div>

        {/* Tailwind class */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[200px]">
          <span
            className="text-[0.688rem] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ink-soft)" }}
          >
            Tailwind
          </span>
          <code
            className="text-[0.75rem] break-all"
            style={{
              color: "var(--color-clay)",
              fontFamily: "monospace",
            }}
          >
            {role.tailwindClass}
          </code>
        </div>
      </div>
    </div>
  );
}

interface FontFamilyCardProps {
  data: FontFamilyShowcaseData;
}

function FontFamilyCard({ data }: FontFamilyCardProps) {
  const isHeading = data.family === "heading";
  const fontStyle: React.CSSProperties = {
    fontFamily: isHeading ? "var(--font-heading)" : "var(--font-sans)",
    color: "var(--color-ink)",
  };

  return (
    <div
      className="rounded-2xl border border-[var(--color-line)] overflow-hidden flex-1 min-w-[280px]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <div
        className="px-6 pt-6 pb-4"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <p
          className="text-2xl font-bold mb-1"
          style={{ ...fontStyle, fontWeight: 700 }}
        >
          {data.name}
        </p>
        <p
          className="text-sm"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          {data.description}
        </p>
      </div>

      {/* Character set */}
      <div
        className="px-6 py-4 border-t border-[var(--color-line)]"
        style={{ backgroundColor: "var(--color-sunken)" }}
      >
        <p
          className="text-base tracking-wide leading-loose"
          style={{ ...fontStyle }}
        >
          {CHARSET}
        </p>
        <p
          className="text-base tracking-wide leading-loose"
          style={{ ...fontStyle }}
        >
          {CHARSETLOWER}
        </p>
        <p
          className="text-base tracking-wide leading-loose"
          style={{ ...fontStyle }}
        >
          {NUMBERS}
        </p>
      </div>

      {/* Use case */}
      <div
        className="px-6 py-4 border-t border-[var(--color-line)]"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          Gunakan untuk
        </p>
        <p
          className="text-sm leading-snug"
          style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
        >
          {data.useCase}
        </p>
      </div>
    </div>
  );
}

export default function TypographyShowcase() {
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
          Tipografi
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-soft)",
          }}
        >
          Skala tipografi untuk sistem desain Kertas Hangat & Tanah Liat.
          Fraunces untuk momen emosional, Figtree untuk antarmuka & aksi.
        </p>
      </header>

      {/* Font pairing rule */}
      <section
        className="mb-12 p-6 rounded-2xl border border-[var(--color-line)] max-w-3xl"
        style={{ backgroundColor: "var(--color-clay-tint)" }}
      >
        <h2
          className="text-sm font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-clay)", fontFamily: "var(--font-sans)" }}
        >
          Aturan Pasangan Font
        </h2>
        <div className="flex flex-col gap-2">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
          >
            <strong>Fraunces (font-heading)</strong> — dipakai untuk konten
            emosional dan yang dibaca: judul halaman, heading seksi, quote,
            momen personal. Karakter serifynya membawa kehangatan & kedalaman.
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-ink)", fontFamily: "var(--font-sans)" }}
          >
            <strong>Figtree (font-sans)</strong> — dipakai untuk teks UI dan
            aksi: body text, label, tombol, caption, metadata. Humanist
            sans-serifnya membuat antarmuka terasa ramah & mudah dibaca.
          </p>
        </div>
      </section>

      {/* Font family showcase */}
      <section className="mb-14">
        <h2
          className="text-base font-semibold uppercase tracking-widest mb-5"
          style={{
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
          }}
        >
          Font Families
        </h2>
        <div className="flex flex-wrap gap-5">
          {FONT_FAMILIES.map((f) => (
            <FontFamilyCard key={f.name} data={f} />
          ))}
        </div>
      </section>

      {/* Type scale */}
      <section className="max-w-4xl">
        <h2
          className="text-base font-semibold uppercase tracking-widest mb-5"
          style={{
            color: "var(--color-ink-soft)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
          }}
        >
          Type Scale
        </h2>
        <div className="flex flex-col gap-5">
          {TYPE_ROLES.map((role) => (
            <TypeRoleCard key={role.role} role={role} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="mt-14 pt-6 border-t border-[var(--color-line)]">
        <p
          className="text-xs"
          style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-sans)" }}
        >
          Font loading diatur di{" "}
          <code style={{ fontFamily: "monospace" }}>app/layout.tsx</code> via
          next/font. Gunakan class{" "}
          <code style={{ fontFamily: "monospace" }}>font-heading</code> untuk
          Fraunces dan{" "}
          <code style={{ fontFamily: "monospace" }}>font-sans</code> (default)
          untuk Figtree.
        </p>
      </footer>
    </div>
  );
}
