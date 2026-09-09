"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/clientPortalApi";
import { Building2, MapPin, Calendar, TrendingUp, ChevronRight, FileText, CheckCircle2, Clock } from "lucide-react";

interface ProjectAccess {
  accessId: string;
  accessLevel: string;
  project: {
    id: string;
    number: string;
    title: string;
    clientName: string | null;
    location: string | null;
    status: string;
    scheduleStart: string | null;
    total: number;
    progress: number;
    totalItems: number;
    completedItems: number;
    billingCount: number;
  };
}

export default function ClientDashboard() {
  const [projects, setProjects] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
    setLoading(false);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Selamat datang di Portal Klien Sanata Construction</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Proyek</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Proyek Selesai</p>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.project.status === "ARCHIVED" || p.project.progress === 100).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sedang Berjalan</p>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.project.status !== "ARCHIVED" && p.project.progress < 100).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Proyek Saya</h2>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Proyek</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Proyek Anda akan muncul di sini setelah admin memberikan akses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(access => (
            <Link key={access.accessId} href={`/client/dashboard/project/${access.project.id}`}
              className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-600">{access.project.number}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${access.project.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {access.project.status === "APPROVED" ? "Aktif" : access.project.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{access.project.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {access.project.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{access.project.location}</span>}
                    {access.project.scheduleStart && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(access.project.scheduleStart)}</span>}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-900">{access.project.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${access.project.progress}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <span><FileText className="w-4 h-4 inline mr-1" />{access.project.billingCount} tagihan</span>
                <span><TrendingUp className="w-4 h-4 inline mr-1" />{formatCurrency(access.project.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
