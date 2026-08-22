"use client";

import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { submitInquiry, type ContactFormState } from "@/app/(public)/contact/actions";
import { findAnswer, suggestAgent, type AssistantMatch, type KnowledgeEntry } from "@/lib/whatsappAssistant";

/**
 * Widget WhatsApp mengambang.
 *
 * Versi sebelumnya hanya sebuah tautan `wa.me`: pengunjung langsung keluar dari
 * situs dan tidak ada jejak apa pun yang tersimpan, padahal setiap kanal lain
 * di aplikasi ini mencatat prospek. Widget ini menutup lubang itu.
 *
 * Yang dijaga:
 *
 * - **Prospek tetap tercatat.** Form "tinggalkan pesan" mengirim ke pipeline
 *   `Inquiry` yang sudah ada, jadi lead muncul di Admin → Pesan Masuk dan ikut
 *   tersinkron ke kontak broadcast bila pengunjung menyetujuinya. Tanpa ini,
 *   percakapan yang tidak jadi dikirim hilang tanpa bekas.
 * - **Konteks halaman ikut terbawa.** Pesan yang sudah terisi menyertakan judul
 *   dan URL halaman asal, sehingga tim tahu apa yang sedang dilihat penanya.
 * - **Status jam kerja jujur.** Di luar jam layanan widget mengatakannya, bukan
 *   membiarkan orang mengira pesannya akan dibalas saat itu juga.
 * - Panel dapat ditutup dengan Escape, fokus dipindahkan saat dibuka dan
 *   dikembalikan saat ditutup, dan animasi denyut mengikuti
 *   `prefers-reduced-motion`.
 */

export interface WhatsAppAgent {
  id: string;
  name: string;
  role: string | null;
  note: string | null;
  avatarUrl: string | null;
  phone: string;
  hours: string | null;
  /** Kata kunci topik; dipakai asisten untuk menyarankan tim yang tepat. */
  keywords: string | null;
}

