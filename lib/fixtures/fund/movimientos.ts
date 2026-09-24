import { HOTEL_DEMO_ID, HOTELES } from "@/lib/fixtures/fund/hoteles";
import {
  PROVEEDORES,
  PROVEEDORES_BLOQUEADOS,
  proveedorPorSlug,
  type Proveedor,
} from "@/lib/fixtures/fund/proveedores";
import { categoriaPorClave } from "@/lib/fixtures/fund/categorias";
import { redondear, sumarHoras, uuid, type Rng } from "@/lib/fixtures/fund/semilla";
import type { EstatusMovimiento, EventoMovimiento, Hotel, Movimiento } from "@/lib/types/fund";

const TOTAL_MOVIMIENTOS = 120;
const MOVIMIENTOS_CANCUN = 32;
const DIAS_HISTORIAL = 60;

// Los 6 pendientes de la sesión del Supervisor en Cancún, con horas en bandeja variadas.
const PENDIENTES_CANCUN: { proveedor: string; horasAtras: number }[] = [
  { proveedor: "limpieza-peninsular", horasAtras: 3 },
  { proveedor: "ferreteria-caribe", horasAtras: 7 },
  { proveedor: "restaurante-marisol", horasAtras: 12 },
  { proveedor: "gas-sureste", horasAtras: 20 },
  { proveedor: "lavanderia-industrial", horasAtras: 27 },
  { proveedor: "clima-golfo", horasAtras: 40 },
];

const MOTIVOS_RECHAZO = [
  "El comprobante no corresponde al CFDI cargado.",
  "Gasto que debe tramitarse por Compras, no por caja chica.",
  "El monto excede lo cotizado con el proveedor.",
  "Falta el comprobante de pago legible.",
];

const MOTIVOS_AUTORIZACION = [
  "Se validó con el proveedor; el comprobante correcto se envió por correo.",
  "Gasto urgente por operación; autorizado por gerencia.",
];

type Plan = {
  hotel: Hotel;
  proveedor: Proveedor;
  fecha: Date;
  estatus: EstatusMovimiento;
  extemporaneo?: boolean;
  excepcion?: boolean;
};

// 120 movimientos de los últimos 60 días. Determinista: depende solo de la semilla y de `hoy`.
export function crearMovimientos(rng: Rng, hoy: Date): Movimiento[] {
  const planes: Plan[] = [];
  const cancun = HOTELES.find((h) => h.id === HOTEL_DEMO_ID)!;
  const otros = HOTELES.filter((h) => h.id !== HOTEL_DEMO_ID);

  // Cancún: 6 pendientes recientes, 1 rechazado sin autorizar, 1 autorizado y el resto aprobados.
  for (const p of PENDIENTES_CANCUN) {
    planes.push({ hotel: cancun, proveedor: proveedorPorSlug(p.proveedor)!, fecha: sumarHoras(hoy, -p.horasAtras), estatus: "pendiente" });
  }
  planes.push({ hotel: cancun, proveedor: proveedorPorSlug("materiales-construccion")!, fecha: fechaAtras(rng, hoy, 9, 11), estatus: "rechazado" });
  planes.push({ hotel: cancun, proveedor: proveedorPorSlug("taxis-ejecutivos")!, fecha: fechaAtras(rng, hoy, 18, 22), estatus: "autorizado" });
  const restantesCancun = MOVIMIENTOS_CANCUN - planes.length;
  for (let i = 0; i < restantesCancun; i++) {
    // Repartidos de forma pareja entre hace 58 y hace 3 días.
    const dias = 3 + ((DIAS_HISTORIAL - 5) * i) / restantesCancun;
    planes.push({ hotel: cancun, proveedor: rng.pick(PROVEEDORES), fecha: fechaAtras(rng, hoy, dias, dias + 1), estatus: "aprobado" });
  }

  // Casos especiales en otros hoteles para Tesorería y Supervisor.
  const especiales: Plan[] = [
    { hotel: porId("ce-mty-uni"), proveedor: PROVEEDORES_BLOQUEADOS[0], fecha: sumarHoras(hoy, -30), estatus: "registrado", excepcion: true },
    { hotel: porId("ce-mid"), proveedor: PROVEEDORES_BLOQUEADOS[1], fecha: sumarHoras(hoy, -52), estatus: "registrado", excepcion: true },
    { hotel: porId("ce-qro"), proveedor: proveedorPorSlug("papeleria-tulum")!, fecha: sumarHoras(hoy, -18), estatus: "registrado", extemporaneo: true },
  ];
  planes.push(...especiales);

  // Resto repartido entre los otros 19 hoteles.
  const restantes = TOTAL_MOVIMIENTOS - planes.length;
  for (let i = 0; i < restantes; i++) {
    const hotel = otros[i % otros.length];
    const fecha = fechaAtras(rng, hoy, 0.3, DIAS_HISTORIAL);
    const edadHoras = (hoy.getTime() - fecha.getTime()) / 3_600_000;
    planes.push({ hotel, proveedor: rng.pick(PROVEEDORES), fecha, estatus: edadHoras < 36 ? "pendiente" : estatusHistorico(rng) });
  }

  const movimientos = planes
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .map((plan, i) => construir(rng, plan, `mov-${String(i + 1).padStart(4, "0")}`, hoy));

  return movimientos;
}

