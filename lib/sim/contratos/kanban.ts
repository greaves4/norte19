// Reglas del Kanban de Legal: columna de cada estatus y qué pasa al arrastrar una tarjeta.
import { analisisVacio } from "@/lib/sim/contratos/analisis";
import type { EstatusSolicitud, Solicitud } from "@/lib/types/contratos";

export type ColumnaKanban = "nueva" | "en_analisis" | "en_aprobacion" | "en_firma" | "formalizada";

export const COLUMNAS_KANBAN: { id: ColumnaKanban; titulo: string }[] = [
  { id: "nueva", titulo: "Nuevas" },
  { id: "en_analisis", titulo: "En análisis" },
  { id: "en_aprobacion", titulo: "En aprobación" },
  { id: "en_firma", titulo: "En firma" },
  { id: "formalizada", titulo: "Formalizadas" },
];

// en_ajustes vive en "En análisis" y aprobada en "En aprobación" (se distinguen con etiqueta).
const COLUMNA: Record<EstatusSolicitud, ColumnaKanban> = {
  nueva: "nueva",
  en_analisis: "en_analisis",
  en_ajustes: "en_analisis",
  en_aprobacion: "en_aprobacion",
  aprobada: "en_aprobacion",
  en_firma: "en_firma",
  formalizada: "formalizada",
};

export function columnaDe(estatus: EstatusSolicitud): ColumnaKanban {
  return COLUMNA[estatus];
}

export const ORDEN_COLUMNA = Object.fromEntries(COLUMNAS_KANBAN.map((c, i) => [c.id, i])) as Record<ColumnaKanban, number>;

export type PasoKanban = "iniciarAnalisis" | "enviarAAprobacion" | "enviarAFirma";

export const NOMBRE_PASO: Record<PasoKanban, string> = {
  iniciarAnalisis: "Iniciar análisis",
  enviarAAprobacion: "Enviar a aprobación",
  enviarAFirma: "Enviar a firma",
};

export type PlanMovimiento =
  | { tipo: "nada" }
  | { tipo: "directo"; pasos: PasoKanban[] }
  // Salta estatus: se confirma y se registran todos los pasos intermedios.
  | { tipo: "salto"; pasos: PasoKanban[] }
  | { tipo: "bloqueado"; motivo: string; accion?: "detalle" | "firma" };

type Datos = Pick<Solicitud, "estatus" | "analisis">;

export function planMovimiento(s: Datos, destino: ColumnaKanban): PlanMovimiento {
  const origen = columnaDe(s.estatus);
  if (origen === destino) return { tipo: "nada" };
  if (ORDEN_COLUMNA[destino] < ORDEN_COLUMNA[origen]) {
    if (s.estatus === "en_aprobacion") return { tipo: "bloqueado", motivo: "Solo el directivo puede regresarla a análisis (rechazo a ajustes)." };
    return { tipo: "bloqueado", motivo: "Las solicitudes no regresan de etapa. Para pedir correcciones usa \"Regresar a solicitante\" en el detalle.", accion: "detalle" };
  }
  if (s.estatus === "en_ajustes") return { tipo: "bloqueado", motivo: "Está con el solicitante para ajustes; avanza cuando la reenvíe." };

  const pasos: PasoKanban[] = [];
  let estatus = s.estatus;
  while (ORDEN_COLUMNA[columnaDe(estatus)] < ORDEN_COLUMNA[destino]) {
    if (estatus === "nueva") {
      pasos.push("iniciarAnalisis");
      estatus = "en_analisis";
    } else if (estatus === "en_analisis") {
      if (analisisVacio(s.analisis)) return { tipo: "bloqueado", motivo: "Para enviarla a aprobación primero escribe y guarda el análisis jurídico.", accion: "detalle" };
      pasos.push("enviarAAprobacion");
      estatus = "en_aprobacion";
    } else if (estatus === "en_aprobacion") {
      return { tipo: "bloqueado", motivo: "Falta la aprobación del directivo para enviarla a firma." };
    } else if (estatus === "aprobada") {
      pasos.push("enviarAFirma");
      estatus = "en_firma";
    } else {
      return { tipo: "bloqueado", motivo: "Se formaliza al concluir la firma electrónica.", accion: "firma" };
    }
  }
  return { tipo: pasos.length > 1 ? "salto" : "directo", pasos };
}
