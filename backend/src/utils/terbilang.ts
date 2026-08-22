import { Prisma } from "@prisma/client";
import type { DecimalLike } from "@/utils/money";

/**
 * Angka rupiah menjadi kata.
 *
 * Kwitansi Indonesia selalu memuat nilai dalam huruf di samping angkanya, dan
 * bila keduanya berselisih yang berlaku adalah hurufnya. Karena itu terbilang
 * dihitung sekali lalu dibekukan bersama angkanya saat surat terbit, bukan
 * dirender ulang setiap kali surat dibuka.
 *
 * Kaidah yang membuat bahasa Indonesia tidak bisa memakai pembangkit angka
 * generik: satuan 1 di posisi ratusan dan ribuan menjadi "seratus"/"seribu",
 * bukan "satu ratus"/"satu ribu" — tetapi "satu juta" tetap "satu juta".
 */

const UNITS = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

/** Kelipatan seribu, dari yang terkecil. */
const SCALES = ["", "ribu", "juta", "miliar", "triliun"];

function belowThousand(n: number): string {
  if (n < 12) return UNITS[n];
  if (n < 20) return `${UNITS[n - 10]} belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${UNITS[tens]} puluh${rest ? ` ${UNITS[rest]}` : ""}`;
  }

  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  // "seratus", bukan "satu ratus".
  const head = hundreds === 1 ? "seratus" : `${UNITS[hundreds]} ratus`;
  return `${head}${rest ? ` ${belowThousand(rest)}` : ""}`;
}

function integerToWords(value: bigint): string {
  if (value === 0n) return "nol";

  // Dipecah per tiga digit dari belakang, satu kelompok per satuan skala.
  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0n) {
    groups.push(Number(remaining % 1000n));
    remaining /= 1000n;
  }

  if (groups.length > SCALES.length) {
    // Di luar triliun angka rupiah sudah tidak masuk akal untuk satu kwitansi;
    // mengembalikan angkanya apa adanya lebih jujur daripada kata yang salah.
    return value.toString();
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const group = groups[i];
    if (group === 0) continue;
    // "seribu", bukan "satu ribu" — hanya berlaku untuk ribuan.
    const head = group === 1 && i === 1 ? "seribu" : `${belowThousand(group)} ${SCALES[i]}`;
    parts.push(head.trim());
  }

  return parts.join(" ");
}

/**
 * "1250000" → "satu juta dua ratus lima puluh ribu rupiah".
 *
 * Sen ditulis sebagai "koma sekian" hanya bila memang ada; hampir semua nilai
 * kontrak bulat rupiah dan menambahkan "nol sen" pada tiap kwitansi hanya
 * membuatnya sulit dibaca.
 */
export function terbilang(value: DecimalLike): string {
  const decimal = new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const negative = decimal.isNegative();
  const absolute = decimal.abs();

  const rupiah = BigInt(absolute.floor().toFixed(0));
  const cents = Number(absolute.minus(absolute.floor()).mul(100).toFixed(0));

  const words = [
    negative ? "minus" : "",
    integerToWords(rupiah),
    "rupiah",
    cents > 0 ? `${belowThousand(cents)} sen` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Kwitansi memakai huruf kapital di awal kalimat terbilang.
  return words.charAt(0).toUpperCase() + words.slice(1);
}