function construir(rng: Rng, plan: Plan, id: string, hoy: Date): Movimiento {
  const { hotel, proveedor, fecha, estatus } = plan;
  const cantidad = rng.int(1, proveedor.conceptos.length);
  const conceptos = proveedor.conceptos.slice(0, cantidad).map((c) => ({
    descripcion: c.descripcion,
    claveProdServ: c.claveProdServ,
    importe: rng.money(c.min, c.max),
  }));
  const subtotal = redondear(conceptos.reduce((s, c) => s + c.importe, 0));
  const iva = redondear(subtotal * 0.16);
  const total = redondear(subtotal + iva);
  // La factura se emite hasta 40 h antes del registro; los extemporáneos, de 4 a 6 días antes.
  const emision = plan.extemporaneo ? sumarHoras(fecha, -rng.int(96, 144)) : sumarHoras(fecha, -rng.int(1, 40));
  const folio = uuid(rng);
  const tipoComprobante = rng.next() < 0.7 ? "pdf" : "imagen";

  const base: Movimiento = {
    id,
    hotelId: hotel.id,
    tarjetaId: `tj-${hotel.id}`,
    fecha: fecha.toISOString(),
    fechaEmisionCfdi: emision.toISOString(),
    proveedor: proveedor.nombre,
    rfcEmisor: proveedor.rfc,
    rfcReceptor: hotel.rfc,
    uuid: folio,
    conceptos,
    subtotal,
    iva,
    total,
    centroCostos: proveedor.centroCostos,
    notas: "",
    comprobantes: [
      { tipo: "xml", nombre: `${folio.slice(0, 8)}.xml`, src: `/fixtures/fund/comprobantes/${proveedor.slug}.xml` },
      tipoComprobante === "pdf"
        ? { tipo: "pdf", nombre: `${folio.slice(0, 8)}.pdf`, src: `/fixtures/fund/comprobantes/${proveedor.slug}.pdf` }
        : { tipo: "imagen", nombre: `${folio.slice(0, 8)}.jpg`, src: `/fixtures/fund/comprobantes/${proveedor.slug}.jpg` },
    ],
    estatus,
    timeline: [],
    extemporaneo: Boolean(plan.extemporaneo),
    excepcionSolicitada: null,
    registradoPor: hotel.recepcion,
    referenciaBancaria: `PC${rng.digits(10)}`,
  };

  const timeline: EventoMovimiento[] = [
    { fecha: fecha.toISOString(), tipo: "registrado", titulo: "Movimiento registrado", actor: hotel.recepcion, descripcion: `CFDI ${folio.slice(0, 8)} de ${proveedor.nombre}` },
  ];
  const enviado = sumarHoras(fecha, 0.05);

  if (plan.excepcion) {
    const categoria = categoriaPorClave(conceptos[0].claveProdServ)!;
    base.excepcionSolicitada = { categoriaId: categoria.id, estatus: "pendiente", fecha: enviado.toISOString() };
    timeline.push({ fecha: enviado.toISOString(), tipo: "excepcion_solicitada", titulo: "Excepción solicitada a Tesorería", actor: hotel.recepcion, descripcion: `Categoría bloqueada: ${categoria.nombre}` });
  } else if (plan.extemporaneo) {
    timeline.push({ fecha: enviado.toISOString(), tipo: "autorizacion_solicitada", titulo: "Autorización solicitada", actor: hotel.recepcion, descripcion: "Registro fuera de la ventana de 3 días." });
  } else if (estatus !== "registrado") {
    timeline.push({ fecha: enviado.toISOString(), tipo: "enviado", titulo: "Enviado a supervisión", actor: hotel.recepcion });
  }

  // Cancún aprueba rápido (2–10 h); el resto, entre 1 y 30 h. Nunca después de `hoy`.
  const horasDecision = hotel.id === HOTEL_DEMO_ID ? rng.int(2, 10) : rng.int(1, 30);
  const decision = minFecha(sumarHoras(enviado, horasDecision), sumarHoras(hoy, -0.5));

  if (estatus === "aprobado") {
    timeline.push({ fecha: decision.toISOString(), tipo: "aprobado", titulo: "Aprobado", actor: hotel.supervisor });
  }
  if (estatus === "rechazado" || estatus === "autorizado") {
    const motivo = rng.pick(MOTIVOS_RECHAZO);
    base.motivoRechazo = motivo;
    timeline.push({ fecha: decision.toISOString(), tipo: "rechazado", titulo: "Rechazado", actor: hotel.supervisor, descripcion: motivo });
  }
  if (estatus === "autorizado") {
    const motivo = rng.pick(MOTIVOS_AUTORIZACION);
    base.motivoAutorizacion = motivo;
    const autorizacion = minFecha(sumarHoras(decision, rng.int(2, 24)), sumarHoras(hoy, -0.25));
    timeline.push({ fecha: autorizacion.toISOString(), tipo: "autorizado", titulo: "Autorizado tras rechazo", actor: hotel.supervisor, descripcion: motivo });
  }

  return { ...base, timeline };
}

function estatusHistorico(rng: Rng): EstatusMovimiento {
  const r = rng.next();
  if (r < 0.84) return "aprobado";
  if (r < 0.93) return "rechazado";
  return "autorizado";
}

function fechaAtras(rng: Rng, hoy: Date, minDias: number, maxDias: number) {
  const horas = (minDias + rng.next() * (maxDias - minDias)) * 24;
  const fecha = sumarHoras(hoy, -horas);
  // Horario de operación del hotel: entre 7:00 y 22:00.
  fecha.setHours(rng.int(7, 21), rng.int(0, 59), 0, 0);
  return fecha > hoy ? sumarHoras(hoy, -1) : fecha;
}

function minFecha(a: Date, b: Date) {
  return a < b ? a : b;
}

function porId(id: string) {
  return HOTELES.find((h) => h.id === id)!;
}
