// ProjectRole — unified role system for both signatories and workforce.
// This enum is shared between:
//   - Signatory.role      → document signing authority
//   - DailyReport entries → workforce job titles
//   - User.projectRole    → access level within projects

export type ProjectRole =
  | "DIREKTUR_UTAMA"
  | "DIREKTUR"
  | "MANAGER_PROYEK"
  | "SITE_MANAGER"
  | "PIMPINAN_PROYEK"
  | "KEPALA_TUKANG"
  | "TUKANG_BATU"
  | "TUKANG_KAYU"
  | "TUKANG_BESI"
  | "OPERATOR"
  | "MANDOR"
  | "PEKERJA"
  | "STAF"
  | "LAINNYA";

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
  DIREKTUR_UTAMA: "Directeur Utama",
  DIREKTUR: "Directeur",
  MANAGER_PROYEK: "Manager Proyek",
  SITE_MANAGER: "Site Manager",
  PIMPINAN_PROYEK: "Pimpinan Proyek",
  KEPALA_TUKANG: "Kepala Tukang",
  TUKANG_BATU: "Tukang Batu",
  TUKANG_KAYU: "Tukang Kayu",
  TUKANG_BESI: "Tukang Besi",
  OPERATOR: "Operator",
  MANDOR: "Mandor",
  PEKERJA: "Pekerja",
  STAF: "Staf",
  LAINNYA: "Lainnya",
};

/** Roles that typically appear in daily field reports (construction workers). */
export const FIELD_ROLES: ProjectRole[] = [
  "KEPALA_TUKANG",
  "MANDOR",
  "TUKANG_BATU",
  "TUKANG_KAYU",
  "TUKANG_BESI",
  "OPERATOR",
  "PEKERJA",
];

/** Roles that appear in document signing authority. */
export const SIGNATORY_ROLES: ProjectRole[] = [
  "DIREKTUR_UTAMA",
  "DIREKTUR",
  "MANAGER_PROYEK",
  "SITE_MANAGER",
  "PIMPINAN_PROYEK",
  "STAF",
  "LAINNYA",
];

/** Default workforce roles pre-activated for daily reports. */
export const DEFAULT_ACTIVE_ROLES: ProjectRole[] = [
  "MANDOR",
  "TUKANG_BATU",
  "TUKANG_KAYU",
  "TUKANG_BESI",
  "KEPALA_TUKANG",
  "OPERATOR",
  "PEKERJA",
];

// ── Legacy alias (backwards compatibility) ───────────────────────────────────
/** @deprecated Use `ProjectRole` instead. */
export type SignatoryRole = ProjectRole;
/** @deprecated Use `PROJECT_ROLE_LABEL` instead. */
export const SIGNATORY_ROLE_LABEL = PROJECT_ROLE_LABEL;

// ── Signatory type (uses ProjectRole) ───────────────────────────────────────

export interface Signatory {
  id: string;
  name: string;
  title: string;
  role: ProjectRole | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Workforce Role (database entity) ─────────────────────────────────────────

export interface WorkforceRole {
  id: string;
  role: ProjectRole;
  label: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
