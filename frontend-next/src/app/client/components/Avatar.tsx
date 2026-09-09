"use client";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "cp-avatar-sm",
  md: "cp-avatar-md",
  lg: "cp-avatar-lg",
  xl: "cp-avatar-xl",
};

export function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className={`cp-avatar ${sizeClasses[size]} ${className}`}>
      {src ? <img src={src} alt={name || "Avatar"} /> : initials}
    </div>
  );
}

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export function AvatarGroup({ children, max, className = "" }: AvatarGroupProps) {
  return (
    <div className={`cp-avatar-group ${className}`}>
      {children}
      {max && (
        <div className={`cp-avatar cp-avatar-sm cp-avatar-group`}>
          +{max}
        </div>
      )}
    </div>
  );
}
