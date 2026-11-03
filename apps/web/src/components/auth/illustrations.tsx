import { cn } from "@/lib/utils";

/** Decorative dashboard mock for login panel — not live ITDMS data. */
export function LoginItdmsIllo({ className }: { className?: string }) {
  const kpis = [
    { l: "Notifications", v: "—" },
    { l: "Assets", v: "—" },
    { l: "Open POs", v: "—" },
  ];
  return (
    <div className={cn("relative mx-auto w-full max-w-[420px]", className)} aria-hidden="true">
      <div className="rounded-2xl border border-white/10 bg-white p-3.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
        <p className="text-[13px] font-semibold text-[#111827]">ITDMS overview (preview)</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {kpis.map((k) => (
            <div key={k.l} className="rounded-lg border border-[#EEF0F4] bg-[#FAFAFE] p-2">
              <p className="text-[10px] font-medium text-[#6B7280] leading-tight">{k.l}</p>
              <p className="mt-1 text-[14px] font-bold leading-none text-[#111827] tabular">{k.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-[#6B7280]">Decorative layout preview — live metrics after sign-in.</p>
      </div>
    </div>
  );
}
