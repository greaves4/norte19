// Indicadores del dashboard de Contratos, calculados del store con el reloj de demo.
import { isSameMonth } from "date-fns";
import { ABOGADOS } from "@/lib/fixtures/contratos/personas";
import { cargaPorAbogado } from "@/lib/sim/contratos/asignacion";
import { COLUMNAS_KANBAN, columnaDe, type ColumnaKanban } from "@/lib/sim/contratos/kanban";
import { diasHabilesTranscurridos } from "@/lib/sim/contratos/sla";
import { estatusVigencia } from "@/lib/sim/contratos/vencimientos";
import { NOMBRE_TIPO_CONTRATO, type Contrato, type EstatusSolicitud, type Solicitud, type TipoContrato, type TipoEventoSolicitud } from "@/lib/types/contratos";

// Estatus al que lleva cada evento de la timeline (para reconstruir cuánto estuvo en cada etapa).
const ESTATUS_EVENTO: Partial<Record<TipoEventoSolicitud, EstatusSolicitud>> = {
  creada: "nueva",
  en_analisis: "en_analisis",
  regresada: "en_ajustes",
  reenviada: "en_analisis",
  enviada_aprobacion: "en_aprobacion",
  aprobada: "aprobada",
  rechazada_ajustes: "en_analisis",
  enviada_firma: "en_firma",
  formalizada: "formalizada",
};

export type Tramo = { columna: ColumnaKanban; dias: number };

// Tramos en días hábiles por columna del Kanban; el tramo actual corre hasta `now`.
export function tramos(s: Pick<Solicitud, "timeline">, now: Date): Tramo[] {
  const cambios = s.timeline
    .map((e) => ({ estatus: ESTATUS_EVENTO[e.tipo], fecha: new Date(e.fecha) }))
    .filter((c): c is { estatus: EstatusSolicitud; fecha: Date } => !!c.estatus)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  const out: Tramo[] = [];
  cambios.forEach((c, i) => {
    if (c.estatus === "formalizada") return;
    const fin = cambios[i + 1]?.fecha ?? now;
    out.push({ columna: columnaDe(c.estatus), dias: diasHabilesTranscurridos(c.fecha, fin) });
  });
  return out;
}

export function tiempoPorColumna(solicitudes: Solicitud[], now: Date) {
  const suma: Partial<Record<ColumnaKanban, { dias: number; n: Set<string> }>> = {};
  for (const s of solicitudes) {
    for (const t of tramos(s, now)) {
      const acc = (suma[t.columna] ??= { dias: 0, n: new Set() });
      acc.dias += t.dias;
      acc.n.add(s.id);
    }
  }
  // Promedio por solicitud que pasó por la columna (varias visitas a la misma columna se suman).
  return COLUMNAS_KANBAN.filter((c) => c.id !== "formalizada").map((c) => ({
    etiqueta: c.titulo,
    valor: suma[c.id] ? suma[c.id]!.dias / suma[c.id]!.n.size : 0,
    solicitudes: suma[c.id]?.n.size ?? 0,
  }));
}

// SLA de análisis: se cumple si la solicitud llegó a aprobación dentro de sus días hábiles. Las activas cuentan
// solo si ya lo excedieron (todavía pueden cumplirlo).
export function cumplimientoSla(solicitudes: Solicitud[], now: Date) {
  let cumplidas = 0;
  let evaluadas = 0;
  for (const s of solicitudes) {
    const llegada = s.etapas.en_aprobacion;
    const usados = diasHabilesTranscurridos(new Date(s.creadaEn), llegada ? new Date(llegada) : now);
    if (llegada) {
      evaluadas += 1;
      if (usados <= s.slaDiasHabiles) cumplidas += 1;
    } else if (usados > s.slaDiasHabiles) {
      evaluadas += 1;
    }
  }
  return { cumplidas, evaluadas, porcentaje: evaluadas ? (cumplidas / evaluadas) * 100 : null };
}

export function indicadoresContratos(solicitudes: Solicitud[], contratos: Contrato[], now: Date) {
  const delMes = solicitudes.filter((s) => isSameMonth(new Date(s.creadaEn), now)).length;
  const enProceso = solicitudes.filter((s) => s.estatus !== "formalizada").length;
  const porVencer = contratos.filter((c) => estatusVigencia(c.vigenciaFin, now) === "por_vencer").length;
  const etapas = tiempoPorColumna(solicitudes, now);
  const conTiempo = etapas.filter((e) => e.solicitudes > 0);
  const promedioEtapa = conTiempo.length ? conTiempo.reduce((t, e) => t + e.valor, 0) / conTiempo.length : 0;
  return { delMes, enProceso, porVencer, sla: cumplimientoSla(solicitudes, now), etapas, promedioEtapa };
}

export function volumenPorTipo(solicitudes: Solicitud[]) {
  const tipos = Object.keys(NOMBRE_TIPO_CONTRATO) as TipoContrato[];
  return tipos
    .map((t) => ({ etiqueta: NOMBRE_TIPO_CONTRATO[t], valor: solicitudes.filter((s) => s.tipoContrato === t).length }))
    .sort((a, b) => b.valor - a.valor);
}

export function cargaAbogados(solicitudes: Solicitud[]) {
  const carga = cargaPorAbogado(solicitudes);
  return ABOGADOS.map((a) => ({ etiqueta: a.nombre, valor: carga[a.id] })).sort((a, b) => b.valor - a.valor);
}
