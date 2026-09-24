import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { StatusTone } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id?: string;
  fecha: Date | string;
  titulo: string;
  descripcion?: React.ReactNode;
  actor?: string;
  tone?: StatusTone;
};

// TODO tokens: colores de éxito y advertencia para el punto; hoy solo primary, destructive y neutros.
const DOT: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-primary",
  success: "bg-primary",
  warning: "border-2 border-primary bg-background",
  danger: "bg-destructive",
};

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {events.map((e, i) => {
        const fecha = typeof e.fecha === "string" ? new Date(e.fecha) : e.fecha;
        const last = i === events.length - 1;
        return (
          <li key={e.id ?? i} className="relative flex gap-3 pb-5 last:pb-0" data-tone={e.tone ?? "neutral"}>
            <div className="flex w-3 shrink-0 flex-col items-center">
              <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", DOT[e.tone ?? "neutral"])} />
              {!last && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium">{e.titulo}</span>
                <time dateTime={fecha.toISOString()} className="text-xs text-muted-foreground tabular-nums">
                  {format(fecha, "d MMM yyyy, HH:mm", { locale: es })}
                </time>
              </div>
              {e.actor && <span className="text-xs text-muted-foreground">{e.actor}</span>}
              {e.descripcion && <div className="text-sm text-muted-foreground">{e.descripcion}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
