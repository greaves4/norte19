"use client";

import { CircleAlert, Clock, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { diasHabilesRestantes, diasHabilesTranscurridos, semaforo, type Semaforo } from "@/lib/sim/contratos/sla";
import type { Solicitud } from "@/lib/types/contratos";

// El SLA corre mientras la solicitud está en manos de Legal (antes de enviarse a aprobación).
const ACTIVOS = new Set(["nueva", "en_analisis", "en_ajustes"]);

export function estadoSla(s: Pick<Solicitud, "estatus" | "creadaEn" | "slaDiasHabiles" | "etapas">, now: Date) {
  if (ACTIVOS.has(s.estatus)) {
    const restante = diasHabilesRestantes(s.creadaEn, s.slaDiasHabiles, now);
    return { activo: true as const, restante, color: semaforo(restante, s.slaDiasHabiles) };
  }
  const cierre = s.etapas.en_aprobacion ? new Date(s.etapas.en_aprobacion) : now;
  const usados = diasHabilesTranscurridos(new Date(s.creadaEn), cierre);
  return { activo: false as const, usados, cumplido: usados <= s.slaDiasHabiles };
}

function dias(n: number) {
  const v = Math.abs(n).toLocaleString("es-MX", { maximumFractionDigits: 1 });
  return `${v} ${Math.abs(n) >= 0.95 && Math.abs(n) < 1.05 ? "día" : "días"}`;
}

// TODO tokens: colores de semáforo (verde, ámbar, rojo); hoy se distinguen por variante e ícono.
const VARIANTE: Record<Semaforo, "secondary" | "outline" | "destructive"> = { verde: "secondary", ambar: "outline", rojo: "destructive" };
const ICONO: Record<Semaforo, typeof Clock> = { verde: Clock, ambar: CircleAlert, rojo: OctagonAlert };
const NOMBRE: Record<Semaforo, string> = { verde: "En tiempo", ambar: "Por vencer", rojo: "Urgente" };

export function RelojSla({ solicitud, now }: { solicitud: Pick<Solicitud, "estatus" | "creadaEn" | "slaDiasHabiles" | "etapas">; now: Date }) {
  const e = estadoSla(solicitud, now);
  if (!e.activo) {
    if (solicitud.estatus === "formalizada" || e.cumplido) return <span className="text-xs text-muted-foreground">SLA {e.cumplido ? "cumplido" : "excedido"}</span>;
    return <span className="text-xs text-muted-foreground">SLA excedido</span>;
  }
  const Icono = ICONO[e.color];
  return (
    <Badge variant={VARIANTE[e.color]} data-semaforo={e.color} className="whitespace-nowrap" title={`${NOMBRE[e.color]} · SLA de ${solicitud.slaDiasHabiles} días hábiles`}>
      <Icono data-icon="inline-start" aria-hidden />
      <span className="sr-only">{NOMBRE[e.color]}: </span>
      {e.restante >= 0 ? `Quedan ${dias(e.restante)}` : `Vencido hace ${dias(e.restante)}`}
    </Badge>
  );
}
