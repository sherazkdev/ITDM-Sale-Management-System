"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Quote, Star } from "lucide-react";

import { Wordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

/**
 * Shared two-column chrome for the authentication flow.
 *
 * Left: white form column (logo, optional top-right badge, centered form, footer).
 * Right: an illustrated showcase panel that collapses below `lg`.
 *
 * Each auth page supplies its own `showcase` so the right rail can match its
 * specific Figma reference (dark security panel, dashboard, rocket, etc.).
 */
export function AuthShell({
  children,
  showcase,
  topRight,
  footer,
}: {
  children: React.ReactNode;
  showcase: React.ReactNode;
  topRight?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Form column */}
      <div className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-8 top-8 hidden h-16 w-24 opacity-[0.12] lg:block"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "10px 10px",
            color: "hsl(var(--primary))",
          }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <Wordmark />
          {topRight}
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </div>

        <div className="text-xs text-muted-foreground">
          {footer ?? (
            <p>© {new Date().getFullYear()} ITDMS. All rights reserved.</p>
          )}
        </div>
      </div>

      {/* Showcase column */}
      <div className="hidden lg:block">{showcase}</div>
    </div>
  );
}

export type ShowcaseFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type ShowcaseTestimonial = {
  quote: string;
  name: string;
  role: string;
  stars?: boolean;
};

/**
 * Dark navy security/marketing panel used by login, forgot, reset, verify
 * and OTP screens. `tone="light"` switches to the light red-tint register variant.
 */
export function AuthShowcase({
  illustration,
  heading,
  subheading,
  features,
  testimonial,
  footerNote,
  extra,
  tone = "dark",
}: {
  illustration?: React.ReactNode;
  heading: React.ReactNode;
  subheading?: React.ReactNode;
  features: ShowcaseFeature[];
  testimonial?: ShowcaseTestimonial;
  footerNote?: React.ReactNode;
  extra?: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  return (
    <aside
      className={cn(
        "relative h-full overflow-hidden",
        dark ? "text-white" : "text-[#1e1b4b]",
      )}
    >
      {/* Background */}
      {dark ? (
        <>
          <div className="absolute inset-0 bg-[#121034]" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_75%_-5%,rgba(227,6,19,0.38),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_-10%_110%,rgba(163,0,0,0.22),transparent_55%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[#fdf0f0]" />
          <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_80%_-10%,rgba(227,6,19,0.12),transparent_55%)]" />
        </>
      )}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-8 top-8 h-20 w-28 opacity-20",
        )}
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          color: dark ? "#ffffff" : "hsl(var(--primary))",
        }}
      />

      <div className="relative flex h-full flex-col justify-center gap-8 px-10 py-12 xl:px-16">
        {illustration ? <div className="mx-auto w-full max-w-md">{illustration}</div> : null}

        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-bold leading-snug tracking-tight xl:text-[28px]">
            {heading}
          </h2>
          <div
            className={cn(
              "mt-3 h-1 w-12 rounded-full",
              dark ? "bg-primary-400" : "bg-primary-500",
            )}
          />
          {subheading ? (
            <p
              className={cn(
                "mt-4 text-sm leading-relaxed",
                dark ? "text-white/70" : "text-[#4b478a]",
              )}
            >
              {subheading}
            </p>
          ) : null}

          <ul className="mt-7 flex flex-col gap-5">
            {features.map((f) => {
              const FeatureIcon = f.icon;
              return (
              <li key={f.title} className="flex items-start gap-3.5">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    dark
                      ? "bg-white/10 text-primary-200 ring-1 ring-white/10"
                      : "bg-white text-primary-600 shadow-sm",
                  )}
                >
                  <FeatureIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs leading-relaxed",
                      dark ? "text-white/65" : "text-[#5b5793]",
                    )}
                  >
                    {f.desc}
                  </p>
                </div>
              </li>
              );
            })}
          </ul>

          {extra}

          {testimonial ? (
            <figure
              className={cn(
                "mt-8 rounded-2xl p-5",
                dark
                  ? "bg-white/[0.06] ring-1 ring-white/10"
                  : "bg-white shadow-md",
              )}
            >
              <Quote
                className={cn(
                  "h-5 w-5",
                  dark ? "text-primary-300" : "text-primary-400",
                )}
              />
              {testimonial.stars ? (
                <div className="mt-2 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              ) : null}
              <blockquote
                className={cn(
                  "mt-2 text-sm leading-relaxed",
                  dark ? "text-white/85" : "text-[#322f63]",
                )}
              >
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold",
                    dark
                      ? "bg-primary-500/30 text-primary-100"
                      : "bg-primary-100 text-primary-700",
                  )}
                >
                  {initials(testimonial.name)}
                </span>
                <div className="text-xs">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className={dark ? "text-white/60" : "text-[#6b6798]"}>
                    {testimonial.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ) : null}

          {footerNote ? (
            <div
              className={cn(
                "mt-8 text-center text-sm",
                dark ? "text-white/70" : "text-[#4b478a]",
              )}
            >
              {footerNote}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}
