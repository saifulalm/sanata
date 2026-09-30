import clsx from "clsx";

/* ─────────────────────────────────────────────────────────────────
   Section Heading — Sanata Brand Design System
   Composed of: eyebrow (overline) → heading → description → accent line
   ──────────────────────────────────────────────────────────────── */

export type HeadingSize = "h2" | "h3";
export type Align = "left" | "center";

export function SectionHeading({
  eyebrow,
  title,
  description,
  headingAs = "h2",
  align = "left",
  accentLine = false,
  className,
}: {
  /** Small overline label above the title (e.g. "Tentang Kami"). */
  eyebrow?: string;
  /** Main heading text. */
  title: string;
  /** Supporting paragraph below the heading. */
  description?: string;
  /** Semantic heading tag. */
  headingAs?: HeadingSize;
  align?: Align;
  /** Show a Desert accent line below the description. */
  accentLine?: boolean;
  className?: string;
}) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left";

  const headingClass = clsx(
    "font-display font-semibold text-charcoal-50 tracking-tight leading-tight",
    headingAs === "h2"
      ? "text-3xl md:text-4xl lg:text-5xl"
      : "text-2xl md:text-3xl"
  );

  const HeadingTag = headingAs;

  return (
    <div className={clsx("flex flex-col gap-3", alignClass, className)}>
      {/* Eyebrow overline with Desert dot */}
      {eyebrow && (
        <p className="eyebrow-desert">{eyebrow}</p>
      )}

      {/* Main heading */}
      <HeadingTag className={headingClass}>{title}</HeadingTag>

      {/* Description */}
      {description && (
        <p className="mt-1 text-base leading-8 text-charcoal-200/80 md:text-lg">
          {description}
        </p>
      )}

      {/* Desert accent line */}
      {accentLine && (
        <div
          className={clsx(
            "accent-line-desert",
            align === "center" && "mx-auto mt-2"
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ── Compact variant for cards and sidebar headings ─────────────── */

export function SectionHeadingCompact({
  eyebrow,
  title,
  headingAs = "h3",
  className,
}: {
  eyebrow?: string;
  title: string;
  headingAs?: HeadingSize;
  className?: string;
}) {
  const headingClass = clsx(
    "font-display font-semibold text-charcoal-50 tracking-tight",
    headingAs === "h2" ? "text-2xl" : "text-lg"
  );
  const HeadingTag = headingAs;

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {eyebrow && (
        <p className="eyebrow-desert text-[0.7rem]">{eyebrow}</p>
      )}
      <HeadingTag className={headingClass}>{title}</HeadingTag>
    </div>
  );
}
