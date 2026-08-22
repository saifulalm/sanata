import { Container } from "@/components/ui/Container";

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_78%_20%,_rgba(239,135,69,0.1),_transparent_22%),linear-gradient(180deg,_#06111f_0%,_#081421_100%)] pb-16 pt-36 text-white">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125,211,252,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.35) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      <Container className="relative">
        <div className="max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-8">
          <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[0.04em] md:text-5xl">{title}</h1>
          {description && <p className="mt-4 max-w-2xl text-slate-300">{description}</p>}
        </div>
      </Container>
    </section>
  );
}
