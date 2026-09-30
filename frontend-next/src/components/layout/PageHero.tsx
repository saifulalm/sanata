import { Container } from "@/components/ui/Container";

/* SANATA Brand: Page Hero Section */
export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    /* SANATA Brand: Desert Charcoal background with Desert radial */
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(201,173,130,0.1),_transparent_28%),radial-gradient(circle_at_78%_20%,_rgba(201,173,130,0.08),_transparent_22%),linear-gradient(180deg,#1A1F22_0%,#12181B_100%)] pb-16 pt-36 text-white">
      {/* SANATA Brand: Desert grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,173,130,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(201,173,130,0.25) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      {/* SANATA Brand: Desert accent line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-desert-400/50 to-transparent" />
      <Container className="relative">
        <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-8">
          {/* SANATA Brand: Desert eyebrow */}
          <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-desert-400">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[0.04em] md:text-5xl">{title}</h1>
          {/* SANATA Brand: Charcoal text */}
          {description && <p className="mt-4 max-w-2xl text-charcoal-200">{description}</p>}
        </div>
      </Container>
    </section>
  );
}
