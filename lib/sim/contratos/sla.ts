// SLA en días hábiles (lunes a viernes, sin festivos). El tiempo de fin de semana no cuenta.
import type { TipoContrato } from "@/lib/types/contratos";

export const SLA_POR_TIPO: Record<TipoContrato, number> = {
  arrendamiento: 5,
  desarrollo: 8,
  servicios: 5,
  confidencialidad: 3,
};

export function slaPorTipo(tipo: TipoContrato) {
  return SLA_POR_TIPO[tipo];
}

const DIA = 86_400_000;

function esHabil(d: Date) {
  const dia = d.getDay();
  return dia !== 0 && dia !== 6;
}

function inicioDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Días hábiles transcurridos (fraccionarios) entre dos fechas.
export function diasHabilesTranscurridos(desde: Date, hasta: Date): number {
  if (hasta <= desde) return 0;
  let total = 0;
  let cursor = new Date(desde);
  while (cursor < hasta) {
    const finDia = new Date(inicioDia(cursor).getTime() + DIA);
    const tramoFin = finDia < hasta ? finDia : hasta;
    if (esHabil(cursor)) total += (tramoFin.getTime() - cursor.getTime()) / DIA;
    cursor = tramoFin;
  }
  return total;
}

export function diasHabilesRestantes(creadaEn: Date | string, sla: number, now: Date): number {
  return sla - diasHabilesTranscurridos(new Date(creadaEn), now);
}

export type Semaforo = "verde" | "ambar" | "rojo";

// Verde > 50% restante, ámbar 20–50%, rojo < 20% o vencido.
export function semaforo(restante: number, total: number): Semaforo {
  const fraccion = restante / total;
  if (fraccion > 0.5) return "verde";
  if (fraccion >= 0.2) return "ambar";
  return "rojo";
}

// Fecha tal que, al llegar `hasta`, hayan transcurrido `dias` días hábiles (para fixtures relativas a hoy).
export function restarDiasHabiles(hasta: Date, dias: number): Date {
  let restante = dias * DIA;
  let cursor = new Date(hasta);
  while (restante > 0) {
    // Día que contiene el instante inmediatamente anterior al cursor.
    const dia = inicioDia(new Date(cursor.getTime() - 1));
    const disponible = cursor.getTime() - dia.getTime();
    if (esHabil(dia)) {
      if (disponible >= restante) return new Date(cursor.getTime() - restante);
      restante -= disponible;
    }
    cursor = dia;
  }
  return cursor;
}

export function sumarDiasHabiles(desde: Date, dias: number): Date {
  let restante = dias * DIA;
  let cursor = new Date(desde);
  while (restante > 0) {
    const finDia = new Date(inicioDia(cursor).getTime() + DIA);
    if (!esHabil(cursor)) {
      cursor = finDia;
      continue;
    }
    const hastaFin = finDia.getTime() - cursor.getTime();
    if (hastaFin >= restante) return new Date(cursor.getTime() + restante);
    restante -= hastaFin;
    cursor = finDia;
  }
  return cursor;
}
