import React from "react";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";

export default function Logo({ className }: { className?: string }) {
  return (
    <QuantSynthicaLogo
      variant="mark"
      size="sm"
      link={false}
      className={className}
    />
  );
}