export interface WhatsAppWidgetConfig {
  label: string;
  panelTitle: string;
  panelSubtitle: string;
  greeting: string;
  quickReplies: string[];
  offlineNote: string;
  captureLead: boolean;
  assistantEnabled: boolean;
  assistantIntro: string;
  assistantMiss: string;
  /** Menit sejak tengah malam waktu kantor. */
  openMinute: number;
  closeMinute: number;
  /** 0 = Minggu … 6 = Sabtu. */
  workDays: number[];
  utcOffsetHours: number;
  defaultMessage: string;
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/**
 * Apakah sekarang masih jam layanan, dihitung pada zona waktu kantor.
 *
 * Server dan pengunjung bisa berada di zona berbeda, jadi perbandingan dibuat
 * dari UTC ditambah offset kantor — bukan dari jam lokal peramban, yang akan
 * menandai "tutup" untuk pengunjung luar negeri di jam kerja Indonesia.
 */
function isWithinHours(config: WhatsAppWidgetConfig, now: Date): boolean {
  if (config.workDays.length === 0) return false;

  const officeMs = now.getTime() + config.utcOffsetHours * 60 * 60 * 1000;
  const office = new Date(officeMs);
  const day = office.getUTCDay();
  if (!config.workDays.includes(day)) return false;

  const minutes = office.getUTCHours() * 60 + office.getUTCMinutes();
  // Jam tutup yang lebih kecil dari jam buka berarti shift melewati tengah malam.
  return config.closeMinute >= config.openMinute
    ? minutes >= config.openMinute && minutes < config.closeMinute
    : minutes >= config.openMinute || minutes < config.closeMinute;
}

function waLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppWidget({
  agents,
  config,
  knowledge,
}: {
  agents: WhatsAppAgent[];
  config: WhatsAppWidgetConfig;
  /** Basis pengetahuan asisten — koleksi FAQ yang dikelola admin. */
  knowledge: KnowledgeEntry[];
}) {
  const panelId = useId();
  const pathname = usePathname();
  const reduceMotion = usePrefersReducedMotion();

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState("");
  const [online, setOnline] = useState(false);
  // `answer` menyimpan hasil terakhir; `asked` menandai pertanyaan sudah
  // dijawab supaya "belum tahu" hanya muncul setelah pengunjung bertanya,
  // bukan sejak panel dibuka.
  const [answer, setAnswer] = useState<AssistantMatch | null>(null);
  const [asked, setAsked] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Status jam kerja dihitung di klien setelah hidrasi. Menghitungnya saat
  // render server akan membekukan jawabannya pada waktu build/cache dan
  // menampilkan "online" di tengah malam.
  useEffect(() => {
    const tick = () => setOnline(isWithinHours(config, new Date()));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [config]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Fokus dikembalikan ke tombol hanya bila panel memang pernah dibuka.
  // Tanpa penjaga ini efek berjalan sekali saat mount dengan `open` bernilai
  // false, sehingga setiap halaman yang dimuat merebut fokus ke tombol
  // WhatsApp — pengguna keyboard langsung terlempar ke pojok kanan bawah.
  const hasOpened = useRef(false);
  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      panelRef.current?.focus();
    } else if (hasOpened.current) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  // Menutup panel saat pengunjung pindah halaman; panel yang tetap terbuka di
  // halaman baru terasa seperti sisa yang lupa dibersihkan. Disesuaikan saat
  // render — bukan lewat efek — sesuai pola React untuk menyetel ulang state
  // ketika sebuah nilai berubah, sehingga tidak ada render bertingkat.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    if (open) setOpen(false);
  }

  const pageContext = () => {
    if (typeof window === "undefined") return "";
    return `\n\n— dikirim dari ${document.title} (${window.location.href})`;
  };

  const composed = (extra?: string) => {
    const base = extra?.trim() || draft.trim() || config.defaultMessage;
    return `${base}${pageContext()}`;
  };

  const openChat = (agent: WhatsAppAgent, extra?: string) => {
    window.open(waLink(agent.phone, composed(extra)), "_blank", "noopener,noreferrer");
  };

  const assistantOn = config.assistantEnabled && knowledge.length > 0;

  const ask = () => {
    const question = draft.trim();
    if (!question) return;
    setAsked(true);
    setAnswer(findAnswer(question, knowledge));
  };

  // Tim yang disarankan hanya ditampilkan setelah pengunjung menulis sesuatu,
  // supaya tidak ada rekomendasi yang muncul tanpa dasar.
  const suggested = assistantOn && draft.trim() ? suggestAgent(draft, agents) : null;

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={config.panelTitle}
          tabIndex={-1}
          className="fixed bottom-24 right-4 z-50 flex max-h-[min(34rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-[0_30px_80px_rgba(2,12,27,0.55)] backdrop-blur-xl focus:outline-none md:bottom-28 md:right-8"
        >
          <header className="flex items-start gap-3 border-b border-white/10 bg-emerald-600/15 px-5 py-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{config.panelTitle}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-300">
                <span
                  aria-hidden="true"
                  className={clsx("h-1.5 w-1.5 rounded-full", online ? "bg-emerald-400" : "bg-slate-500")}
                />
                {online ? config.panelSubtitle : "Sedang di luar jam kerja"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup panel WhatsApp"
              className="rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <p className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-200">
              {config.greeting}
            </p>

            {!online && (
              <p className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-3.5 py-2.5 text-xs leading-5 text-amber-200">
                {config.offlineNote}
              </p>
            )}

            {config.quickReplies.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Pilihan cepat</p>
                <div className="flex flex-wrap gap-2">
                  {config.quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setDraft(reply)}
                      aria-pressed={draft === reply}
                      className={clsx(
                        "rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300",
                        draft === reply
                          ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
                          : "border-white/12 text-slate-300 hover:border-emerald-300/35 hover:text-white"
                      )}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor={`${panelId}-draft`} className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-slate-500">
                {assistantOn ? "Tanya atau tulis pesan" : "Pesan Anda"}
              </label>
              <textarea
                id={`${panelId}-draft`}
                rows={2}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setAsked(false);
                  setAnswer(null);
                }}
                onKeyDown={(e) => {
                  // Enter mengirim pertanyaan; Shift+Enter tetap membuat baris
                  // baru, karena pesan ke tim sering lebih dari satu kalimat.
                  if (assistantOn && e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
                placeholder={assistantOn ? config.assistantIntro : config.defaultMessage}
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
              />
              {assistantOn && (
                <button
                  type="button"
                  onClick={ask}
                  disabled={draft.trim().length === 0}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                >
                  <Sparkles size={14} /> Cari Jawaban Cepat
                </button>
              )}
            </div>

            {assistantOn && asked && (
              <div aria-live="polite">
                {answer ? (
                  <div className="rounded-2xl rounded-tl-sm border border-emerald-300/20 bg-emerald-500/10 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                      <Sparkles size={11} /> Jawaban dari FAQ
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-white">{answer.entry.question}</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-200">{answer.entry.answer}</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Belum menjawab pertanyaan Anda? Pilih tim di bawah untuk lanjut ke WhatsApp.
                    </p>
                  </div>
                ) : (
                  <p className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-300">
                    {config.assistantMiss}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                {agents.length > 1 ? "Pilih tim yang dituju" : "Hubungi kami"}
              </p>
              <ul className="space-y-2">
                {agents.map((agent) => (
                  <li key={agent.id}>
                    <button
                      type="button"
                      onClick={() => openChat(agent)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-emerald-300/35 hover:bg-emerald-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                    >
                      {agent.avatarUrl ? (
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-800">
                          <Image src={agent.avatarUrl} alt="" fill sizes="36px" className="object-cover" />
                        </span>
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-200">
                          {agent.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-white">{agent.name}</span>
                          {suggested?.id === agent.id && (
                            <span className="shrink-0 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-200">
                              Disarankan
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-slate-400">
                          {[agent.role, agent.hours].filter(Boolean).join(" · ") || "WhatsApp"}
                        </span>
                        {agent.note && (
                          <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-slate-500">
                            {agent.note}
                          </span>
                        )}
                      </span>
                      <Send size={15} className="shrink-0 text-emerald-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {config.captureLead && (
              <div className="border-t border-white/10 pt-4">
                {showForm ? (
                  <LeadForm defaultMessage={draft || config.defaultMessage} onDone={() => setShowForm(false)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="w-full rounded-xl border border-white/12 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-emerald-300/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                  >
                    Tinggalkan pesan &amp; nomor — tim menghubungi Anda
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Tutup panel WhatsApp" : config.label}
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-emerald-300/35 bg-emerald-500/90 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(16,185,129,0.35)] backdrop-blur-xl transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 md:bottom-8 md:right-8"
      >
        <span className="relative flex shrink-0 items-center justify-center">
          {open ? <X size={22} /> : <MessageCircle size={22} />}
          {!open && online && !reduceMotion && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-200"
            />
          )}
          {!open && online && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-200 ring-2 ring-emerald-600"
            />
          )}
        </span>
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[12rem] md:inline">
          {config.label}
        </span>
      </button>
    </>
  );
}

const initialState: ContactFormState = { status: "idle" };

const leadFieldClass =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/20";

/**
 * Form prospek di dalam widget.
 *
 * Memakai Server Action yang sama dengan formulir kontak, jadi validasi, batas
 * laju, notifikasi email, dan sinkronisasi kontak broadcast berlaku persis
 * sama — tidak ada jalur masuk kedua yang perlu dijaga terpisah.
 *
 * Email tetap wajib karena kolom `Inquiry.email` memang wajib dan dipakai
 * balasan otomatis; menjadikannya opsional adalah perubahan skema tersendiri,
 * bukan sesuatu yang pantas diselipkan di sini.
 */
function LeadForm({ defaultMessage, onDone }: { defaultMessage: string; onDone: () => void }) {
  const [state, formAction] = useActionState(submitInquiry, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-3">
        <p className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-200">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {state.message}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl border border-white/12 px-3 py-2 text-xs text-slate-300 hover:text-white"
        >
          Tutup
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2.5">
      <input name="name" required minLength={2} placeholder="Nama" aria-label="Nama" className={leadFieldClass} />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        aria-label="Email"
        className={leadFieldClass}
      />
      <input name="phone" placeholder="Nomor WhatsApp" aria-label="Nomor WhatsApp" className={leadFieldClass} />
      <textarea
        name="message"
        rows={3}
        required
        minLength={10}
        defaultValue={defaultMessage}
        aria-label="Pesan"
        className={leadFieldClass}
      />
      <input type="hidden" name="preferredChannel" value="WHATSAPP" />
      <label className="flex items-start gap-2 text-[11px] leading-4 text-slate-400">
        <input type="checkbox" name="marketingConsent" className="mt-0.5 rounded border-white/20 bg-transparent" />
        Saya bersedia dihubungi kembali untuk penawaran dan informasi layanan.
      </label>
      {state.status === "error" && state.message && <p className="text-xs text-red-300">{state.message}</p>}
      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
      >
        Kirim Pesan
      </button>
    </form>
  );
}
