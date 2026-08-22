"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { updateSettingsAction, type SiteContentActionState } from "./actions";
import type { AdminSiteSetting } from "@/lib/adminResources";
import { Panel } from "@/components/admin/ui";

const initialState: SiteContentActionState = { status: "idle" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20 disabled:opacity-60"
    >
      <Save size={14} /> {pending ? "Menyimpan..." : "Simpan Pengaturan"}
    </button>
  );
}

export function SettingsForm({
  settings,
  title = "Teks & Info Umum",
  description = "Headline hero, tagline, dan detail kontak",
  showGroupLabels = true,
}: {
  settings: AdminSiteSetting[];
  title?: string;
  description?: string;
  showGroupLabels?: boolean;
}) {
  const [state, formAction] = useActionState(updateSettingsAction, initialState);

  const groups = new Map<string, AdminSiteSetting[]>();
  for (const setting of settings) {
    const list = groups.get(setting.group) ?? [];
    list.push(setting);
    groups.set(setting.group, list);
  }

  return (
    <Panel
      title={title}
      description={description}
      actions={<SaveButton />}
    >
      {state.status === "error" && (
        <p className="mb-4 text-sm text-red-400">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="mb-4 text-sm text-emerald-400">{state.message}</p>
      )}

      <div className="space-y-6">
        {[...groups.entries()].map(([group, items]) => (
          <div key={group}>
            {showGroupLabels && (
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {group}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((setting) => (
                <div key={setting.key}>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    {setting.label}
                  </label>
                  {setting.type === "textarea" ? (
                    <textarea
                      name={`setting:${setting.key}`}
                      defaultValue={setting.value}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition"
                    />
                  ) : (
                    <input
                      name={`setting:${setting.key}`}
                      defaultValue={setting.value}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/10 transition"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
