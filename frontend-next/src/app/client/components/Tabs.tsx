"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: "default" | "pills";
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, variant = "default", className = "" }: TabsProps) {
  const containerClass = variant === "pills" ? "cp-tabs cp-tabs-pills" : "cp-tabs";

  return (
    <div className={className}>
      <nav className={containerClass}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`cp-tab ${isActive ? "cp-tab-active" : ""}`}
              type="button"
            >
              {Icon && <Icon className="cp-tab-icon" />}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface TabPanelProps {
  children: ReactNode;
  isActive: boolean;
  className?: string;
}

export function TabPanel({ children, isActive, className = "" }: TabPanelProps) {
  if (!isActive) return null;
  return <div className={`cp-fade-in ${className}`}>{children}</div>;
}
