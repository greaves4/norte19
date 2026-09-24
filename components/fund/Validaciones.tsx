import { CircleAlert, CircleCheck, CircleDashed, OctagonX } from "lucide-react";
import type { NivelValidacion, ResultadoValidacion } from "@/lib/sim/fund/validaciones";
import { cn } from "@/lib/utils";

// TODO tokens: colores de semáforo para ok y advertencia; hoy se distinguen por ícono.
const ICONO_NIVEL: Record<NivelValidacion, typeof CircleCheck> = {
  ok: CircleCheck,
  advertencia: CircleAlert,
  bloqueo: OctagonX,
  pendiente: CircleDashed,
};

const TEXTO_NIVEL: Record<NivelValidacion, string> = {
  ok: "Correcto",
  advertencia: "Advertencia",
  bloqueo: "Bloqueo",
  pendiente: "Pendiente",
};

export function FilaValidacion({ validacion: v }: { validacion: ResultadoValidacion }) {
  const Icono = ICONO_NIVEL[v.nivel];
  return (
    <li className="flex gap-3" data-nivel={v.nivel}>
      <Icono
        className={cn(
          "mt-0.5 size-4 shrink-0",
          v.nivel === "bloqueo" && "text-destructive",
          (v.nivel === "pendiente" || v.nivel === "advertencia") && "text-muted-foreground",
        )}
        aria-label={TEXTO_NIVEL[v.nivel]}
      />
      <div className="flex flex-col gap-0.5">
        <span className={cn("text-sm font-medium", v.nivel === "bloqueo" && "text-destructive")}>{v.titulo}</span>
        <span className="text-sm text-muted-foreground">{v.detalle}</span>
      </div>
    </li>
  );
}

export function ListaValidaciones({ validaciones }: { validaciones: ResultadoValidacion[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {validaciones.map((v, i) => (
        <FilaValidacion key={`${v.id}-${i}`} validacion={v} />
      ))}
    </ul>
  );
}
