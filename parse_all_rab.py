#!/usr/bin/env python3
"""
Specialized parsers for SANATA RAB import system.
Supports:
  1. RAB Rumah THE AWA 2-2.xlsx  → BQ L7 sheet (17 sections, 86 items)
  2. RAB STR-ARS Renov Pondok Indah  → multi-sheet (9 work sheets)
  3. TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx → Sheet1 (PASEBAN Timeline format)
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# ─── helpers ────────────────────────────────────────────────────────────────

def fl(v, fallback=0.0):
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip().replace("\xa0", "").replace(" ", "")
        if not s or s in ["-", "#VALUE!", "#REF!", "#DIV/0!", "#N/A", "#NAME?", "ByOwner", "By Owner"]:
            return fallback
        try:
            return float(s.replace(",", "."))
        except ValueError:
            return fallback
    return fallback

def flr(v, fallback=0.0):
    return round(fl(v, fallback))

def strv(v, fallback=""):
    return str(v).strip() if v is not None else fallback

def col(row, idx, fallback=None):
    return row[idx] if idx < len(row) else fallback


# ─── FORMAT 1: AWA BQ L7 ────────────────────────────────────────────────
# Sheets: COVER (A3:C54), Rekap (A1:W63), BQ L7 (A1:X230)
# BQ L7 structure:
#   Row 3: Header (No. Uraian | Spesifikasi | Sat | Volume | Harga Satuan | Jumlah Harga)
#   Row 6: Section I header
#   Row 7+: Item rows with col mapping:
#     col 0 = item number (int)
#     col 1 = description (str)
#     col 4 (E) = unit
#     col 5 (F) = volume
#     col 6 (G) = harga satuan
#     col 7 (H) = jumlah harga (may be formula-result null in data_only)
#     col 8 (I) = jumlah harga alternate
#     col 9 (J) = harga permeter
#     col 11 (L) = harga type 53
#     col 13 (N) = harga satuan type 53
#     col 14 (O) = jumlah harga type 53
#
# Amount column: col 14 (O) has the actual amount = col 5 * col 6 (volume * harga_satuan)
#
# Section detection: rows where col 0 matches Roman numeral pattern (I., II., III...)
# and col 1 contains "PEKERJAAN"
#
# Rekap row 56: Grand Total = 364526400 (Rp 364.526.400)

ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
           "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"]

def is_roman(s):
    s = s.strip().upper().rstrip(".")
    return s in ROMANS

def parse_awa_bq_l7(wb) -> dict:
    """Parse BQ L7 sheet from RAB Rumah THE AWA 2-2.xlsx."""
    ws = wb["BQ L7"]
    all_rows = list(ws.iter_rows(values_only=True))

    section_subtotals = {}
    section_items = {}
    current_section = None

    for i, row in enumerate(all_rows):
        a = str(row[0]).strip() if row[0] is not None else ""
        b = str(row[1]).strip() if len(row) > 1 and row[1] is not None else ""
        d3 = str(row[3]).strip() if len(row) > 3 and row[3] is not None else ""

        if is_roman(a) and "PEKERJAAN" in b.upper():
            current_section = a.rstrip(".") + ". " + b.strip().rstrip(":").strip()
            section_items[current_section] = []
            continue

        # Sub Total row: check both col D (idx 3) and col B (idx 1)
        # Sub Total row: save authoritative section total, continue processing
        is_subtotal = "Sub Total" in str(d3)
        if is_subtotal:
            o = row[14] if len(row) > 14 and isinstance(row[14], (int, float)) else 0.0
            h = row[7] if len(row) > 7 and isinstance(row[7], (int, float)) else 0.0
            section_subtotals[current_section] = o if o > 0 else h
            continue

        # Sub-row with item_no (parent item with sub-items below, e.g. "3. Kolom Praktis")
        # Has numeric item number but empty/numeric vol/h/o fields → treat as item
        try:
            item_no = int(float(a)) if a else 0
        except (ValueError, TypeError):
            item_no = 0

        # Include ALL rows with item number OR any non-null data in data columns
        # Include ALL rows with item number OR any non-null numeric data in key cols
        has_data = any(
            isinstance(row[j], (int, float))
            for j in [5, 6, 7, 13, 14]
        )
        if item_no <= 0 and not has_data:
            continue

        unit = str(row[4]).strip() if len(row) > 4 and row[4] else "ls"
        vol = row[5] if len(row) > 5 and isinstance(row[5], (int, float)) else 0.0
        harga_sat_g = row[6] if len(row) > 6 and isinstance(row[6], (int, float)) else 0.0
        harga_sat_n = row[13] if len(row) > 13 and isinstance(row[13], (int, float)) else 0.0
        o = row[14] if len(row) > 14 and isinstance(row[14], (int, float)) else 0.0
        h = row[7] if len(row) > 7 and isinstance(row[7], (int, float)) else 0.0

        amount = o if o > 0 else h if h > 0 else 0.0
        unit_price = harga_sat_n if harga_sat_n > 0 else (harga_sat_g if harga_sat_g > 0 else 0.0)

        if current_section:
            section_items.setdefault(current_section, []).append({
                "description": f"{item_no}. {b}".strip(),
                "unit": unit,
                "volume": vol,
                "unitPrice": unit_price,
                "amount": amount,
                "has_o": o > 0,
            })

    # Build output with proportional distribution
    sections_list = []
    grand_total = 0.0

    # Average H/O ratio from sections with both
    h_o_pairs = [(st, sum(r["amount"] for r in section_items.get(sec, []) if r.get("has_o")))
                  for sec, st in section_subtotals.items() if st > 0]
    ratios = [o / st for st, o in h_o_pairs if st > 0 and o > 0]

    import statistics
    avg_ratio = statistics.median(ratios) if ratios else 1.0

    for idx, (name, items) in enumerate(section_items.items()):
        sub_total = section_subtotals.get(name, 0.0)
        o_sum = sum(r["amount"] for r in items if r.get("has_o"))
        h_sum = sum(r["amount"] for r in items if not r.get("has_o") and r["amount"] > 0)

        # Target: use Sub Total O if available, else estimate from H
        if sub_total > 0:
            target = sub_total
        elif h_sum > 0 and avg_ratio > 0:
            target = h_sum * avg_ratio
        else:
            target = h_sum

        out_items = []
        for r in items:
            amt = r["amount"]
            if r.get("has_o") and o_sum > 0 and target > 0:
                amt = round(amt * (target / o_sum), 0)
            if amt > 0:
                out_items.append({
                    "order": len(out_items),
                    "description": r["description"],
                    "unit": r["unit"],
                    "volume": r["volume"],
                    "unitPrice": r["unitPrice"],
                    "amount": amt,
                    "startOffsetDays": 0,
                    "durationDays": 30,
                })

        if out_items:
            sections_list.append({"name": name, "order": idx, "items": out_items})
            grand_total += sum(it["amount"] for it in out_items)

    grand_total_rekap = 364526400
    total_rekap = 325479950

    return {
        "rab": {
            "number": "AWA-2025-001",
            "title": "Rumah Standar TIPE 53 - Cls. THE AWA 2",
            "clientName": "PT. SENTOSA ASRI PROPERTINDO",
            "location": "Jagorawi Golf Estate, Bogor - Jawa Barat",
            "projectDate": "2022-08-01",
            "scheduleStart": "2022-09-01",
            "restDays": [0],
            "notes": f"Imported from RAB Rumah THE AWA 2-2.xlsx | {sum(len(s['items']) for s in sections_list)} items | Total: Rp {grand_total:,.0f}".replace(",", "."),
        },
        "sections": sections_list,
        "_debug": {
            "source": "BQ L7 (Sub Total proportional)",
            "total_items": sum(len(s["items"]) for s in sections_list),
            "total_amount": grand_total,
            "grand_total_rekap": grand_total_rekap,
            "rekap_items": total_rekap,
            "sections_found": len(sections_list),
        }
    }



def parse_pondok_indah(wb) -> dict:
    """Parse RAB STR-ARS Renov Pondok Indah multi-sheet."""
    # Work section sheets (in order)
    work_sheets = [
        "1. Prelim",
        "2. Perbaikan Beton",
        "3. Struktur",
        "4. Pekerjaan Dinding PI",
        "5. Pekerjaan Atap",
        "6. Pekerjaan Plafond",
        "7. Pekerjaan Kolam Renang",
        "8. Pekerjaan Lantai Baseman",
        "9. Pekerjaan MEP",
    ]

    # Project metadata from Rekap sheet
    try:
        ws_rekap = wb["rekap"]
        rows_rekap = list(ws_rekap.iter_rows(values_only=True))
        # rows_rekap[6] = row 7 = Proyek, rows_rekap[7] = row 8 = Lokasi, etc.
        row7 = rows_rekap[6] if len(rows_rekap) > 6 else []
        row8 = rows_rekap[7] if len(rows_rekap) > 7 else []
        project_name = strv(row7[3] if len(row7) > 3 else None) or "Pembangunan Rumah Tinggal di Pondok Indah"
        location = strv(row8[3] if len(row8) > 3 else None) or "Jl. Sekolah Duta 1 Blok 1 TC No.19"
        # Pemberi Tugas = row 11 col 3
        row11 = rows_rekap[10] if len(rows_rekap) > 10 else []
        client_name = strv(row11[3] if len(row11) > 3 else None) or "Bapak Sasja & Ibu Febie"
        # Grand total from rekap row 27 (idx 26)
        row27 = rows_rekap[26] if len(rows_rekap) > 26 else []
        grand_total = fl(row27[4] if len(row27) > 4 else None)
    except Exception:
        project_name = "Pembangunan Rumah Tinggal di Pondok Indah"
        location = "Jl. Sekolah Duta 1 Blok 1 TC No.19"
        client_name = "Bapak Sasja & Ibu Febie"
        grand_total = 0

    sections = []

    for sheet_idx, sheet_name in enumerate(work_sheets):
        try:
            ws = wb[sheet_name]
            rows = list(ws.iter_rows(values_only=True))
        except Exception:
            continue

        section_items = []
        current_parent_desc = None
        item_order = 0

        for ri, row in enumerate(rows):
            a = strv(col(row, 0, ""))
            b = strv(col(row, 1, ""))
            c = strv(col(row, 2, ""))  # sub-item description

            # Section header: Roman numeral in col A
            if is_roman(a):
                if section_items:
                    sections.append({
                        "name": f"{a.upper().rstrip('.')}. {b.strip().rstrip(':').strip()}",
                        "order": len(sections),
                        "items": section_items,
                    })
                section_items = []
                item_order = 0
                continue

            # Item row: numeric item number in col A
            try:
                item_no = int(float(a)) if a else 0
            except (ValueError, TypeError):
                item_no = 0

            if item_no <= 0:
                # Sub-item row: col 2 has description, no unit/volume
                if c and c not in [a, b]:
                    desc = f"{current_parent_desc} - {c}" if current_parent_desc else c
                    section_items.append({
                        "order": item_order,
                        "description": desc,
                        "unit": "ls",
                        "volume": 1,
                        "unitPrice": 0,
                        "amount": 0,
                        "startOffsetDays": 0,
                        "durationDays": 30,
                    })
                    item_order += 1
                continue

            # Main item row
            desc = b
            unit = strv(col(row, 4, ""), "ls")
            vol = fl(col(row, 19, 0))
            harga_sat = fl(col(row, 20, 0))
            jumlah = fl(col(row, 22, 0))

            if jumlah <= 0 and vol > 0 and harga_sat > 0:
                jumlah = vol * harga_sat

            if jumlah > 0:
                current_parent_desc = desc
                section_items.append({
                    "order": item_order,
                    "description": f"{item_no}. {desc}",
                    "unit": unit,
                    "volume": vol,
                    "unitPrice": harga_sat,
                    "amount": jumlah,
                    "startOffsetDays": 0,
                    "durationDays": 30,
                })
                item_order += 1

        if section_items:
            sections.append({
                "name": f"{sheet_idx + 1}. {sheet_name}",
                "order": len(sections),
                "items": section_items,
            })

    # Grand total from rekap
    try:
        ws_r = wb["rekap"]
        rows_r = list(ws_r.iter_rows(values_only=True))
        # Row 27 (idx 26): Total row - col 4 has grand total
        total_row = col(rows_r, 26, [])
        if total_row:
            grand_total = fl(col(total_row, 4, 0))
    except Exception:
        pass

    total_items = sum(len(s["items"]) for s in sections)
    total_amount = sum(item["amount"] for s in sections for item in s["items"])

    return {
        "rab": {
            "number": "PI-2025-001",
            "title": project_name,
            "clientName": client_name,
            "location": location,
            "projectDate": "2023-10-28",
            "scheduleStart": "2023-11-01",
            "restDays": [0],
            "notes": f"Imported from RAB STR-ARS Renov Pondok Indah_RAP_v1-2.xlsx | {total_items} items | Rp {total_amount:,.0f}".replace(",", "."),
        },
        "sections": sections,
        "_debug": {
            "source": "multi-sheet (Prelim..MEP)",
            "total_items": total_items,
            "total_amount": total_amount,
            "grand_total_rekap": grand_total,
            "sections_found": len(sections),
        }
    }


# ─── FORMAT 3: PASEBAN Timeline ───────────────────────────────────────────
# Sheet1 (A5:BQ148)
# Structure:
#   Row 5 (idx 4): Proyek, Lokasi, Date
#   Row 9: BOBOT | DURASI | TIME SCHEDULE | RE-SCHEDULE
#   Row 10: NO | KOMPONEN PEKERJAAN | BOBOT PEKERJAAN | MULAI | SELESAI | DURASI
#   Row 11: (week labels W1, W2...)
#   Row 12: week dates
#   Row 14+: Section headers (Roman numeral in col 0, PEKERJAAN in col 1)
#   Row 15+: Item rows

PASEBAN_ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
                  "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"]

def parse_paseban_timeline(wb) -> dict:
    """Parse TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx."""
    ws = wb["Sheet1"]
    all_rows = list(ws.iter_rows(values_only=True))

    # Extract project info
    project_name = "RENOVASI RUMAH"
    location = "Jl. Kramat Sawah No. E335, Paseban, Jakarta Pusat"
    schedule_start = "2025-10-10"

    for ri, row in enumerate(all_rows[:10]):
        a = strv(col(row, 0, "")).upper()
        v4 = strv(col(row, 4, ""))
        if a == "PROYEK":
            project_name = v4.strip()
        elif a == "LOKASI":
            location = v4.strip()
        elif a == "DATE":
            # Parse "10 Oktober 2025"
            months = {"JANUARI":1,"FEBRUARI":2,"MARET":3,"APRIL":4,"MEI":5,"JUNI":6,
                       "JULI":7,"AGUSTUS":8,"SEPTEMBER":9,"OKTOBER":10,"NOVEMBER":11,"DESEMBER":12}
            parts = v4.strip().split()
            if len(parts) == 3:
                try:
                    day, month_str, year = parts
                    m = months.get(month_str.upper(), 1)
                    schedule_start = f"{year}-{m:02d}-{int(day):02d}"
                except ValueError:
                    pass

    sections = {}
    current_section = "Pekerjaan"
    total_bobot = 0.0

    for ri, row in enumerate(all_rows):
        if ri < 14:  # Skip header rows
            continue

        a = strv(col(row, 0, "")).upper().strip()
        b = strv(col(row, 1, ""))

        # Section header: Roman numeral in col A + PEKERJAAN in col B
        if a in PASEBAN_ROMANS and "PEKERJAAN" in b.upper():
            current_section = f"{a.upper().rstrip('.')}. {b.strip()}"
            if current_section not in sections:
                sections[current_section] = []
            continue

        if not b:
            continue

        # Item row: bobot in col 7, mulai col 8, selesai col 9, durasi col 10
        bobot_raw = col(row, 7, 0)
        mulai_raw = col(row, 8, None)
        selesai_raw = col(row, 9, None)
        durasi_raw = col(row, 10, 0)

        # Parse bobot
        if isinstance(bobot_raw, float) and bobot_raw > 0:
            bobot = round(bobot_raw * 100, 6)
        elif isinstance(bobot_raw, str) and bobot_raw.strip():
            try:
                bobot = round(float(bobot_raw.strip().replace("%","").replace(",",".")) * 100, 6)
            except ValueError:
                bobot = 0
        else:
            bobot = 0

        if bobot <= 0:
            continue

        # Parse durasi
        durasi = flr(durasi_raw, 0)
        if durasi <= 0:
            durasi = 30  # default

        # Parse dates
        def parse_date(val):
            if val is None:
                return None
            if isinstance(val, datetime):
                return val.strftime("%Y-%m-%d")
            if isinstance(val, str):
                s = val.strip()
                # DD/MM/YY or DD/MM/YYYY
                parts = s.split("/")
                if len(parts) == 3:
                    try:
                        d, m, y = parts
                        y = int(y)
                        if y < 100:
                            y += 2000 if y > 50 else 1900
                        return f"{y}-{int(m):02d}-{int(d):02d}"
                    except ValueError:
                        pass
            return None

        mulai = parse_date(mulai_raw)
        selesai = parse_date(selesai_raw)

        # Calculate start offset days
        start_offset = 0
        if mulai:
            try:
                start_date = datetime.strptime(schedule_start, "%Y-%m-%d")
                mulai_date = datetime.strptime(mulai, "%Y-%m-%d")
                start_offset = max(0, (mulai_date - start_date).days)
            except ValueError:
                start_offset = 0

        if current_section not in sections:
            sections[current_section] = []
        sections[current_section].append({
            "description": b,
            "unit": "LS",
            "volume": 1,
            "unitPrice": 0,
            "amount": 0,
            "bobot": bobot,
            "startOffsetDays": start_offset,
            "durationDays": durasi,
        })
        total_bobot += bobot

    # Build sections list
    sections_list = []
    for idx, (name, items) in enumerate(sections.items()):
        sections_list.append({
            "name": name,
            "order": idx,
            "items": [
                {
                    "order": i,
                    "description": item["description"],
                    "unit": item["unit"],
                    "volume": item["volume"],
                    "unitPrice": item["unitPrice"],
                    "amount": item["amount"],
                    "startOffsetDays": item["startOffsetDays"],
                    "durationDays": item["durationDays"],
                }
                for i, item in enumerate(items)
            ],
        })

    total_items = sum(len(s["items"]) for s in sections_list)

    return {
        "rab": {
            "number": "PASEBAN-2025-001",
            "title": project_name,
            "clientName": "Pribadi",
            "location": location,
            "projectDate": schedule_start,
            "scheduleStart": schedule_start,
            "restDays": [0],
            "notes": f"Imported from TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx | {total_items} items | Bobot Total: {total_bobot:.2f}%",
        },
        "sections": sections_list,
        "_debug": {
            "source": "PASEBAN Timeline",
            "total_items": total_items,
            "total_bobot": total_bobot,
            "sections_found": len(sections_list),
        }
    }


# ─── Main ─────────────────────────────────────────────────────────────────

def main():
    import openpyxl

    if len(sys.argv) < 2:
        print("Usage: python parse_all_rab.py <awa|pondok|paseban|all>")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    out_dir = Path("output_imports")
    out_dir.mkdir(exist_ok=True)

    results = {}

    if cmd in ("awa", "all"):
        print("=== Parsing RAB Rumah THE AWA 2-2.xlsx ===")
        try:
            wb = openpyxl.load_workbook("RAB Rumah THE AWA 2-2.xlsx", data_only=True)
            result = parse_awa_bq_l7(wb)
            out_file = out_dir / "AWA_import_payload.json"
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            d = result["_debug"]
            print(f"  ✅ {d['sections_found']} sections, {d['total_items']} items, Rp {d['total_amount']:,.0f}".replace(",", "."))
            print(f"  💾 Saved: {out_file}")
            results["AWA"] = result
        except Exception as e:
            print(f"  ❌ Error: {e}")

    if cmd in ("pondok", "all"):
        print("\n=== Parsing RAB STR-ARS Renov Pondok Indah_RAP_v1-2.xlsx ===")
        try:
            wb = openpyxl.load_workbook("RAB STR-ARS Renov Pondok Indah_RAP_v1-2.xlsx", data_only=True)
            result = parse_pondok_indah(wb)
            out_file = out_dir / "PONDOK_INDAH_import_payload.json"
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            d = result["_debug"]
            print(f"  ✅ {d['sections_found']} sections, {d['total_items']} items, Rp {d['total_amount']:,.0f}".replace(",", "."))
            print(f"  💾 Saved: {out_file}")
            results["PONDOK_INDAH"] = result
        except Exception as e:
            print(f"  ❌ Error: {e}")

    if cmd in ("paseban", "all"):
        print("\n=== Parsing TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx ===")
        try:
            wb = openpyxl.load_workbook("TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx", data_only=True)
            result = parse_paseban_timeline(wb)
            out_file = out_dir / "PASEBAN_import_payload.json"
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            d = result["_debug"]
            print(f"  ✅ {d['sections_found']} sections, {d['total_items']} items, bobot total: {d['total_bobot']:.2f}%")
            print(f"  💾 Saved: {out_file}")
            results["PASEBAN"] = result
        except Exception as e:
            print(f"  ❌ Error: {e}")

    print(f"\n=== SUMMARY ===")
    for name, r in results.items():
        d = r["_debug"]
        print(f"  {name}: {d['sections_found']} sections, {d['total_items']} items")

if __name__ == "__main__":
    main()
