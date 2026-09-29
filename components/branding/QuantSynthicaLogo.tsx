"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

export type LogoVariant = "full" | "mark" | "compact" | "stacked";
export type LogoSize = "xs" | "sm" | "default" | "md" | "lg" | "xl" | number;

export interface QuantSynthicaLogoProps {
  /**
   * full: [Q MARK] QUANTSYNTHICALAB
   * mark: [Q MARK]
   * compact: Mark on mobile, full horizontal on tablet/desktop
   * stacked: Mark above wordmark
   */
  variant?: LogoVariant;
  /**
   * Predefined size or explicit number (in pixels) for the mark height
   */
  size?: LogoSize;
  /**
   * Additional Tailwind classes applied to outer container
   */
  className?: string;
  /**
   * Optional custom image class
   */
  imageClassName?: string;
  /**
   * URL to link to. Defaults to "/". Set to false to disable link wrapper.
   */
  link?: string | false;
  /**
   * Next.js Image priority loading
   */
  priority?: boolean;
  /**
   * Display the brand tagline "DATA | MODELS | MARKETS | INSIGHTS" below wordmark
   */
  showTagline?: boolean;
  /**
   * Explicit theme override. Defaults to auto (inherits from Tailwind light/dark classes)
   */
  theme?: "light" | "dark" | "auto";
  /**
   * Custom accessible label
   */
  ariaLabel?: string;
}

const SIZE_MAP: Record<string, { markPx: number; textClass: string; gapClass: string; taglineClass: string }> = {
  xs: { markPx: 22, textClass: "text-[12px] tracking-tight", gapClass: "gap-1.5", taglineClass: "text-[8px] tracking-[0.2em]" },
  sm: { markPx: 28, textClass: "text-[14px] tracking-tight", gapClass: "gap-2", taglineClass: "text-[9px] tracking-[0.22em]" },
  default: { markPx: 34, textClass: "text-[16px] tracking-tight", gapClass: "gap-2.5", taglineClass: "text-[9.5px] tracking-[0.25em]" },
  md: { markPx: 34, textClass: "text-[16px] tracking-tight", gapClass: "gap-2.5", taglineClass: "text-[9.5px] tracking-[0.25em]" },
  lg: { markPx: 44, textClass: "text-[20px] tracking-tight", gapClass: "gap-3", taglineClass: "text-[11px] tracking-[0.28em]" },
  xl: { markPx: 56, textClass: "text-[26px] tracking-tight", gapClass: "gap-3.5", taglineClass: "text-[12px] tracking-[0.3em]" },
};

export default function QuantSynthicaLogo({
  variant = "full",
  size = "default",
  className,
  imageClassName,
  link = "/",
  priority = false,
  showTagline = false,
  theme = "auto",
  ariaLabel = "QuantSynthicaLab",
}: QuantSynthicaLogoProps) {
  // Resolve size config
  const isCustomNumber = typeof size === "number";
  const sizeConfig = isCustomNumber
    ? {
        markPx: size,
        textClass: size < 26 ? "text-xs" : size < 40 ? "text-base" : "text-xl",
        gapClass: "gap-2.5",
        taglineClass: "text-[9px] tracking-[0.2em]",
      }
    : SIZE_MAP[size] || SIZE_MAP.default;

  const markSize = sizeConfig.markPx;

  // Typography coloring based on theme override or CSS dark mode
  const quantColor =
    theme === "light"
      ? "text-[#0B1220]"
      : theme === "dark"
      ? "text-white"
      : "text-[#0B1220] dark:text-white";

  const synthicaColor =
    theme === "light"
      ? "text-[#1769FF]"
      : theme === "dark"
      ? "text-[#2563EB]"
      : "text-[#1769FF] dark:text-[#2563EB]";

  const labColor =
    theme === "light"
      ? "text-[#64748B]"
      : theme === "dark"
      ? "text-[#94A3B8]"
      : "text-[#64748B] dark:text-[#94A3B8]";

  // The Mark Emblem
  const markElement = (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
        imageClassName
      )}
      style={{ width: markSize, height: markSize }}
    >
      <Image
        src="/branding/quantsynthicalab-mark.png"
        alt="QuantSynthicaLab"
        width={markSize}
        height={markSize}
        priority={priority}
        className="h-full w-full object-contain select-none"
      />
    </div>
  );

  // The Wordmark Text
  const wordmarkElement = (
    <div className="flex flex-col justify-center select-none leading-none">
      <span className={cn("font-bold tracking-tight inline-flex items-center", sizeConfig.textClass)}>
        <span className={quantColor}>QUANT</span>
        <span className={synthicaColor}>SYNTHICA</span>
        <span className={cn("font-semibold ml-0.5", labColor)}>LAB</span>
      </span>
      {showTagline && (
        <span className={cn("font-medium uppercase text-slate-500 dark:text-slate-400 mt-1", sizeConfig.taglineClass)}>
          Data • Models • Markets • Insights
        </span>
      )}
    </div>
  );

  // Layout based on variant
  let content: React.ReactNode;

  if (variant === "mark") {
    content = markElement;
  } else if (variant === "compact") {
    content = (
      <div className={cn("flex items-center", sizeConfig.gapClass)}>
        {markElement}
        <div className="hidden sm:flex">
          {wordmarkElement}
        </div>
      </div>
    );
  } else if (variant === "stacked") {
    content = (
      <div className={cn("flex flex-col items-center text-center", sizeConfig.gapClass)}>
        {markElement}
        {wordmarkElement}
      </div>
    );
  } else {
    // "full"
    content = (
      <div className={cn("flex items-center", sizeConfig.gapClass)}>
        {markElement}
        {wordmarkElement}
      </div>
    );
  }

  // Wrapper: Link vs Div
  if (link) {
    return (
      <Link
        href={link}
        aria-label={ariaLabel}
        className={cn("group inline-flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn("group inline-flex items-center shrink-0", className)}
    >
      {content}
    </div>
  );
}
