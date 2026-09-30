"use strict";
const xlsx = require("./backend/node_modules/xlsx");
const fs = require("fs");

const wb = xlsx.readFile(
  "C:/Users/Saiful/AppData/Local/hermes/attachments/1_RAB_FINAL_v3-Rumah Tahfiz.xlsx",
  { cellDates: true }
);

const wsBoq   = wb.Sheets["BOQ"];
const wsRekap  = wb.Sheets["REKAP (Final Harga Kontrak)"];

const rawBoq   = xlsx.utils.sheet_to_json(wsBoq,  { header: 1, defval: null, raw: true });
const rawRekap  = xlsx.utils.sheet_to_json(wsRekap, { header: 1, defval: null, raw: true });

const ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
const SEC_NAMES = {
  I:   "PEKERJAAN PERSIAPAN",
  II:  "PEKERJAAN TANAH + PONDASI",
  III: "PEKERJAAN BETON",
  IV:  "PEKERJAAN STRUKTUR BAJA",
  V:   "PEKERJAAN PASANGAN DINDING, LANTAI, PLESTERAN DAN ACIAN",
  VI:  "PEKERJAAN M & E",
  VII: "PEKERJAAN SANITAIR",
  VIII:"PEKERJAAN ATAP",
  IX:  "PEKERJAAN CARPORT",
  X:   "PEKERJAAN LAIN-LAIN",
};

// ── REKAP (Final) ──────────────────────────────────────────────────────────
let grandTotal = 0;
let projectName = "RUMAH Qur'an Az'Zakir";
let clientName = "PT. Cipta Karya Serasi";
let location  = "Cibinong, Bogor";

rawRekap.forEach(row => {
  if (!row) return;
  const d = row[3];
  if (!d) return;
  const s = String(d).trim();
  if (s.startsWith("RUMAH") || s.includes("Qur")) { projectName = s; }
  else if (s.includes("PT.") || s.includes("CV.")) { clientName = s; }
  else if (s === "DIBULATKAN" && typeof row[4] === "number") { grandTotal = row[4]; }
});

// ── BOQ items ─────────────────────────────────────────────────────────────
const sectionsMap  = {};
const romanOrder  = {};
ROMANS.forEach(r => { sectionsMap[r] = []; });

let currentRoman = null;
let ord = 0;

for (let ri = 8; ri < rawBoq.length; ri++) {
  const row = rawBoq[ri];
  if (!row) continue;

  const a = String(row[0] || "").trim();       // col A
  const b = String(row[1] || "").trim();       // col B
  if (!a && !b) continue;
  if (a === "NO") continue;

  const aUp = a.toUpperCase();
  const bUp = b.toUpperCase();

  // ── Section header: Roman in col A, PEKERJAAN in col B ──
  if (ROMANS.includes(aUp) && bUp.includes("PEKERJAAN")) {
    currentRoman = aUp;
    if (romanOrder[currentRoman] === undefined) {
      romanOrder[currentRoman] = ord++;
    }
    continue;
  }

  // ── Item row: numeric in col A ──
  const numRe = /^\d+(\.\d+)?$/;
  const isNumItem = numRe.test(a);

  // ── Item row: col A empty, col L amount > 0 ──
  const hasAmt = typeof row[11] === "number" && row[11] > 0;
  const isAmtRow = !a && hasAmt;

  if (!isNumItem && !isAmtRow) continue;

  const jml = row[11];
  if (typeof jml !== "number" || jml <= 0) continue;

  const vol    = typeof row[4] === "number" ? row[4] : null;
  const sat    = typeof row[5] === "string" ? row[5] : "ls";
  const price  = vol && vol > 0 ? jml / vol : jml;

  const desc = a
    ? a + ". " + b
    : (sectionsMap[currentRoman].length + 1) + ". " + b;

  sectionsMap[currentRoman].push({
    order:        sectionsMap[currentRoman].length,
    description: desc.trim(),
    unit:        sat,
    volume:      vol || 1,
    unitPrice:   Math.round(price * 100) / 100,
    amount:       Math.round(jml * 100) / 100,
    startOffsetDays: 0,
    durationDays:   30,
  });
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log("Project :", projectName);
console.log("Client  :", clientName);
console.log("Location :", location);
console.log("Grand Total (DIBULATKAN): Rp", grandTotal.toLocaleString("id-ID"));
console.log();

let totalItems  = 0;
let totalAmount = 0;
ROMANS.forEach(r => {
  const items  = sectionsMap[r] || [];
  const secAmt = items.reduce((s, i) => s + i.amount, 0);
  totalItems  += items.length;
  totalAmount += secAmt;
  if (items.length > 0) {
    console.log("Section", r + ":", items.length, "items, Rp", secAmt.toLocaleString("id-ID"));
  }
});
console.log();
console.log("Total items :", totalItems);
console.log("Total amount: Rp", totalAmount.toLocaleString("id-ID"));
console.log("Grand Total : Rp", grandTotal.toLocaleString("id-ID"));
console.log("Difference : Rp", Math.abs(totalAmount - grandTotal).toLocaleString("id-ID"));

// ── Build payload ───────────────────────────────────────────────────────
const sectionsPayload = ROMANS
  .filter(r => romanOrder[r] !== undefined)
  .sort((a, b) => romanOrder[a] - romanOrder[b])
  .map(r => ({
    order: romanOrder[r],
    name: r + ". " + (SEC_NAMES[r] || r),
    items: sectionsMap[r] || [],
  }));

const payload = {
  rab: {
    number:       "TAHFIZ-2025-001",
    title:        projectName,
    clientName:   clientName,
    location:     location,
    projectDate:   "2024-01-01",
    scheduleStart:"2024-07-24",
    restDays:     [0],
    notes:        "Imported from 1_RAB_FINAL_v3-Rumah Tahfiz.xlsx | " + totalItems + " items | Rp " + totalAmount.toLocaleString("id-ID"),
  },
  sections: sectionsPayload,
};

fs.writeFileSync("tahfiz_import_payload.json", JSON.stringify(payload, null, 2));
console.log("\nSaved: tahfiz_import_payload.json");
console.log("Sections:", sectionsPayload.length, "| Items:", totalItems);
