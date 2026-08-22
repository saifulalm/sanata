import { Prisma, type MemoCategory, type MemoDirection, type MemoStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { daysBetween, isoDate, parseDateOnly, startOfUtcDay, todayInProjectZone } from "@/utils/date";
import { allocateDocumentNumber } from "@/services/documentNumber.service";
import type { MemoInput, MemoUpdateInput } from "@/validators/projectDoc.validator";

/**
 * Site memo — surat masuk dari klien dan surat keluar dari kontraktor.
 *
 * Nilai modul ini bukan pada penyimpanan suratnya, melainkan pada kaitannya.
 * Komplain yang masuk tanpa balasan adalah risiko; komplain yang dibalas
 * setelah lewat tenggat adalah bukti yang dipakai melawan kontraktor. Karena
 * itu balasan menunjuk surat yang dijawabnya, tunggakan dihitung dari tanggal
 * tenggat, dan surat masuk berpindah sendiri ke status "sudah dijawab" begitu
 * balasannya dibuat — status yang harus diingat orang untuk diubah manual
 * adalah status yang tidak akan pernah benar.
 */

const include = {
  createdBy: { select: { id: true, name: true } },
  rab: { select: { id: true, number: true, title: true, clientName: true } },
  parent: { select: { id: true, number: true, subject: true, letterDate: true } },
  replies: {
    select: { id: true, number: true, subject: true, letterDate: true, direction: true },
    orderBy: { letterDate: "asc" },
  },
} as const;

type MemoRow = Prisma.SiteMemoGetPayload<{ include: typeof include }>;

function serialize(row: MemoRow) {
  const today = todayInProjectZone();
  const due = row.dueDate ? startOfUtcDay(row.dueDate) : null;
  const isOpen = row.status === "OPEN" || row.status === "IN_PROGRESS";

  return {
    id: row.id,
    number: row.number,
    rabId: row.rabId,
    rab: row.rab,
    direction: row.direction,
    category: row.category,
    status: row.status,
    subject: row.subject,
    body: row.body,
    fromParty: row.fromParty,
    toParty: row.toParty,
    letterDate: isoDate(startOfUtcDay(row.letterDate)),
    handledAt: row.handledAt ? isoDate(startOfUtcDay(row.handledAt)) : null,
    dueDate: due ? isoDate(due) : null,
    closedAt: row.closedAt?.toISOString() ?? null,
    /// Negatif berarti masih ada sisa waktu, positif berarti sudah lewat.
    daysOverdue: due && isOpen ? Math.max(0, daysBetween(due, today)) : 0,
    isOverdue: Boolean(due && isOpen && daysBetween(due, today) > 0),
    parentId: row.parentId,
    parent: row.parent
      ? {
          id: row.parent.id,
          number: row.parent.number,
          subject: row.parent.subject,
          letterDate: isoDate(startOfUtcDay(row.parent.letterDate)),
        }
      : null,
    replies: row.replies.map((r) => ({
      id: r.id,
      number: r.number,
      subject: r.subject,
      direction: r.direction,
      letterDate: isoDate(startOfUtcDay(r.letterDate)),
    })),
    attachments: (row.attachments as { url: string; name: string }[] | null) ?? [],
    createdByName: row.createdBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type SiteMemo = ReturnType<typeof serialize>;

export async function listMemos(
  rabId: string,
  query: { direction?: string; status?: string; category?: string; search?: string } = {}
) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    select: { id: true, number: true, title: true, clientName: true },
  });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  const rows = await prisma.siteMemo.findMany({
    where: {
      rabId,
      ...(query.direction ? { direction: query.direction as MemoDirection } : {}),
      ...(query.status ? { status: query.status as MemoStatus } : {}),
      ...(query.category ? { category: query.category as MemoCategory } : {}),
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search, mode: "insensitive" } },
              { subject: { contains: query.search, mode: "insensitive" } },
              { fromParty: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ letterDate: "desc" }, { createdAt: "desc" }],
    include,
  });

  const memos = rows.map(serialize);

  return {
    rab,
    memos,
    summary: {
      incoming: memos.filter((m) => m.direction === "INCOMING").length,
      outgoing: memos.filter((m) => m.direction === "OUTGOING").length,
      open: memos.filter((m) => m.status === "OPEN" || m.status === "IN_PROGRESS").length,
      overdue: memos.filter((m) => m.isOverdue).length,
    },
  };
}

export async function getMemo(id: string) {
  const row = await prisma.siteMemo.findUnique({ where: { id }, include });
  if (!row) throw ApiError.notFound("Site memo tidak ditemukan");
  return serialize(row);
}

/**
 * Surat masuk lahir dengan status terbuka; surat keluar sudah selesai begitu
 * dikirim, jadi tidak perlu menunggu ditutup manual.
 */
function initialStatus(direction: MemoDirection): MemoStatus {
  return direction === "INCOMING" ? "OPEN" : "CLOSED";
}

