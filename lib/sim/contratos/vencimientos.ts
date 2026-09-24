// Estatus de vigencia de un contrato respecto del reloj de demo.
import { differenceInCalendarDays } from "date-fns";
import type { Contrato, EstatusVigencia } from "@/lib/types/contratos";

export const DIAS_POR_VENCER = 90;

export function diasParaVencer(vigenciaFin: string, now: Date) {
  return differenceInCalendarDays(new Date(`${vigenciaFin}T23:59:59`), now);
}

export function estatusVigencia(vigenciaFin: string, now: Date): EstatusVigencia {
  const dias = diasParaVencer(vigenciaFin, now);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_POR_VENCER) return "por_vencer";
  return "vigente";
}

// Próximos vencimientos (no vencidos), del más cercano al más lejano.
export function proximosVencimientos(contratos: Contrato[], now: Date, limite = 5) {
  return contratos
    .filter((c) => diasParaVencer(c.vigenciaFin, now) >= 0)
    .sort((a, b) => a.vigenciaFin.localeCompare(b.vigenciaFin))
    .slice(0, limite);
}
