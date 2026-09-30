/**
 * Parse TAHFIZ RAB Excel and generate import payload.
 * Run: node parse_tahfiz.js
 */
const xlsx = require('./backend/node_modules/xlsx');
const fs = require('fs');

const path = "C:/Users/Saiful/AppData/Local/hermes/attachments/1_RAB_FINAL_v3-Rumah Tahfiz.xlsx";
const wb = xlsx.readFile(path, {cellDates: true});

// ============================================================
// 1. REKAP (Final) — project info + section totals
// ============================================================
const wsRekap = wb.Sheets["REKAP (Final Harga Kontrak)"];
const rekap = xlsx.utils.sheet_to_json(wsRekap, {header: 1, defval: null, raw: false});

let grandTotal = 0;
let projectName = "RUMAH Qur'an Az'Zakir";
let clientName = "PT. Cipta Karya Serasi";
let location = "Cibinong, Bogor";

rekap.forEach(row => {
  if (!row || row.length === 0) return;
  const d = row[3]; // column D
  if (!d) return;
  const s = String(d).trim();
  if (s.startsWith("RUMAH") || s.includes("Qur'an")) {
    projectName = s;
  } else if (s.includes("PT.") || s.includes("CV.")) {
    clientName = s;
  } else if (s === "DIBULATKAN" && row[4]) {
    grandTotal = Number(row[4]) || 0;
  } else if (s === "JUMLAH I" && row[4]) {
    // Subtotal, skip
  }
});

// ============================================================
// 2. BOQ items
// Column layout (0-indexed):
// 0=NO, 1=URAIAN, 4=VOLUME, 5=SAT,
// 9=JmlMaterial, 10=JmlUpah, 11=JmlTotal
// ============================================================
const wsBoq = wb.Sheets["BOQ"];
const boq = xlsx.utils.sheet_to_json(wsBoq, {header: 1, defval: null, raw: false});

const romanList = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
const sectionNames = {
  I:   "PEKERJAAN PERSIAPAN",
  II:  "PEKERJAAN TANAH + PONDASI",
  III: "PEKERJAAN BETON",
  IV:  "PEKERJAAN STRUKTUR BAJA",
  V:   "PEKERJAAN PASANGAN DINDING, LANTAI, PLESTERAN DAN ACIAN",
  VI:  "PEKERJAAN M & E",
  VII: "PEKERJAAN SANITAIR",
  VIII: "PEKERJAAN ATAP",
  IX:  "PEKERJAAN CARPORT",
  X:   "PEKERJAAN LAIN-LAIN",
};

const sectionsMap = {};
romanList.forEach(r => { sectionsMap[r] = []; });

const romanToOrder = {};
let currentRoman = null;
let orderCounter = 0;

for (let ri = 8; ri < boq.length; ri++) {
  const row = boq[ri];
  if (!row) continue;

  const a = String(row[0] || "").trim();
  const b = String(row[1] || "").trim();

  if (!a && !b) continue;
  if (a === "NO") continue;

  // Valid section: Roman numeral + "PEKERJAAN" in col B (skip LANTAI rows)
  const isRoman = romanList.includes(a.toUpperCase());
  const hasPekerjaan = b.toUpperCase().includes("PEKERJAAN");
  const isLantai = b.toUpperCase().includes("LANTAI");
  const isHeader = isRoman && hasPekerjaan && !isLantai;

  if (isHeader) {
    currentRoman = a.toUpperCase();
    if (!romanToOrder[currentRoman]) {
      romanToOrder[currentRoman] = orderCounter++;
    }
    continue;
  }

  if (isLantai) continue;

  // Data row: col A is numeric, OR (col A empty + col B is description)
  const isNumRow = /^\d+(\.\d+)?$/.test(a);
  const isDescRow = !a && b.length > 3 && /^[A-Z]/.test(b) &&
    !b.toUpperCase().includes("PEKERJAAN") &&
    !b.toUpperCase().includes("LANTAI");

  if (!isNumRow && !isDescRow) continue;

  const volRaw = row[4];
  const sat = String(row[5] || "ls");
  const jmlTotal = Number(row[11]) || 0;

  if (jmlTotal <= 0) continue;

  const vol = (typeof volRaw === "number" && isFinite(volRaw)) ? Math.round(volRaw * 1e6) / 1e6 : 1;
  const unitPrice = (vol && vol > 0) ? Math.round((jmlTotal / vol) * 100) / 100 : jmlTotal;

  let desc;
  if (isNumRow) {
    desc = a + ". " + b;
  } else {
    const itemCount = sectionsMap[currentRoman] ? sectionsMap[currentRoman].length + 1 : 1;
    desc = itemCount + ". " + b;
  }
  desc = desc.trim();

  if (currentRoman && sectionsMap[currentRoman]) {
    sectionsMap[currentRoman].push({
      order: sectionsMap[currentRoman].length,
      description: desc,
      unit: sat,
      volume: vol || 1,
      unitPrice: unitPrice,
      amount: Math.round(jmlTotal * 100) / 100,
      startOffsetDays: 0,
      durationDays: 30,
    });
  }
}

// ============================================================
// 3. Summary
// ============================================================
console.log("Project:", projectName);
console.log("Client:", clientName);
console.log("Location:", location);
console.log("Grand Total (DIBULATKAN): Rp", grandTotal.toLocaleString("id-ID"));
console.log("");

let totalItems = 0;
let totalAmount = 0;
romanList.forEach(r => {
  const items = sectionsMap[r] || [];
  const secAmount = items.reduce((s, i) => s + i.amount, 0);
  totalItems += items.length;
  totalAmount += secAmount;
  if (items.length > 0 || r === "V" || r === "IX") {
    console.log("Section " + r + ": " + items.length + " items, Rp " + secAmount.toLocaleString("id-ID"));
  }
});
console.log("");
console.log("Total items:", totalItems);
console.log("Total amount: Rp", totalAmount.toLocaleString("id-ID"));

// Check section IX (CARPORT) items
console.log("");
console.log("Section IX CARPORT items:", sectionsMap["IX"] ? sectionsMap["IX"].length : 0);
if (sectionsMap["IX"] && sectionsMap["IX"].length > 0) {
  sectionsMap["IX"].slice(0, 3).forEach(i => console.log("  -", i.description, "| vol=", i.volume, "price=", i.unitPrice, "total=", i.amount));
}

// ============================================================
// 4. Build payload
// ============================================================
const sectionsPayload = romanList
  .filter(r => romanToOrder[r] !== undefined)
  .map(r => ({
    order: romanToOrder[r],
    name: r + ". " + sectionNames[r],
    items: sectionsMap[r] || [],
  }));

const payload = {
  rab: {
    number: "TAHFIZ-2025-001",
    title: projectName,
    clientName: clientName,
    location: location,
    projectDate: "2024-01-01",
    scheduleStart: "2024-07-24", // Schedule starts July 24, 2024
    restDays: [0],
    notes: "Imported from 1_RAB_FINAL_v3-Rumah Tahfiz.xlsx | Items: " + totalItems + " | Total: Rp " + totalAmount.toLocaleString("id-ID"),
  },
  sections: sectionsPayload,
};

fs.writeFileSync("tahfiz_import_payload.json", JSON.stringify(payload, null, 2));
console.log("");
console.log("Saved: tahfiz_import_payload.json");
console.log("Sections:", sectionsPayload.length, "| Items:", totalItems);
