import { randomUUID } from "node:crypto";
import { Prisma, type LetterStatus, type LetterType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { money, percentOf, toDecimal } from "@/utils/money";
import { addDays, isoDate, parseDateOnly, startOfUtcDay, todayInProjectZone } from "@/utils/date";
import { terbilang } from "@/utils/terbilang";
import { allocateDocumentNumber, type DocumentSeries } from "@/services/documentNumber.service";
import { getRabSchedule } from "@/services/schedule.service";
import type { LetterBody, LetterInput, LetterUpdateInput } from "@/validators/projectDoc.validator";

/**
 * Surat resmi proyek: SPK, invoice, kwitansi, BAPP, dan BAST.
 *
 * Dua aturan menopang seluruh modul ini.
 *
 * **Nomor baru diberikan saat surat terbit, bukan saat draf dibuat.** Draf yang
 * dibatalkan tidak boleh meninggalkan lubang di deret nomor: pembukuan yang
 * melompat dari INV/007 ke INV/009 selalu menimbulkan pertanyaan yang tidak
 * bisa dijawab. Selama masih draf, nomornya bersifat sementara dan ditandai.
 *
 * **Angka dibekukan saat terbit.** Invoice diturunkan dari termin, termin dari
 * opname. Bila opname direvisi setelah invoice dikirim — dan itu sering terjadi
 * — nilai yang sudah dipegang pemilik proyek tidak boleh ikut berubah. Karena
 * itu rincian disalin ke `snapshot` pada saat terbit, sama seperti Surat
 * Penawaran dan berita acara termin.
 */

const SERIES_BY_TYPE: Record<LetterType, DocumentSeries> = {
  SPK: "SPK",
  INVOICE: "INVOICE",
  KWITANSI: "KWITANSI",
  BAPP: "BAPP",
  BAST: "BAST",
};

export const LETTER_LABEL: Record<LetterType, string> = {
  SPK: "Surat Perjanjian Kerja",
  INVOICE: "Invoice",
  KWITANSI: "Kwitansi",
  BAPP: "Berita Acara Penyelesaian Pekerjaan",
  BAST: "Berita Acara Serah Terima",
};

/** Surat yang membawa nilai uang. Berita acara tidak. */
function carriesAmount(type: LetterType): boolean {
  return type === "INVOICE" || type === "KWITANSI" || type === "SPK";
}

/**
 * Draf boleh berubah bebas. Setelah terbit, yang tersisa hanyalah perjalanan
 * statusnya — isi dan angkanya sudah menjadi milik pihak lain.
 */
const ALLOWED_TRANSITIONS: Record<LetterStatus, LetterStatus[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["SIGNED", "PAID", "CANCELLED"],
  SIGNED: ["PAID", "CANCELLED"],
  PAID: ["CANCELLED"],
  CANCELLED: [],
};

const include = {
  createdBy: { select: { id: true, name: true } },
  rab: { select: { id: true, number: true, title: true, clientName: true, location: true } },
  billing: { select: { id: true, number: true, periodEnd: true, netAmount: true } },
  quotation: { select: { id: true, number: true, subject: true } },
  parentLetter: { select: { id: true, number: true, type: true, subject: true } },
  childLetters: { select: { id: true, number: true, type: true, status: true } },
  signatory: { select: { id: true } },
} as const;

type LetterRow = Prisma.ProjectLetterGetPayload<{ include: typeof include }>;

function serialize(row: LetterRow) {
  const today = todayInProjectZone();
  const due = row.dueDate ? startOfUtcDay(row.dueDate) : null;

  return {
    id: row.id,
    number: row.number,
    typeLabel: LETTER_LABEL[row.type],
    type: row.type,
    status: row.status,
    rabId: row.rabId,
    rab: row.rab,
    subject: row.subject,
    letterDate: isoDate(startOfUtcDay(row.letterDate)),
    issuedAt: row.issuedAt?.toISOString() ?? null,
    signedAt: row.signedAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    dueDate: due ? isoDate(due) : null,
    /// Invoice yang sudah lewat jatuh tempo dan belum dibayar — satu-satunya
    /// keadaan yang perlu menonjol di daftar surat.
    isOverdue: Boolean(due && row.type === "INVOICE" && row.status === "ISSUED" && due < today),

    recipientName: row.recipientName,
    recipientCompany: row.recipientCompany,
    recipientAddress: row.recipientAddress,
    attentionTo: row.attentionTo,

    signerName: row.signerName,
    signerTitle: row.signerTitle,
    signatoryId: row.signatoryId,
    counterSignerName: row.counterSignerName,
    counterSignerTitle: row.counterSignerTitle,

    amount: money(row.amount).toString(),
    retentionAmount: money(row.retentionAmount).toString(),
    taxPct: toDecimal(row.taxPct).toString(),
    taxAmount: money(row.taxAmount).toString(),
    totalAmount: money(row.totalAmount).toString(),
    amountInWords: row.amountInWords,

    body: (row.body as LetterBody) ?? {},
    snapshot: row.snapshot as Record<string, unknown> | null,

    billing: row.billing
      ? {
          id: row.billing.id,
          number: row.billing.number,
          periodEnd: isoDate(startOfUtcDay(row.billing.periodEnd)),
          netAmount: money(row.billing.netAmount).toString(),
        }
      : null,
    quotation: row.quotation,
    parentLetter: row.parentLetter,
    childLetters: row.childLetters,

    notes: row.notes,
    attachments: (row.attachments as { url: string; name: string }[] | null) ?? [],
    createdByName: row.createdBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type ProjectLetter = ReturnType<typeof serialize>;

/**
 * Rantai hitung nilai surat.
 *
 * Pajak dikenakan setelah retensi dipotong, mengikuti aturan yang sama dengan
 * berita acara termin — kalau tidak, dua dokumen yang menagih uang yang sama
 * akan menyebut angka yang berbeda.
 */
function computeAmounts(input: {
  amount?: number | null;
  retentionAmount?: number | null;
  taxPct?: number | null;
}) {
  const amount = money(input.amount ?? 0);
  const retention = money(input.retentionAmount ?? 0);
  const taxPct = toDecimal(input.taxPct ?? 0);
  const taxable = amount.minus(retention);
  const taxAmount = percentOf(taxable, taxPct);
  const total = money(taxable.plus(taxAmount));

  return {
    amount,
    retentionAmount: retention,
    taxPct,
    taxAmount,
    totalAmount: total,
    amountInWords: terbilang(total),
  };
}

// --- Baca --------------------------------------------------------------------

export async function listLetters(
  rabId: string,
  query: { type?: string; status?: string; search?: string } = {}
) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    select: { id: true, number: true, title: true, clientName: true },
  });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const rows = await prisma.projectLetter.findMany({
    where: {
      rabId,
      ...(query.type ? { type: query.type as LetterType } : {}),
      ...(query.status ? { status: query.status as LetterStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: "insensitive" } },
              { subject: { contains: query.search, mode: "insensitive" } },
              { recipientName: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
    include,
  });

  const letters = rows.map(serialize);
  const issued = letters.filter((l) => l.status !== "DRAFT" && l.status !== "CANCELLED");

  return {
    rab,
    letters,
    summary: {
      total: letters.length,
      drafts: letters.filter((l) => l.status === "DRAFT").length,
      overdueInvoices: letters.filter((l) => l.isOverdue).length,
      /// Nilai yang sudah ditagih lewat invoice terbit, dan berapa yang lunas.
      invoicedTotal: issued
        .filter((l) => l.type === "INVOICE")
        .reduce((acc, l) => acc.plus(l.totalAmount), new Prisma.Decimal(0))
        .toString(),
      paidTotal: issued
        .filter((l) => l.type === "INVOICE" && l.status === "PAID")
        .reduce((acc, l) => acc.plus(l.totalAmount), new Prisma.Decimal(0))
        .toString(),
    },
  };
}

export async function getLetter(id: string) {
  const row = await prisma.projectLetter.findUnique({ where: { id }, include });
  if (!row) throw ApiError.notFound("Surat tidak ditemukan");
  return serialize(row);
}

// --- Tulis -------------------------------------------------------------------

/**
 * Nomor sementara untuk draf.
 *
 * Ditandai jelas supaya tidak pernah tertukar dengan nomor sungguhan bila draf
 * telanjur dicetak: yang membaca surat langsung tahu dokumennya belum terbit.
 *
 * Bagian acaknya diambil dari `randomUUID`, bukan dari jam. Stempel waktu
 * terlihat cukup unik sampai beberapa draf dibuat dalam milidetik yang sama —
 * dan itu bukan skenario teoretis, karena satu berita acara yang disiapkan
 * untuk beberapa bagian pekerjaan sekaligus memang dibuat berbarengan. Yang
 * kalah menerima galat keunikan pada nomor yang bahkan belum resmi.
 */
function draftNumber(type: LetterType): string {
  return `DRAFT-${SERIES_BY_TYPE[type]}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createLetter(input: LetterInput, userId: string) {
  const rab = await prisma.rab.findUnique({ where: { id: input.rabId }, select: { id: true } });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  await assertLinksBelongToRab(input.rabId, input);

  const amounts = carriesAmount(input.type)
    ? computeAmounts(input)
    : computeAmounts({ amount: 0, retentionAmount: 0, taxPct: 0 });

  const number = input.number?.trim() || draftNumber(input.type);
  if (input.number?.trim()) {
    const clash = await prisma.projectLetter.findUnique({ where: { number } });
    if (clash) throw ApiError.conflict(`Nomor surat "${number}" sudah dipakai`);
  }

  // Jika penanda tangan dipilih dari daftar, auto-fill nama & jabatan.
  let signerName = input.signerName;
  let signerTitle = input.signerTitle;
  let signatoryId: string | null = null;
  if (input.signatoryId) {
    const signatory = await prisma.signatory.findUnique({ where: { id: input.signatoryId } });
    if (signatory) {
      signatoryId = signatory.id;
      signerName = signatory.name;
      signerTitle = signatory.title;
    }
  }

  const created = await prisma.projectLetter.create({
    data: {
      number,
      rabId: input.rabId,
      type: input.type,
      subject: input.subject,
      letterDate: parseDateOnly(input.letterDate),
      dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null,
      recipientName: input.recipientName,
      recipientCompany: input.recipientCompany ?? null,
      recipientAddress: input.recipientAddress ?? null,
      attentionTo: input.attentionTo ?? null,
      signerName,
      signerTitle,
      signatoryId,
      counterSignerName: input.counterSignerName ?? null,
      counterSignerTitle: input.counterSignerTitle ?? null,
      ...amounts,
      body: (input.body ?? {}) as unknown as Prisma.InputJsonValue,
      billingId: input.billingId ?? null,
      quotationId: input.quotationId ?? null,
      parentLetterId: input.parentLetterId ?? null,
      notes: input.notes ?? null,
      attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
      createdById: userId,
    },
    include,
  });

  return serialize(created);
}

/** Tautan ke termin, penawaran, dan surat induk harus berada di proyek yang sama. */
async function assertLinksBelongToRab(
  rabId: string,
  input: { billingId?: string | null; quotationId?: string | null; parentLetterId?: string | null }
) {
  if (input.billingId) {
    const billing = await prisma.progressBilling.findUnique({
      where: { id: input.billingId },
      select: { rabId: true },
    });
    if (!billing) throw ApiError.notFound("Termin tidak ditemukan");
    if (billing.rabId !== rabId) throw ApiError.badRequest("Termin bukan milik proyek ini");
  }

  if (input.quotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: input.quotationId },
      select: { rabId: true },
    });
    if (!quotation) throw ApiError.notFound("Penawaran tidak ditemukan");
    if (quotation.rabId !== rabId) throw ApiError.badRequest("Penawaran bukan milik proyek ini");
  }

  if (input.parentLetterId) {
    const parent = await prisma.projectLetter.findUnique({
      where: { id: input.parentLetterId },
      select: { rabId: true },
    });
    if (!parent) throw ApiError.notFound("Surat induk tidak ditemukan");
    if (parent.rabId !== rabId) throw ApiError.badRequest("Surat induk bukan milik proyek ini");
  }
}

export async function updateLetter(id: string, input: LetterUpdateInput) {
  const existing = await prisma.projectLetter.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Surat tidak ditemukan");

  if (existing.status !== "DRAFT") {
    throw ApiError.badRequest(
      "Surat yang sudah terbit tidak dapat diubah. Batalkan lalu terbitkan surat pengganti bila perlu."
    );
  }

  await assertLinksBelongToRab(existing.rabId, input);

  if (input.number && input.number.trim() !== existing.number) {
    const clash = await prisma.projectLetter.findUnique({ where: { number: input.number.trim() } });
    if (clash) throw ApiError.conflict(`Nomor surat "${input.number}" sudah dipakai`);
  }

  const amountChanged =
    input.amount !== undefined || input.retentionAmount !== undefined || input.taxPct !== undefined;
  const amounts = amountChanged
    ? computeAmounts({
        amount: input.amount ?? Number(existing.amount),
        retentionAmount: input.retentionAmount ?? Number(existing.retentionAmount),
        taxPct: input.taxPct ?? Number(existing.taxPct),
      })
    : null;

  const updated = await prisma.projectLetter.update({
    where: { id },
    data: {
      ...(input.number !== undefined ? { number: input.number?.trim() || existing.number } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.letterDate !== undefined ? { letterDate: parseDateOnly(input.letterDate) } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null } : {}),
      ...(input.recipientName !== undefined ? { recipientName: input.recipientName } : {}),
      ...(input.recipientCompany !== undefined ? { recipientCompany: input.recipientCompany ?? null } : {}),
      ...(input.recipientAddress !== undefined ? { recipientAddress: input.recipientAddress ?? null } : {}),
      ...(input.attentionTo !== undefined ? { attentionTo: input.attentionTo ?? null } : {}),
      ...(input.signerName !== undefined ? { signerName: input.signerName } : {}),
      ...(input.signerTitle !== undefined ? { signerTitle: input.signerTitle } : {}),
      ...(input.signatoryId !== undefined ? { signatoryId: input.signatoryId || null } : {}),
      ...(input.counterSignerName !== undefined ? { counterSignerName: input.counterSignerName ?? null } : {}),
      ...(input.counterSignerTitle !== undefined
        ? { counterSignerTitle: input.counterSignerTitle ?? null }
        : {}),
      ...(amounts ?? {}),
      ...(input.body !== undefined ? { body: (input.body ?? {}) as unknown as Prisma.InputJsonValue } : {}),
      ...(input.billingId !== undefined ? { billingId: input.billingId ?? null } : {}),
      ...(input.quotationId !== undefined ? { quotationId: input.quotationId ?? null } : {}),
      ...(input.parentLetterId !== undefined ? { parentLetterId: input.parentLetterId ?? null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
      ...(input.attachments !== undefined
        ? { attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue }
        : {}),
    },
    include,
  });

  // Sync signerName/signerTitle jika penanda tangan diganti.
  if (input.signatoryId !== undefined && input.signatoryId !== existing.signatoryId) {
    if (input.signatoryId) {
      const signatory = await prisma.signatory.findUnique({ where: { id: input.signatoryId } });
      if (signatory) {
        await prisma.projectLetter.update({
          where: { id },
          data: { signerName: signatory.name, signerTitle: signatory.title },
        });
      }
    }
  }

  return serialize(updated);
}

/**
 * Terbitkan surat: berikan nomor pasti dan bekukan angkanya.
 *
 * Nomor manual yang sudah diisi pemakai dihormati — beberapa perusahaan
 * memakai penomoran dari sistem lain — tapi nomor draf sementara selalu
 * diganti nomor sungguhan dari pencatat.
 */
export async function issueLetter(id: string) {
  const existing = await prisma.projectLetter.findUnique({
    where: { id },
    include: { billing: true },
  });
  if (!existing) throw ApiError.notFound("Surat tidak ditemukan");
  if (existing.status !== "DRAFT") throw ApiError.badRequest("Surat ini sudah terbit");

  const snapshot = {
    issuedFrom: existing.billingId ? "billing" : existing.quotationId ? "quotation" : "manual",
    billingNumber: existing.billing?.number ?? null,
    amount: existing.amount.toString(),
    retentionAmount: existing.retentionAmount.toString(),
    taxPct: existing.taxPct.toString(),
    taxAmount: existing.taxAmount.toString(),
    totalAmount: existing.totalAmount.toString(),
    amountInWords: existing.amountInWords,
    body: existing.body,
  };

  const issued = await prisma.$transaction(async (tx) => {
    const isTemporary = existing.number.startsWith("DRAFT-");
    const number = isTemporary
      ? await allocateDocumentNumber(SERIES_BY_TYPE[existing.type], tx)
      : existing.number;

    return tx.projectLetter.update({
      where: { id },
      data: {
        number,
        status: "ISSUED",
        issuedAt: new Date(),
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
      include,
    });
  });

  return serialize(issued);
}

export async function setLetterStatus(id: string, status: LetterStatus) {
  const existing = await prisma.projectLetter.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw ApiError.notFound("Surat tidak ditemukan");
  if (existing.status === status) return getLetter(id);

  if (status === "ISSUED") return issueLetter(id);

  if (!ALLOWED_TRANSITIONS[existing.status].includes(status)) {
    throw ApiError.badRequest(`Status surat tidak dapat berpindah dari ${existing.status} ke ${status}`);
  }

  const updated = await prisma.projectLetter.update({
    where: { id },
    data: {
      status,
      ...(status === "SIGNED" ? { signedAt: new Date() } : {}),
      ...(status === "PAID" ? { paidAt: new Date() } : {}),
    },
    include,
  });
  return serialize(updated);
}

export async function deleteLetter(id: string) {
  const existing = await prisma.projectLetter.findUnique({
    where: { id },
    select: { status: true, _count: { select: { childLetters: true } } },
  });
  if (!existing) throw ApiError.notFound("Surat tidak ditemukan");
  if (existing.status !== "DRAFT") {
    throw ApiError.badRequest(
      "Surat yang sudah terbit tidak dapat dihapus — batalkan saja agar nomornya tetap tercatat"
    );
  }
  if (existing._count.childLetters > 0) {
    throw ApiError.badRequest("Surat ini menjadi induk surat lain — hapus surat turunannya lebih dulu");
  }
  await prisma.projectLetter.delete({ where: { id } });
}

// --- Isi awal otomatis -------------------------------------------------------

/**
 * Isi awal formulir surat, ditarik dari data yang sudah ada di sistem.
 *
 * Inilah bagian "otomatis via input data" pada alur dokumen: invoice tidak
 * diketik ulang dari berita acara termin, dan kwitansi tidak diketik ulang dari
 * invoice. Setiap pengetikan ulang adalah kesempatan angka berselisih antar
 * dokumen yang seharusnya menyebut jumlah yang sama.
 */
export async function getLetterDefaults(rabId: string, type: LetterType, billingId?: string) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    select: {
      id: true,
      number: true,
      title: true,
      clientName: true,
      location: true,
      total: true,
      taxPct: true,
    },
  });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const today = isoDate(todayInProjectZone());
  const base = {
    rabId,
    type,
    letterDate: today,
    recipientName: rab.clientName ?? "",
    recipientCompany: rab.clientName ?? "",
    signerName: "",
    signerTitle: "Direktur",
    attentionTo: null as string | null,
  };

  if (type === "INVOICE" || type === "KWITANSI") {
    return { rab, defaults: await billingLetterDefaults(rab, type, base, billingId) };
  }
  if (type === "SPK") return { rab, defaults: await spkDefaults(rab, base) };
  return { rab, defaults: await beritaAcaraDefaults(rab, type, base) };
}

type BaseDefaults = {
  rabId: string;
  type: LetterType;
  letterDate: string;
  recipientName: string;
  recipientCompany: string;
  signerName: string;
  signerTitle: string;
  attentionTo: string | null;
};

type RabSummary = {
  id: string;
  number: string;
  title: string;
  clientName: string | null;
  location: string | null;
  total: Prisma.Decimal;
  taxPct: Prisma.Decimal;
};

async function billingLetterDefaults(
  rab: RabSummary,
  type: LetterType,
  base: BaseDefaults,
  billingId?: string
) {
  // Tanpa termin yang ditunjuk, ambil termin terbit terbaru — itu yang hampir
  // selalu dimaksud saat orang menekan "buat invoice".
  const billing = billingId
    ? await prisma.progressBilling.findUnique({ where: { id: billingId } })
    : await prisma.progressBilling.findFirst({
        where: { rabId: rab.id, status: { in: ["ISSUED", "PAID"] } },
        orderBy: { periodEnd: "desc" },
      });

  if (billing && billing.rabId !== rab.id) {
    throw ApiError.badRequest("Termin bukan milik proyek ini");
  }

  if (!billing) {
    return {
      ...base,
      subject: `${LETTER_LABEL[type]} — ${rab.title}`,
      amount: 0,
      retentionAmount: 0,
      taxPct: Number(rab.taxPct),
      dueDate: isoDate(addDays(todayInProjectZone(), 14)),
      billingId: null,
      body: {
        opening:
          "Bersama ini kami sampaikan tagihan atas pekerjaan yang telah dilaksanakan sesuai kontrak.",
        lines: [],
        fields: { "Pekerjaan": rab.title, "Lokasi": rab.location ?? "-" },
      } satisfies LetterBody,
    };
  }

  const snapshot = billing.snapshot as { lines?: { description: string; value: string }[] } | null;

  return {
    ...base,
    subject: `${LETTER_LABEL[type]} ${billing.number} — ${rab.title}`,
    /// Nilai termin sebelum retensi dan pajak; keduanya dihitung ulang di sini
    /// supaya rantai hitungnya sama persis dengan berita acaranya.
    amount: Number(billing.currentValue),
    retentionAmount: Number(billing.retentionAmount),
    taxPct: Number(billing.taxPct),
    dueDate: isoDate(addDays(todayInProjectZone(), 14)),
    billingId: billing.id,
    body: {
      opening:
        type === "INVOICE"
          ? `Bersama ini kami sampaikan tagihan termin sesuai Berita Acara ${billing.number} untuk pekerjaan ${rab.title}.`
          : `Telah diterima dari ${rab.clientName ?? "pemilik proyek"} pembayaran termin sesuai Berita Acara ${billing.number}.`,
      lines: (snapshot?.lines ?? []).slice(0, 100).map((line) => ({
        description: line.description,
        amount: Number(line.value),
      })),
      fields: {
        "Berita Acara": billing.number,
        "Periode s/d": isoDate(startOfUtcDay(billing.periodEnd)),
        "Pekerjaan": rab.title,
        "Lokasi": rab.location ?? "-",
      },
    } satisfies LetterBody,
  };
}

async function spkDefaults(rab: RabSummary, base: BaseDefaults) {
  // SPK lahir dari penawaran yang sudah diterima klien; kalau ada, nilainya
  // yang dipakai — bukan nilai RAB yang mungkin sudah bergerak sesudahnya.
  const quotation = await prisma.quotation.findFirst({
    where: { rabId: rab.id, status: "ACCEPTED" },
    orderBy: { decidedAt: "desc" },
    select: { id: true, number: true, total: true, paymentTerms: true, signerName: true, signerTitle: true },
  });

  const amount = quotation ? Number(quotation.total) : Number(rab.total);
  const terms = (quotation?.paymentTerms as { label: string; percent: number }[] | null) ?? [];

  return {
    ...base,
    subject: `Surat Perjanjian Kerja — ${rab.title}`,
    signerName: quotation?.signerName ?? base.signerName,
    signerTitle: quotation?.signerTitle ?? base.signerTitle,
    counterSignerName: rab.clientName ?? "",
    counterSignerTitle: "Pemilik Proyek",
    amount,
    retentionAmount: 0,
    taxPct: 0,
    quotationId: quotation?.id ?? null,
    dueDate: null,
    body: {
      opening: `Pada hari ini disepakati Surat Perjanjian Kerja untuk pelaksanaan pekerjaan ${rab.title}${
        rab.location ? ` yang berlokasi di ${rab.location}` : ""
      }.`,
      clauses: [
        {
          title: "Pasal 1 — Lingkup Pekerjaan",
          text: `Pihak Kedua melaksanakan pekerjaan ${rab.title} sesuai rincian ${
            quotation ? `Surat Penawaran ${quotation.number}` : `RAB ${rab.number}`
          } yang menjadi bagian tidak terpisahkan dari perjanjian ini.`,
        },
        {
          title: "Pasal 2 — Nilai Pekerjaan",
          text: `Nilai pekerjaan disepakati sebesar Rp ${money(amount).toFixed(2)} (${terbilang(amount)}).`,
        },
        {
          title: "Pasal 3 — Jangka Waktu",
          text: "Jangka waktu pelaksanaan mengikuti jadwal yang disepakati kedua belah pihak, terhitung sejak surat ini ditandatangani.",
        },
        {
          title: "Pasal 4 — Cara Pembayaran",
          text:
            terms.length > 0
              ? terms.map((t, i) => `${i + 1}. ${t.label} sebesar ${t.percent}%.`).join("\n")
              : "Pembayaran dilakukan bertahap sesuai kemajuan pekerjaan yang dituangkan dalam berita acara.",
        },
        {
          title: "Pasal 5 — Penyelesaian Perselisihan",
          text: "Perselisihan diselesaikan secara musyawarah; bila tidak tercapai, diselesaikan melalui jalur hukum yang berlaku.",
        },
      ],
      fields: { "Pekerjaan": rab.title, "Lokasi": rab.location ?? "-", "Acuan": quotation?.number ?? rab.number },
    } satisfies LetterBody,
  };
}

async function beritaAcaraDefaults(rab: RabSummary, type: LetterType, base: BaseDefaults) {
  // Berita acara menyebut pekerjaan apa saja yang dinyatakan selesai, jadi
  // daftarnya diambil dari opname yang sudah disetujui — bukan diketik ulang.
  const schedule = await getRabSchedule(rab.id);
  const completed = schedule.items.filter((i) => Number(i.progressPct) >= 100);
  const overall = schedule.buckets.at(-1)?.actualPct ?? "0";

  const parentBapp =
    type === "BAST"
      ? await prisma.projectLetter.findFirst({
          where: { rabId: rab.id, type: "BAPP", status: { in: ["ISSUED", "SIGNED"] } },
          orderBy: { letterDate: "desc" },
          select: { id: true, number: true },
        })
      : null;

  return {
    ...base,
    subject: `${LETTER_LABEL[type]} — ${rab.title}`,
    counterSignerName: rab.clientName ?? "",
    counterSignerTitle: "Pemilik Proyek",
    amount: 0,
    retentionAmount: 0,
    taxPct: 0,
    dueDate: null,
    parentLetterId: parentBapp?.id ?? null,
    body: {
      opening:
        type === "BAPP"
          ? `Pada hari ini dilakukan pemeriksaan atas pekerjaan ${rab.title} dan dinyatakan telah selesai dilaksanakan sesuai gambar kerja dan spesifikasi teknis.`
          : `Pada hari ini dilakukan serah terima pekerjaan ${rab.title} dari Pihak Pertama kepada Pihak Kedua${
              parentBapp ? `, berdasarkan ${parentBapp.number}` : ""
            }.`,
      clauses: completed.slice(0, 50).map((item) => ({
        title: item.description,
        text: `${item.volume} ${item.unit} — realisasi ${item.progressPct}%`,
      })),
      closing:
        type === "BAST"
          ? "Sejak ditandatanganinya berita acara ini, masa pemeliharaan pekerjaan dimulai sesuai ketentuan kontrak."
          : "Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.",
      fields: {
        "Pekerjaan": rab.title,
        "Lokasi": rab.location ?? "-",
        "Progres keseluruhan": `${overall}%`,
        "Pekerjaan selesai": `${completed.length} dari ${schedule.items.length} item`,
      },
    } satisfies LetterBody,
  };
}
