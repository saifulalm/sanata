import clsx from "clsx";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={clsx("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="font-accent text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
      )}
      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-8 text-slate-300">{description}</p>}
    </div>
  );
}
