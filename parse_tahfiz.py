"""
Parse TAHFIZ RAB Excel file and generate import payload.
"""
import openpyxl
import json

path = r"C:\Users\Saiful\AppData\Local\hermes\attachments\1_RAB_FINAL_v3-Rumah Tahfiz.xlsx"
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)

# ================================================================
# 1. Project info from REKAP (Final Harga Kontrak)
# ================================================================
ws_r = wb["REKAP (Final Harga Kontrak)"]
rekap_rows = list(ws_r.iter_rows(min_row=1, max_row=25, max_col=8, values_only=True))

project_name = "RUMAH Qur'an Az'Zakir"
client_name = "PT. Cipta Karya Serasi"
location = "Cibinong, Bogor"
grand_total = 0.0

for ri, row in enumerate(rekap_rows):
    for ci, cell in enumerate(row):
        if cell is None:
            continue
        s = str(cell).strip()
        if ci == 3:  # column D
            if s.startswith("RUMAH") or s.startswith("Qur"):
                project_name = s
            elif "PT." in s or "CV." in s:
                client_name = s
            elif s not in ["Final harga ", "PEKERJAAN", "OWNER", "LOKASI", "JUMLAH", "PPH 23 (2%)", "DIBULATKAN"]:
                if len(s) > 3 and not s.replace(".", "").replace("-", "").isalnum():
                    location = s
            # Grand total: last row with DIBULATKAN
            if "DIBULATKAN" in s and row[3] is not None:
                try:
                    grand_total = float(row[3])
                except (TypeError, ValueError):
                    pass

print("=== Project Info ===")
print(f"  Project: {project_name}")
print(f"  Client: {client_name}")
print(f"  Location: {location}")
print(f"  Grand Total: Rp {grand_total:,.0f}")

# ================================================================
# 2. Section summary from REKAP (Final)
# ================================================================
roman_list = ["I","II","III","IV","V","VI","VII","VIII","IX","X"]

section_names = {
    "I":   "PEKERJAAN PERSIAPAN",
    "II":  "PEKERJAAN TANAH + PONDASI",
    "III": "PEKERJAAN BETON",
    "IV":  "PEKERJAAN STRUKTUR BAJA",
    "V":   "PEKERJAAN PASANGAN DINDING, LANTAI, PLESTERAN DAN ACIAN",
    "VI":  "PEKERJAAN M & E",
    "VII": "PEKERJAAN SANITAIR",
    "VIII":"PEKERJAAN ATAP",
    "IX":  "PEKERJAAN CARPORT",
    "X":   "PEKERJAAN LAIN-LAIN",
}

roman_sections = {}
for row in rekap_rows:
    if row[0] and isinstance(row[0], str) and row[0].strip().upper() in roman_list:
        sec = row[0].strip().upper()
        amount = float(row[4]) if row[4] is not None else 0.0
        bobot = float(row[5]) if row[5] is not None else 0.0
        roman_sections[sec] = {"order": len(roman_sections), "amount": amount, "bobot": bobot}

print("\n=== Sections from REKAP ===")
for k, v in roman_sections.items():
    print(f"  {k}: {section_names.get(k,k)} | Rp {v['amount']:,.0f} | bobot={v['bobot']*100:.2f}%")

# ================================================================
# 3. Parse BOQ items
# Column layout (0-indexed):
# 0=NO, 1=URAIAN, 4=VOLUME, 5=SAT, 6=HrgMat, 7=HrgUpah,
# 8=Mat+Upah, 9=JmlMat, 10=JmlUpah, 11=JmlTotal, 12=K1, 13=K2, 14=K3
# ================================================================
ws_b = wb["BOQ"]
boq_rows = list(ws_b.iter_rows(min_row=1, max_row=181, max_col=15, values_only=True))

sections_map = {r: [] for r in roman_sections}
current_roman = None

for ri, row in enumerate(boq_rows):
    a = str(row[0] or "").strip()
    b = str(row[1] or "").strip()

    if ri < 8:  # skip header rows
        continue
    if not a and not b:
        continue
    if a == "NO" or b == "URAIAN PEKERJAAN":
        continue

    # Section header: Roman numeral in col A, skip LANTAI rows
    if a.upper() in roman_list:
        if "LANTAI" not in b.upper():
            current_roman = a.upper()
        continue

    # Data row: must have integer number in col A
    try:
        num_val = float(a)
        if num_val != int(num_val):
            continue
    except (ValueError, TypeError):
        continue

    vol = row[4] if len(row) > 4 else None
    sat = str(row[5]) if len(row) > 5 and row[5] is not None else "ls"
    jml_total = float(row[11]) if len(row) > 11 and row[11] is not None else 0.0

    if isinstance(vol, float):
        vol = round(vol, 6)

    if jml_total <= 0:
        continue

    unit_price = round(jml_total / float(vol), 2) if vol and float(vol) > 0 else 0.0

    desc = (a + ". " + b).strip() if a else b.strip()

    if current_roman and current_roman in sections_map:
        sections_map[current_roman].append({
            "order": len(sections_map[current_roman]),
            "description": desc,
            "unit": sat,
            "volume": float(vol) if vol else 1.0,
            "unitPrice": unit_price,
            "amount": round(jml_total, 2),
            "startOffsetDays": 0,
            "durationDays": 30
        })

print("\n=== Items parsed ===")
total_items = 0
for roman in roman_list:
    cnt = len(sections_map.get(roman, []))
    total_items += cnt
    print(f"  {roman}: {cnt} items")
print(f"  TOTAL: {total_items} items")

# ================================================================
# 4. Build import payload
# ================================================================
sections_payload = []
for roman in roman_list:
    if roman not in roman_sections:
        continue
    sec_items = sections_map.get(roman, [])
    sections_payload.append({
        "order": roman_sections[roman]["order"],
        "name": roman + ". " + section_names.get(roman, roman),
        "items": sec_items
    })

item_total = sum(i["amount"] for s in sections_payload for i in s["items"])

payload = {
    "rab": {
        "number": "TAHFIZ-2025-001",
        "title": project_name,
        "clientName": client_name,
        "location": location,
        "projectDate": "2024-01-01",
        "scheduleStart": "2024-07-24",  # Schedule starts July 24, 2024
        "restDays": [0],
        "notes": f"Imported from 1_RAB_FINAL_v3-Rumah Tahfiz.xlsx | Items: {total_items} | Total: Rp {item_total:,.0f}"
    },
    "sections": sections_payload
}

out_path = r"D:\laragon\www\sanata\tahfiz_import_payload.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)

print(f"\nPayload saved: {out_path}")
print(f"Total sections: {len(sections_payload)}")
print(f"Total items: {total_items}")
print(f"Item amount total: Rp {item_total:,.0f}")
print(f"REKAP grand total: Rp {grand_total:,.0f}")
print(f"REKAP final (DIBULATKAN): Rp 1,325,000,000")

wb.close()
