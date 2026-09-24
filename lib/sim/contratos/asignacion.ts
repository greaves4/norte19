// Asignación automática: el abogado con menor carga activa; empate por el orden de ABOGADOS.
import { ABOGADOS } from "@/lib/fixtures/contratos/personas";
import type { EstatusSolicitud, Solicitud } from "@/lib/types/contratos";

// Carga activa: lo que está en manos del abogado (antes de enviarse a aprobación).
export const ESTATUS_CARGA: EstatusSolicitud[] = ["nueva", "en_analisis", "en_ajustes"];

export function cargaPorAbogado(solicitudes: Pick<Solicitud, "abogadoId" | "estatus">[]): Record<string, number> {
  const carga = Object.fromEntries(ABOGADOS.map((a) => [a.id, 0]));
  for (const s of solicitudes) if (ESTATUS_CARGA.includes(s.estatus) && s.abogadoId in carga) carga[s.abogadoId] += 1;
  return carga;
}

export function asignarAbogado(solicitudes: Pick<Solicitud, "abogadoId" | "estatus">[]): string {
  const carga = cargaPorAbogado(solicitudes);
  return ABOGADOS.reduce((mejor, a) => (carga[a.id] < carga[mejor.id] ? a : mejor), ABOGADOS[0]).id;
}
