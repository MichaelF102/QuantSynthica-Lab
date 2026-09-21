import { cn } from "@/lib/cn";

export default function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2962FF] text-[13px] font-bold text-white",
        className
      )}
      aria-hidden
    >
      Q
    </span>
  );
}
