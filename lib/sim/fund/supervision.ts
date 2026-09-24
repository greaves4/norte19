// Reglas de la vista del Supervisor: qué está en su bandeja, tiempos y validaciones al revisar.
import { isSameDay } from "date-fns";
import { hotelPorId } from "@/lib/fixtures/fund";
import {
  validarCategorias,
  validarRfcReceptor,
  validarVentana3Dias,
  type ResultadoValidacion,
} from "@/lib/sim/fund/validaciones";
import { esperaAutorizacion } from "@/lib/store/fund";
import type { Movimiento, Tarjeta, TipoEvento } from "@/lib/types/fund";

// Pendientes de aprobación y extemporáneos que esperan autorización.
export function enBandeja(m: Movimiento) {
  return m.estatus === "pendiente" || esperaAutorizacion(m);
}

// Desde cuándo espera: el envío a supervisión (o la solicitud de autorización / excepción aprobada).
const LLEGADA: TipoEvento[] = ["enviado", "autorizacion_solicitada", "excepcion_aprobada"];

export function llegadaABandeja(m: Movimiento): Date {
  const ev = [...m.timeline].reverse().find((e) => LLEGADA.includes(e.tipo));
  return new Date(ev?.fecha ?? m.fecha);
}

// Horas entre la llegada a la bandeja y la aprobación; null si no se aprobó.
export function horasDeAprobacion(m: Movimiento): number | null {
  const aprobado = m.timeline.find((e) => e.tipo === "aprobado");
  if (!aprobado) return null;
  const llegada = m.timeline.find((e) => LLEGADA.includes(e.tipo)) ?? m.timeline[0];
  return (new Date(aprobado.fecha).getTime() - new Date(llegada.fecha).getTime()) / 3_600_000;
}

export function promedioHorasAprobacion(movimientos: Movimiento[]): number | null {
  const horas = movimientos.map(horasDeAprobacion).filter((h): h is number => h !== null);
  return horas.length ? horas.reduce((s, h) => s + h, 0) / horas.length : null;
}

export function aprobadosEnDia(movimientos: Movimiento[], dia: Date) {
  return movimientos.filter((m) => m.timeline.some((e) => e.tipo === "aprobado" && isSameDay(new Date(e.fecha), dia))).length;
}

// Validaciones automáticas al revisar: se evalúan contra la fecha de registro, no contra hoy.
export function validacionesMovimiento(m: Movimiento, tarjeta: Tarjeta): ResultadoValidacion[] {
  const tieneXml = m.comprobantes.some((c) => c.tipo === "xml");
  const tieneDocumento = m.comprobantes.some((c) => c.tipo !== "xml");
  const documental: ResultadoValidacion =
    tieneXml && tieneDocumento
      ? { id: "documental", nivel: "ok", titulo: "Documento y XML coinciden", detalle: "Hay XML y comprobante; el monto cargado es el total del CFDI." }
      : { id: "documental", nivel: "advertencia", titulo: "Falta documentación", detalle: `No se adjuntó ${!tieneXml ? "el XML" : "el comprobante"}.` };

  const ventanaBase = validarVentana3Dias(new Date(m.fechaEmisionCfdi), new Date(m.fecha));
  const ventana: ResultadoValidacion =
    ventanaBase.nivel === "bloqueo"
      ? {
          ...ventanaBase,
          titulo: "Registrado fuera de la ventana de 3 días",
          detalle: `La factura se registró ${ventanaBase.diasTranscurridos} días después de emitirse. Requiere tu autorización.`,
        }
      : ventanaBase;

  const categoriaBase = validarCategorias(m.conceptos, tarjeta.categoriasBloqueadas);
  const categoria: ResultadoValidacion =
    categoriaBase.nivel === "bloqueo" && m.excepcionSolicitada?.estatus === "aprobada"
      ? { id: "categoria", nivel: "ok", titulo: "Excepción aprobada por Tesorería", detalle: categoriaBase.titulo }
      : categoriaBase;

  const rfc = validarRfcReceptor(m.rfcReceptor, hotelPorId(m.hotelId)?.rfc ?? "");
  return [documental, ventana, categoria, rfc];
}
