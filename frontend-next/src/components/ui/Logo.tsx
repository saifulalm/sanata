import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export function Logo({ variant = "full", className = "" }: LogoProps) {
  if (variant === "icon") {
    return (
      <Link href="/" className={className}>
        <Image
          src="/logo-icon.svg"
          alt="Sanata Construction"
          width={40}
          height={40}
          className="h-10 w-10"
          priority
        />
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.svg"
        alt="Sanata Construction"
        width={120}
        height={36}
        className="h-auto w-auto"
        priority
      />
    </Link>
  );
}

// Tagline constant for easy access
export const TAGLINE = "Building the Future";
export const BRAND_NAME = "Sanata Construction";
