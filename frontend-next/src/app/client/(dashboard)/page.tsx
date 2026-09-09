"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects, type Project } from "@/lib/clientPortalApi";
import {
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "APPROVED":
      case "PAID":
        return "bg-green-100 text-green-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "APPROVED":
        return "Disetujui";
      case "PAID":
        return "Lunas";
      case "IN_PROGRESS":
        return "Sedang Berjalan";
      case "PENDING":
        return "Menunggu";
      case "DRAFT":
        return "Draft";
      case "REVIEW":
        return "Dalam Review";
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Selamat datang di Portal Klien Sanata Construction</p>
      </div>

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
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.project.status === "ARCHIVED" || p.project.progress === 100).length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.project.status === "APPROVED" && p.project.progress < 100).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Proyek Saya</h2>
        <Link href="/client/dashboard/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          Lihat semua <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Proyek</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Proyek Anda akan muncul di sini setelah admin memberikan akses.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.slice(0, 3).map((access) => (
            <Link
              key={access.accessId}
              href={`/client/project/${access.project.id}`}
              className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-600">{access.project.number}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(access.project.status)}`}>
                        {getStatusLabel(access.project.status)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{access.project.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {access.project.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {access.project.location}
                        </span>
                      )}
                      {access.project.scheduleStart && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(access.project.scheduleStart).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{access.project.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${access.project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <span className="text-gray-500">
                    <FileText className="w-4 h-4 inline mr-1" />
                    {access.project.billingCount} tagihan
                  </span>
                  <span className="text-gray-500">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    {formatCurrency(access.project.total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
