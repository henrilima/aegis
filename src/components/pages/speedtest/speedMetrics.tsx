import type { RefObject } from "react";

interface SpeedMetricsProps {
  pingRef: RefObject<HTMLSpanElement | null>;
  downloadRef: RefObject<HTMLSpanElement | null>;
  uploadRef: RefObject<HTMLSpanElement | null>;
}

export function SpeedMetrics({
  pingRef,
  downloadRef,
  uploadRef,
}: SpeedMetricsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
      <MetricBlock label="Ping" unit="ms" spanRef={pingRef} />
      <MetricBlock label="Download" unit="Mbps" spanRef={downloadRef} />
      <MetricBlock label="Upload" unit="Mbps" spanRef={uploadRef} />
    </div>
  );
}

function MetricBlock({
  label,
  unit,
  spanRef,
}: {
  label: string;
  unit: string;
  spanRef: RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <p className="text-[10px] font-black uppercase  text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
        <span ref={spanRef}>0.0</span>
      </p>
      <p className="text-[10px] text-neutral-600">{unit}</p>
    </div>
  );
}
