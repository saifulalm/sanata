import { Prisma } from "@prisma/client";

export type DecimalLike = Prisma.Decimal | string | number;

/** Uang selalu dibulatkan ke 2 desimal, setengah ke atas (konvensi RAB). */
export const MONEY_DP = 2;

export function toDecimal(value: DecimalLike): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

/** Bulatkan ke rupiah dengan 2 desimal — dipakai untuk setiap nilai uang yang disimpan. */
export function money(value: DecimalLike): Prisma.Decimal {
  return toDecimal(value).toDecimalPlaces(MONEY_DP, Prisma.Decimal.ROUND_HALF_UP);
}

export function sum(values: DecimalLike[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>((acc, v) => acc.plus(toDecimal(v)), new Prisma.Decimal(0));
}

/** Ambil `pct` persen dari `value`, dibulatkan sebagai uang. */
export function percentOf(value: DecimalLike, pct: DecimalLike): Prisma.Decimal {
  return money(toDecimal(value).mul(toDecimal(pct)).div(100));
}
