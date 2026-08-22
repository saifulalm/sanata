"use client";

import { Paperclip, Plus, Trash2 } from "lucide-react";
import { btn, inputClass } from "@/components/admin/ui";
import type { DocAttachment } from "@/lib/projectDocs";

/**
 * Daftar lampiran dokumen.
 *
 * Berbeda dari `PhotoListField` yang mengunggah gambar untuk ditampilkan,
 * lampiran dokumen umumnya berkas yang sudah ada di tempat lain — hasil pindai
 * surat, gambar kerja, penawaran pemasok — jadi yang dicatat cukup tautan dan
 * namanya. Memaksa semuanya lewat pustaka media hanya akan menahan pekerjaan
 * administrasi yang seharusnya cepat.
 */
export function AttachmentsField({
  value,
  onChange,
  label = "Lampiran",
}: {
  value: DocAttachment[];
  onChange: (next: DocAttachment[]) => void;
  label?: string;
}) {
  const update = (index: number, patch: Partial<DocAttachment>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          <Paperclip size={13} /> {label}
        </span>
        <button type="button" onClick={() => onChange([...value, { url: "", name: "" }])} className={btn("ghost", "sm")}>
          <Plus size={13} /> Tambah
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-slate-500">Belum ada lampiran.</p>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item.name}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder="Nama berkas"
                className={`${inputClass} sm:max-w-[40%]`}
              />
              <input
                value={item.url}
                onChange={(e) => update(index, { url: e.target.value })}
                placeholder="https://…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                aria-label="Hapus lampiran"
                className={btn("danger", "sm")}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
