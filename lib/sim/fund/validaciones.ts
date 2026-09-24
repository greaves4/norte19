// Validaciones del registro de movimientos. Cada una devuelve un resultado listo para pintar un semáforo.
import { startOfDay, subDays } from "date-fns";
import { CATEGORIAS } from "@/lib/fixtures/fund/categorias";
import type { Categoria, ConceptoCfdi } from "@/lib/types/fund";

export type NivelValidacion = "ok" | "advertencia" | "bloqueo" | "pendiente";

export type ResultadoValidacion = {
  id: "ventana" | "categoria" | "rfc" | "documental";
  nivel: NivelValidacion;
  titulo: string;
  detalle: string;
};

export const VENTANA_DIAS = 3;
const TOLERANCIA = 0.01;

// Ventana de registro: la factura debe ser de hoy o de los 3 días anteriores (días de calendario).
export function validarVentana3Dias(fechaEmision: Date, now: Date): ResultadoValidacion & { diasTranscurridos: number } {
  const limite = subDays(startOfDay(now), VENTANA_DIAS);
  const diasTranscurridos = Math.floor((startOfDay(now).getTime() - startOfDay(fechaEmision).getTime()) / 86_400_000);
  if (fechaEmision > now) {
    return { id: "ventana", nivel: "advertencia", titulo: "Fecha de emisión futura", detalle: "La fecha del CFDI es posterior a la fecha actual. Revisa el archivo.", diasTranscurridos };
  }
  if (fechaEmision < limite) {
    return {
      id: "ventana",
      nivel: "bloqueo",
      titulo: "Fuera de la ventana de 3 días",
      detalle: "El movimiento está fuera de la ventana de registro de 3 días. Requiere autorización del supervisor.",
      diasTranscurridos,
    };
  }
  return {
    id: "ventana",
    nivel: "ok",
    titulo: "Dentro de la ventana de 3 días",
    detalle: diasTranscurridos === 0 ? "Factura emitida hoy." : `Factura emitida hace ${diasTranscurridos} ${diasTranscurridos === 1 ? "día" : "días"}.`,
    diasTranscurridos,
  };
}

// Categoría bloqueada: algún concepto usa una clave producto/servicio de una categoría bloqueada para la tarjeta.
export function validarCategorias(
  conceptos: Pick<ConceptoCfdi, "claveProdServ" | "descripcion">[],
  categoriasBloqueadas: string[],
): ResultadoValidacion & { bloqueadas: Categoria[] } {
  const bloqueadas = CATEGORIAS.filter(
    (cat) => categoriasBloqueadas.includes(cat.id) && conceptos.some((c) => cat.clavesProdServ.includes(c.claveProdServ)),
  );
  if (bloqueadas.length > 0) {
    const nombres = bloqueadas.map((c) => c.nombre).join(", ");
    return {
      id: "categoria",
      nivel: "bloqueo",
      titulo: `Categoría bloqueada: ${nombres}`,
      detalle: `La categoría ${nombres} está bloqueada para esta tarjeta. Solicita una excepción a Tesorería.`,
      bloqueadas,
    };
  }
  return { id: "categoria", nivel: "ok", titulo: "Categoría permitida", detalle: "Ningún concepto cae en una categoría bloqueada.", bloqueadas };
}

// RFC receptor: advertencia no bloqueante si la factura no está a nombre del hotel.
export function validarRfcReceptor(rfc: string, rfcHotel: string): ResultadoValidacion {
  if (rfc.trim().toUpperCase() === rfcHotel.trim().toUpperCase()) {
    return { id: "rfc", nivel: "ok", titulo: "RFC receptor correcto", detalle: `La factura está a nombre del hotel (${rfcHotel}).` };
  }
  return {
    id: "rfc",
    nivel: "advertencia",
    titulo: "RFC receptor distinto al del hotel",
    detalle: `El RFC receptor del CFDI (${rfc}) no coincide con el del hotel (${rfcHotel}). Puedes continuar, pero el gasto podría no ser deducible.`,
  };
}

// Validación documental condicional (RF01): XML + comprobante + total igual al monto capturado.
export function validarDocumental(
  cfdi: { total: number } | null,
  montoCapturado: number | null,
  tieneComprobante: boolean,
): ResultadoValidacion & { diferencia: number | null } {
  if (!cfdi || !tieneComprobante) {
    const falta = [!cfdi && "el XML", !tieneComprobante && "el comprobante"].filter(Boolean).join(" y ");
    return { id: "documental", nivel: "pendiente", titulo: "Validación documental pendiente", detalle: `Falta cargar ${falta}.`, diferencia: null };
  }
  const monto = montoCapturado ?? cfdi.total;
  const diferencia = Math.round((monto - cfdi.total) * 100) / 100;
  if (Math.abs(diferencia) < TOLERANCIA) {
    return { id: "documental", nivel: "ok", titulo: "Coincidencia verificada", detalle: "El monto coincide con el total del CFDI.", diferencia: 0 };
  }
  return {
    id: "documental",
    nivel: "advertencia",
    titulo: "Diferencia contra el CFDI",
    detalle: `El monto capturado difiere del total del CFDI por ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Math.abs(diferencia))}.`,
    diferencia,
  };
}

// Hay algún bloqueo que impide enviar a supervisión de forma normal.
export function hayBloqueo(resultados: ResultadoValidacion[]) {
  return resultados.some((r) => r.nivel === "bloqueo");
}
