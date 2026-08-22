"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import {
  Users,
  Briefcase,
  Award,
  TrendingUp,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  type LucideIcon,
} from "lucide-react";

// Type definitions for CMS data
interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: "Briefcase" | "Users" | "Award" | "TrendingUp";
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

// Default stats fallback
const defaultStats: StatItem[] = [
  { value: 120, suffix: "+", label: "Proyek Selesai", icon: "Briefcase" },
  { value: 14, suffix: "+", label: "Tahun Pengalaman", icon: "Award" },
  { value: 80, suffix: "+", label: "Klien Puas", icon: "Users" },
  { value: 98, suffix: "%", label: "Tingkat Kepuasan", icon: "TrendingUp" },
];

// Default testimonials fallback
const defaultTestimonials: TestimonialItem[] = [
  {
    id: "1",
    name: "Ir. Ahmad Wijaya",
    role: "Direksi PT Nusantara Realty",
    content: "Sanata Construction menghadirkan solusi konstruksi yang inovatif dan efisien. Tim mereka sangat profesional dalam mengelola proyek kompleks kami.",
    rating: 5,
  },
  {
    id: "2",
    name: "Dr. Sarah Putri",
    role: "Rektor Universitas Teknologi Mandiri",
    content: "Implementasi sistem BIM dan pendekatan modular dari Sanata membuat proyek kampus kami selesai lebih cepat dari jadwal dengan kualitas premium.",
    rating: 5,
  },
  {
    id: "3",
    name: "Hendra Kusuma",
    role: "CEO PT Green Habitat Indonesia",
    content: "Komitmen Sanata terhadap keberlanjutan dan penggunaan material ramah lingkungan sejalan dengan visi perusahaan kami untuk hunian masa depan.",
    rating: 5,
  },
];

// Default FAQ fallback
const defaultFAQs: FAQItem[] = [
  {
    question: "Bagaimana proses perencanaan proyek di Sanata?",
    answer: "Kami memulai dengan analisis kebutuhan klien secara mendalam, kemudian membuat desain menggunakan teknologi BIM 4D yang memungkinkan visualisasi proyek secara real-time sebelum konstruksi dimulai.",
  },
  {
    question: "Berapa lama biasanya waktu pengerjaan proyek?",
    answer: "Waktu pengerjaan bervariasi tergantung skala dan kompleksitas proyek. Proyek residensial biasanya 6-12 bulan, sementara proyek komersial bisa 12-24 bulan atau lebih.",
  },
  {
    question: "Apakah Sanata memberikan garansi untuk proyek?",
    answer: "Ya, semua proyek kami dilengkapi dengan garansi struktural 10 tahun dan garansi finishing 2 tahun. Kami juga menyediakan layanan maintenance berkala.",
  },
  {
    question: "Bagaimana sistem pembayaran di Sanata?",
    answer: "Kami menerapkan sistem pembayaran berbasis milestone, di mana pembayaran dilakukan sesuai dengan tahapan penyelesaian proyek yang telah disepakati bersama.",
  },
];

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Users,
  Award,
  TrendingUp,
};

// Animated counter component
function AnimatedCounter({
  value,
  duration = 2000,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

export function StatsSection({ stats = defaultStats }: { stats?: StatItem[] }) {
  return (
    <section className="relative border-y border-white/10 bg-slate-950/60 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Track Record</p>
          <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
            Angka Yang Berbicara
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = iconMap[stat.icon] || Briefcase;
            return (
              <div
                key={stat.label}
                className="group relative text-center"
              >
                <div className="absolute -inset-4 rounded-[2rem] border border-white/5 bg-white/[0.02] opacity-0 transition group-hover:opacity-100" />
                <div className="relative">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                    <Icon size={24} className="text-cyan-300" />
                  </div>
                  <p className="text-5xl font-bold tracking-tight text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ testimonials = defaultTestimonials }: { testimonials?: TestimonialItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(239,135,69,0.08),_transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Testimoni</p>
          <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
            Kata Mereka Yang Sudah Merasakannya
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            {/* Quote icon */}
            <Quote
              size={48}
              className="absolute left-6 top-6 text-cyan-300/20"
            />

            <div className="min-h-[280px]">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`absolute inset-0 flex flex-col justify-between p-8 transition-all duration-500 ${
                    index === activeIndex
                      ? "translate-x-0 opacity-100"
                      : index < activeIndex
                      ? "-translate-x-full opacity-0"
                      : "translate-x-full opacity-0"
                  }`}
                >
                  {/* Content */}
                  <div className="pt-8">
                    <p className="text-lg leading-relaxed text-slate-200">
                      "{testimonial.content}"
                    </p>
                  </div>

                  {/* Author & Rating */}
                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-lg font-bold text-cyan-200">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-400">{testimonial.role}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
              <button
                onClick={prev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeIndex
                        ? "w-8 bg-cyan-400"
                        : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQSection({ faqs = defaultFAQs }: { faqs?: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative border-y border-white/10 bg-slate-950/60 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.06),_transparent_50%)]" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">
            Pertanyaan Umum
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="pr-4 font-semibold text-white">{faq.question}</span>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  <ChevronRight size={16} className={openIndex === index ? "rotate-90" : ""} />
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-5 pb-5 text-slate-300">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1500);
  };

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.1),_transparent_70%)]" />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-cyan-400/10 via-transparent to-amber-400/10" />

          <div className="relative">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Newsletter</p>
            <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em] text-white sm:text-3xl">
              Tetap Terhubung Dengan Kami
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-sm text-slate-400">
              Dapatkan update terbaru tentang proyek, teknologi konstruksi, dan insight industri langsung ke email Anda.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan alamat email Anda"
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/25 disabled:opacity-50"
                >
                  {status === "loading" ? "Mengirim..." : status === "success" ? "Terdaftar!" : "Berlangganan"}
                </button>
              </div>
            </form>

            {status === "success" && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400">
                <CheckCircle size={16} />
                Terima kasih! Anda telah berlangganan newsletter kami.
              </p>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Kami menghormati privasi Anda. Unsubscribe kapan saja.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,135,69,0.12),_transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-500/10 via-slate-950/90 to-cyan-500/10 p-12 text-center backdrop-blur-xl">
          <h2 className="text-3xl font-semibold uppercase tracking-[0.08em] text-white sm:text-5xl">
            Siap Membangun Masa Depan?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Hubungi kami hari ini untuk konsultasi gratis dan mulai wujudkan proyek impian Anda dengan teknologi konstruksi termutakhir.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-300/15 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.2)] transition hover:-translate-y-0.5 hover:bg-amber-300/25"
            >
              Hubungi Kami <ChevronRight size={16} />
            </a>
            <a
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
            >
              Lihat Portfolio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
