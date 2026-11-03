"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type OrlenBrandProps = {
  className?: string;
  /** Collapsed sidebar — prefers `orlen-logo-mark.svg`, then ITDMS mark. */
  collapsed?: boolean;
  /** Use dark-background logo variant when provided. */
  preferDarkAsset?: boolean;
};

const LOGO_FULL = "/brand/orlen-logo.svg";
const LOGO_DARK = "/brand/orlen-logo-dark.svg";
const LOGO_MARK = "/brand/orlen-logo-mark.svg";

/**
 * Client ORLEN logo slot. Loads files from `public/brand/` when present.
 * Falls back to typographic "ORLEN" — never a recreated or web-sourced logo.
 */
export function OrlenBrandLogo({ className, collapsed, preferDarkAsset }: OrlenBrandProps) {
  const [fullFailed, setFullFailed] = useState(false);
  const [markFailed, setMarkFailed] = useState(false);
  const fullSrc = preferDarkAsset ? LOGO_DARK : LOGO_FULL;

  if (collapsed) {
    if (!markFailed) {
      return (
        <Image
          src={LOGO_MARK}
          alt="ORLEN"
          width={32}
          height={32}
          className={cn("h-7 w-7 object-contain object-left", className)}
          onError={() => setMarkFailed(true)}
          priority
        />
      );
    }
    return <LogoMark className={className} size={28} />;
  }

  if (!fullFailed) {
    return (
      <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
        <Image
          src={fullSrc}
          alt="ORLEN"
          width={148}
          height={36}
          className="h-8 w-auto max-w-[148px] object-contain object-left"
          onError={() => setFullFailed(true)}
          priority
        />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          ITDMS
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="text-lg font-bold tracking-tight text-primary">ORLEN</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        ITDMS
      </span>
    </div>
  );
}

type LogoProps = {
  size?: number;
  className?: string;
  variant?: "gradient" | "mono";
};

/** ITDMS product mark (collapsed sidebar fallback when ORLEN mark asset is missing). */
export function LogoMark({ size = 32, className, variant = "gradient" }: LogoProps) {
  const id = `itdms-logo-${variant}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {variant === "gradient" ? (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--brand-gradient-to))" />
          </linearGradient>
        </defs>
      ) : null}
      <g fill={variant === "gradient" ? `url(#${id})` : "currentColor"} transform="translate(20 20)">
        {[0, 120, 240].map((angle) => (
          <path
            key={angle}
            transform={`rotate(${angle})`}
            d="M0 -14 C 6 -14, 11 -9, 11 -3 C 11 4, 5 8, 0 4 C -2 2, -2 -2, 0 -4 Z"
          />
        ))}
      </g>
    </svg>
  );
}

/** @deprecated Use LogoMark — kept for imports. */
export const Logo = LogoMark;

export function Wordmark({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return <OrlenBrandLogo collapsed={collapsed} className={className} />;
}
