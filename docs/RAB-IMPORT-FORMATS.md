---
name: sanata-rab-import
description: Import RAB Excel files into SANATA backend via /api/rab/import-preview + /api/rab/import-confirm.
---

# SANATA RAB Import Pattern

## File → API Flow
1. **Parse** Excel to JSON payload with `parse_all_rab.py`
2. **Preview** via `POST /api/rab/import-preview` (file upload multipart)
3. **Confirm** via `POST /api/rab/import-confirm` with validated payload
4. **Timeline**: separate flow via `POST /api/rab/import-timeline` (JSON body)

## Payload Schema
```json
{
  "number": "AWA-2025-001",
  "title": "...",
  "clientName": "PT XYZ",
  "location": "addr",
  "scheduleStart": "2024-01-01",
  "restDays": [0],
  "sections": [
    {
      "name": "I. PEKERJAAN PERSIAPAN",
      "items": [
        {
          "description": "1. Uitzet / Bowplank",
          "unit": "m1",
          "volume": 128,
          "unitPrice": 23000,
          "amount": 2944000,
          "startOffsetDays": 0,
          "durationDays": 30
        }
      ]
    }
  ]
}
```

## Known File Formats

### RAB Rumah THE AWA 2-2.xlsx
- **Sheet**: `BQ L7`
- **Structure**: Roman sections (I–XVII), item rows (col A = item number), sub-rows
- **Key cols**: col D (idx 3) = Unit, col E (idx 4) = Sat, col F (idx 5) = Volume, col G (idx 6) = Harga Satuan, col H (idx 7) = Jumlah Grup, col N (idx 13) = Harga Type 53, col O (idx 14) = Jumlah Type 53
- **Sub Total**: row label in col D (idx 3) = "Sub Total X."
- **Bug pattern**: items with vol>0 but h=o=0 (parent rows); fix: `has_data = any(isinstance(row[j], (int,float)) for j in [5,6,7,13,14])` to include ALL numeric rows
- **Amount priority**: O > H > vol * N
- **Proportional scaling**: O-items scale to match Sub Total via `o_sum / sub_total` ratio
- **Skipped**: zero-amount continuation rows, Sub Total formula rows

### RAB STR-ARS Renov Pondok Indah_RAP_v1-2.xlsx
- **Sheets**: `rekap` + 9 work sheets (`1. Prelim`..`9. Pekerjaan MEP`)
- **Item cols**: col A (idx 0) = No, col B (idx 1) = Uraian, col E (idx 4) = Sat, col T (idx 19) = Volume, col U (idx 20) = Harga Sat, col W (idx 22) = Jumlah
- **Section**: Roman numeral in col A
- **Bug pattern**: "By Owner" contaminates numeric cols — fl() must skip `#VALUE!` / "By Owner"
- **Metadata**: row_rekap[6] = proyek, row_rekap[7] = lokasi, row_rekap[10] = pemberi_tugas
- **Grand Total**: `rows_rekap[26][4]` (Total row)
- **Section name**: use Roman numeral + description, not sheet name
- **Parser**: parse_pondok_indah — 7 sections, 247 items typical

### TIME LINE (RE-SCHEDULE)-PASEBAN.xlsx
- **Sheet**: `Sheet1`
- **Cols**: col 0 = No, col 1 = Komponen, col 7 = Bobot %, col 8 = Mulai, col 9 = Selesai, col 10 = Durasi Hari
- **Header rows**: rows 5–7 (0-indexed: 4–6
- **Data rows**: ri >= 14
- **Bobot**: parse float from string "0.0036..." × 100 → percentage
- **Dates**: DD/MM/YY format → `datetime.strptime(d, "%d/%m/%y")`
- **Start offset**: `(mulai - schedule_start).days`
- **Parser**: parse_paseban_timeline

## openpyxl data_only=True
- Reads cached formula values (not live formulas)
- `ws.iter_rows(values_only=True)` returns None for empty cells
- Always check `isinstance(v, (int, float)` before arithmetic

## Backend routes
- `POST /api/rab/import-preview` — multipart file upload
- `POST /api/rab/import-confirm` — JSON body with sections/items
- `POST /api/rab/import-timeline` — JSON timeline payload
- `GET /api/rab/import-template` — download template