export async function createMemo(input: MemoInput, userId: string) {
  const rab = await prisma.rab.findUnique({ where: { id: input.rabId }, select: { id: true } });
  if (!rab) throw ApiError.notFound("Proyek/RAB tidak ditemukan");

  if (input.parentId) {
    const parent = await prisma.siteMemo.findUnique({
      where: { id: input.parentId },
      select: { id: true, rabId: true, direction: true },
    });
    if (!parent) throw ApiError.notFound("Surat yang dibalas tidak ditemukan");
    if (parent.rabId !== input.rabId) {
      throw ApiError.badRequest("Balasan harus berada pada proyek yang sama dengan surat aslinya");
    }
    if (parent.direction === input.direction) {
      // Utas surat selalu berselang-seling; dua surat masuk berturut-turut
      // bukan balasan, melainkan dua perkara yang berbeda.
      throw ApiError.badRequest("Balasan harus berlawanan arah dengan surat yang dijawab");
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const series = input.direction === "INCOMING" ? "MEMO_IN" : "MEMO_OUT";
    const number = input.number?.trim() || (await allocateDocumentNumber(series, tx));

    if (input.number?.trim()) {
      const clash = await tx.siteMemo.findUnique({ where: { number } });
      if (clash) throw ApiError.conflict(`Nomor surat "${number}" sudah dipakai`);
    }

    const memo = await tx.siteMemo.create({
      data: {
        number,
        rabId: input.rabId,
        direction: input.direction,
        category: (input.category ?? "LAINNYA") as MemoCategory,
        status: initialStatus(input.direction),
        subject: input.subject,
        body: input.body,
        fromParty: input.fromParty,
        toParty: input.toParty,
        letterDate: parseDateOnly(input.letterDate),
        handledAt: input.handledAt ? parseDateOnly(input.handledAt) : null,
        dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null,
        closedAt: input.direction === "OUTGOING" ? new Date() : null,
        parentId: input.parentId ?? null,
        attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
        createdById: userId,
      },
      include,
    });

    // Membuat balasan otomatis menandai surat masuknya sudah dijawab. Meminta
    // pemakai mengubah status surat lama secara terpisah hanya menghasilkan
    // daftar tunggakan yang tidak pernah benar.
    if (input.parentId && input.direction === "OUTGOING") {
      await tx.siteMemo.update({
        where: { id: input.parentId },
        data: { status: "ANSWERED", closedAt: new Date() },
      });
    }

    return memo;
  });

  return serialize(created);
}

export async function updateMemo(id: string, input: MemoUpdateInput) {
  const existing = await prisma.siteMemo.findUnique({ where: { id }, select: { id: true, number: true } });
  if (!existing) throw ApiError.notFound("Site memo tidak ditemukan");

  if (input.number && input.number.trim() !== existing.number) {
    const clash = await prisma.siteMemo.findUnique({ where: { number: input.number.trim() } });
    if (clash) throw ApiError.conflict(`Nomor surat "${input.number}" sudah dipakai`);
  }

  const updated = await prisma.siteMemo.update({
    where: { id },
    data: {
      ...(input.number !== undefined ? { number: input.number?.trim() || existing.number } : {}),
      ...(input.category !== undefined ? { category: input.category as MemoCategory } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.fromParty !== undefined ? { fromParty: input.fromParty } : {}),
      ...(input.toParty !== undefined ? { toParty: input.toParty } : {}),
      ...(input.letterDate !== undefined ? { letterDate: parseDateOnly(input.letterDate) } : {}),
      ...(input.handledAt !== undefined
        ? { handledAt: input.handledAt ? parseDateOnly(input.handledAt) : null }
        : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null } : {}),
      ...(input.attachments !== undefined
        ? { attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue }
        : {}),
    },
    include,
  });
  return serialize(updated);
}

export async function setMemoStatus(id: string, status: MemoStatus) {
  const existing = await prisma.siteMemo.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Site memo tidak ditemukan");

  const updated = await prisma.siteMemo.update({
    where: { id },
    data: {
      status,
      closedAt: status === "CLOSED" || status === "ANSWERED" ? new Date() : null,
    },
    include,
  });
  return serialize(updated);
}

export async function deleteMemo(id: string) {
  const existing = await prisma.siteMemo.findUnique({
    where: { id },
    select: { id: true, _count: { select: { replies: true } } },
  });
  if (!existing) throw ApiError.notFound("Site memo tidak ditemukan");
  if (existing._count.replies > 0) {
    throw ApiError.badRequest("Surat ini sudah punya balasan — hapus balasannya lebih dulu");
  }
  await prisma.siteMemo.delete({ where: { id } });
}

/**
 * Nilai bawaan formulir "balas surat ini".
 *
 * Balasan mewarisi perkara dari surat aslinya: pengirim dan penerima bertukar
 * tempat, perihal diberi awalan "Tanggapan atas". Mengetik ulang semua itu
 * hanya membuka peluang balasan nyasar ke pihak yang salah.
 */
export async function getReplyDefaults(parentId: string) {
  const parent = await prisma.siteMemo.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      rabId: true,
      number: true,
      subject: true,
      direction: true,
      fromParty: true,
      toParty: true,
      category: true,
    },
  });
  if (!parent) throw ApiError.notFound("Surat yang dibalas tidak ditemukan");

  return {
    parent: { id: parent.id, number: parent.number, subject: parent.subject },
    defaults: {
      rabId: parent.rabId,
      direction: parent.direction === "INCOMING" ? ("OUTGOING" as const) : ("INCOMING" as const),
      category: parent.category === "KOMPLAIN" ? ("APPROVAL" as const) : parent.category,
      subject: `Tanggapan atas ${parent.number} — ${parent.subject}`,
      fromParty: parent.toParty,
      toParty: parent.fromParty,
      letterDate: isoDate(todayInProjectZone()),
      body: `Menanggapi surat Bapak/Ibu nomor ${parent.number} perihal ${parent.subject}, bersama ini kami sampaikan hal-hal sebagai berikut:\n\n1. `,
      parentId: parent.id,
    },
  };
}
