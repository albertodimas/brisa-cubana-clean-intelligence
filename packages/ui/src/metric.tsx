export interface MetricProps {
  value: string;
  label: string;
  helper?: string;
}

export function Metric({ value, label, helper }: MetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 shadow-inner shadow-black/40">
      <div className="text-3xl font-semibold text-white sm:text-4xl">
        {value}
      </div>
      <p className="text-sm text-neutral-300">{label}</p>
      {helper ? (
        <p className="mt-1 text-xs text-neutral-400">{helper}</p>
      ) : null}
    </div>
  );
}
