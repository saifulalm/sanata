"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`cp-skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="cp-skeleton-text"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`cp-card ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="cp-skeleton-avatar cp-avatar-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="cp-skeleton-text" style={{ width: "40%" }} />
          <Skeleton className="cp-skeleton-text" style={{ width: "60%" }} />
        </div>
      </div>
      <Skeleton className="cp-skeleton-text" />
      <Skeleton className="cp-skeleton-text" />
      <Skeleton className="cp-skeleton-text" style={{ width: "80%" }} />
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="cp-card cp-stat">
          <Skeleton className="cp-skeleton-avatar cp-avatar-lg mb-3" />
          <Skeleton className="cp-skeleton-text" style={{ width: "60%" }} />
          <Skeleton className="cp-skeleton-text" style={{ width: "40%" }} />
        </div>
      ))}
    </div>
  );
}
