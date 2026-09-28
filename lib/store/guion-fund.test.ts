// Guion de validación de Fund (sección 7 del documento) recorrido contra el store y las simulaciones, con los tres perfiles.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { HOTEL_DEMO_ID, hotelPorId, TARJETA_DEMO_ID, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { comprobanteDeUpload, comprobanteXml } from "@/lib/sim/fund/archivos";
import { archivoEjemplo, leerExcel, revisarFilas } from "@/lib/sim/fund/cargaMasiva";
import { fechaEmision, parseCfdi, type Cfdi } from "@/lib/sim/fund/cfdi";
import { conciliar, contarPorEstatus } from "@/lib/sim/fund/conciliacion";
import { crearXmlEjemplo, FIXTURES_COMPROBANTE, FIXTURES_XML, leerXmlDeUpload } from "@/lib/sim/fund/ejemplos";
import { dispersar } from "@/lib/sim/fund/payconnect";
import { aprobadosDelCorte, calcularRefondeo } from "@/lib/sim/fund/refondeo";
import { fondeosPorMes, gastoPorCentro, slaPorHotel } from "@/lib/sim/fund/reportes";
import { aprobadosEnDia, enBandeja, horasDeAprobacion, validacionesMovimiento } from "@/lib/sim/fund/supervision";
import {
  hayBloqueo,
  validarCategorias,
  validarDocumental,
  validarRfcReceptor,
  validarVentana3Dias,
} from "@/lib/sim/fund/validaciones";
import { useFund } from "@/lib/store/fund";
import type { NuevoMovimiento } from "@/lib/types/fund";

const LUNES = new Date(2026, 8, 28, 10, 0);
const HORA = 3_600_000;
const store = () => useFund.getState();
const mov = (id: string) => store().movimientos.find((m) => m.id === id)!;
const tarjeta = () => store().tarjetas.find((t) => t.id === TARJETA_DEMO_ID)!;
const cancun = () => store().movimientos.filter((m) => m.hotelId === HOTEL_DEMO_ID);
const HOTEL = hotelPorId(HOTEL_DEMO_ID)!;
const { hotel: recepcion, supervisor, tesoreria } = USUARIOS_DEMO;

// Lo que hace el formulario de Nuevo movimiento al elegir "Usar archivo de ejemplo" para XML y comprobante.
async function cargarEjemplo(id: string) {
  const xml = await leerXmlDeUpload({ kind: "fixture", fixture: FIXTURES_XML.find((f) => f.id === id)! }, new Date());
  const cfdi = parseCfdi(xml);
  const comprobante = await comprobanteDeUpload({ kind: "fixture", fixture: FIXTURES_COMPROBANTE.find((f) => f.id === id)! });
  return { xml, cfdi, comprobante };
}

function validar(cfdi: Cfdi, monto: number | null = null) {
  return {
    ventana: validarVentana3Dias(fechaEmision(cfdi), new Date()),
    categoria: validarCategorias(cfdi.conceptos, tarjeta().categoriasBloqueadas),
    rfc: validarRfcReceptor(cfdi.rfcReceptor, HOTEL.rfc),
    documental: validarDocumental(cfdi, monto, true),
  };
}

function nuevo(id: string, { xml, cfdi, comprobante }: Awaited<ReturnType<typeof cargarEjemplo>>, centroCostos: string, extemporaneo = false): NuevoMovimiento {
  return {
    hotelId: HOTEL_DEMO_ID,
    tarjetaId: TARJETA_DEMO_ID,
    fechaEmisionCfdi: fechaEmision(cfdi).toISOString(),
    proveedor: cfdi.nombreEmisor,
    rfcEmisor: cfdi.rfcEmisor,
    rfcReceptor: cfdi.rfcReceptor,
    uuid: cfdi.uuid,
    conceptos: cfdi.conceptos,
    subtotal: cfdi.subtotal,
    iva: cfdi.iva,
    total: cfdi.total,
    centroCostos,
    notas: "",
    comprobantes: [comprobanteXml(xml, `${id}.xml`), comprobante],
    extemporaneo,
  };
}

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(LUNES);
  store().reset();
});
afterAll(() => vi.useRealTimers());

describe("guion de validación de Fund", () => {
  let limpiezaId = "";
  let aeromexicoId = "";
  let papeleriaId = "";
  let ferreteriaId = "";
  let saldoInicial = 0;

  it("Recepción: Limpieza Peninsular con el ejemplo, Aeroméxico bloqueada, factura de hace 6 días y su estatus", async () => {
    saldoInicial = tarjeta().saldo;

    // 1. El XML de ejemplo llena solos UUID, emisor, fecha, montos y claves; el semáforo queda en verde.
    const limpieza = await cargarEjemplo("limpieza-peninsular");
    expect(limpieza.cfdi.uuid).toMatch(/^[0-9A-F-]{36}$/);
    expect(limpieza.cfdi.rfcEmisor).toBe("LPE150612J41");
    expect(limpieza.cfdi.nombreEmisor).toBe("LIMPIEZA PENINSULAR");
    expect(limpieza.cfdi.conceptos.map((c) => c.claveProdServ)).toEqual(["76111501", "47131800"]);
    expect(limpieza.cfdi.subtotal + limpieza.cfdi.iva).toBeCloseTo(limpieza.cfdi.total, 2);
    const v = validar(limpieza.cfdi, limpieza.cfdi.total);
    expect([v.ventana, v.categoria, v.rfc, v.documental].map((x) => x.nivel)).toEqual(["ok", "ok", "ok", "ok"]);
    expect(v.documental.titulo).toBe("Coincidencia verificada");
    // Si se edita el monto, el semáforo documental avisa la diferencia (no bloquea).
    expect(validar(limpieza.cfdi, limpieza.cfdi.total + 50).documental.titulo).toBe("Diferencia contra el CFDI");
    // Un CFDI a nombre de otro receptor solo advierte.
    const otroReceptor = parseCfdi(crearXmlEjemplo("limpieza-peninsular", new Date()).replace(`Rfc="${HOTEL.rfc}"`, 'Rfc="XAXX010101000"'));
    expect(validar(otroReceptor).rfc.nivel).toBe("advertencia");

    limpiezaId = store().crearMovimiento(nuevo("limpieza-peninsular", limpieza, "limpieza"), recepcion.nombre);
    expect(store().enviarASupervision(limpiezaId, recepcion.nombre)).toBe(true);

    // 2. Aeroméxico: categoría Aerolíneas bloqueada → "Solicitar excepción" a Tesorería (no llega al supervisor).
    const aeromexico = await cargarEjemplo("aeromexico");
    const va = validar(aeromexico.cfdi);
    expect(va.categoria.nivel).toBe("bloqueo");
    expect(va.categoria.detalle).toBe("La categoría Aerolíneas está bloqueada para esta tarjeta. Solicita una excepción a Tesorería.");
    expect(hayBloqueo([va.ventana, va.categoria, va.rfc])).toBe(true);
    aeromexicoId = store().crearMovimiento(nuevo("aeromexico", aeromexico, "transporte"), recepcion.nombre);
    expect(store().solicitarExcepcion(aeromexicoId, va.categoria.bloqueadas[0].id, recepcion.nombre)).toBe(true);
    expect(mov(aeromexicoId).excepcionSolicitada).toMatchObject({ categoriaId: "aerolineas", estatus: "pendiente" });
    expect(enBandeja(mov(aeromexicoId))).toBe(false);

    // 3. Factura de hace 6 días: bloqueo por ventana → "Solicitar autorización" (registrado extemporáneo).
    const papeleria = await cargarEjemplo("papeleria-tulum");
    const vp = validar(papeleria.cfdi);
    expect(vp.ventana.nivel).toBe("bloqueo");
    expect(vp.ventana.diasTranscurridos).toBe(6);
    expect(vp.ventana.detalle).toBe("El movimiento está fuera de la ventana de registro de 3 días. Requiere autorización del supervisor.");
    papeleriaId = store().crearMovimiento(nuevo("papeleria-tulum", papeleria, "papeleria", true), recepcion.nombre);
    expect(mov(papeleriaId).estatus).toBe("registrado");
    expect(mov(papeleriaId).timeline.map((e) => e.tipo)).toEqual(["registrado", "autorizacion_solicitada"]);

    // 4. En su lista, el movimiento enviado está pendiente de aprobación; el saldo ya bajó por los tres cargos.
    expect(mov(limpiezaId).estatus).toBe("pendiente");
    expect(mov(limpiezaId).timeline.map((e) => e.tipo)).toEqual(["registrado", "enviado"]);
    const cargos = limpieza.cfdi.total + aeromexico.cfdi.total + papeleria.cfdi.total;
    expect(tarjeta().saldo).toBeCloseTo(saldoInicial - cargos, 2);
    // Filtros, exportación y vista de tablet del grid: solo UI.
  });

  it("Supervisor: +3 h, bandeja, revisión, aprueba, rechaza Ferretería y la autoriza desde Rechazados", () => {
    vi.setSystemTime(new Date(LUNES.getTime() + 3 * HORA));

    // 1. Pendientes: los 6 de fixtures + el enviado por Recepción + el extemporáneo que espera autorización.
    const bandeja = cancun().filter(enBandeja);
    expect(bandeja).toHaveLength(8);
    expect(bandeja.map((m) => m.id)).toEqual(expect.arrayContaining([limpiezaId, papeleriaId]));

    // 2. Revisión: el semáforo del recién enviado está en verde y tiene XML y comprobante.
    // Hay dos de Limpieza Peninsular en la bandeja (el de fixtures y el de Recepción); se revisa el de Recepción.
    expect(bandeja.filter((m) => /limpieza peninsular/i.test(m.proveedor))).toHaveLength(2);
    expect(mov(limpiezaId).comprobantes.map((c) => c.tipo)).toEqual(["xml", "pdf"]);
    expect(validacionesMovimiento(mov(limpiezaId), tarjeta()).map((v) => v.nivel)).toEqual(["ok", "ok", "ok", "ok"]);
    // El SplitViewer, el zoom y el indicador "Cargado en 0.4 s": solo UI.

    // 3. Aprueba Limpieza Peninsular y rechaza Ferretería del Caribe con motivo.
    const aprobadosAntes = aprobadosEnDia(cancun(), new Date());
    expect(store().aprobar(limpiezaId, supervisor.nombre)).toBe(true);
    expect(mov(limpiezaId).estatus).toBe("aprobado");
    expect(mov(limpiezaId).timeline.at(-1)).toMatchObject({ tipo: "aprobado", actor: supervisor.nombre });
    expect(horasDeAprobacion(mov(limpiezaId))).toBeCloseTo(3, 5);
    expect(aprobadosEnDia(cancun(), new Date())).toBe(aprobadosAntes + 1);

    const ferreteria = bandeja.find((m) => /ferreter[ií]a del caribe/i.test(m.proveedor) && m.estatus === "pendiente")!;
    ferreteriaId = ferreteria.id;
    expect(store().rechazar(ferreteriaId, supervisor.nombre, "El ticket no corresponde a la factura.")).toBe(true);
    expect(mov(ferreteriaId)).toMatchObject({ estatus: "rechazado", motivoRechazo: "El ticket no corresponde a la factura." });

    // Fuera del guion: el extemporáneo se revisa con la ventana en rojo y el supervisor lo autoriza (queda aprobado).
    expect(validacionesMovimiento(mov(papeleriaId), tarjeta()).find((v) => v.id === "ventana")!.titulo).toBe("Registrado fuera de la ventana de 3 días");
    expect(store().aprobar(papeleriaId, supervisor.nombre)).toBe(false); // no está en "pendiente"
    expect(store().autorizarExtemporaneo(papeleriaId, supervisor.nombre)).toBe(true);
    expect(mov(papeleriaId).estatus).toBe("aprobado");
    expect(cancun().filter(enBandeja)).toHaveLength(5);

    // 4. Rechazados: aparece con su motivo y se autoriza con segunda justificación.
    const rechazados = cancun().filter((m) => m.estatus === "rechazado");
    expect(rechazados.map((m) => m.id)).toContain(ferreteriaId);
    expect(store().autorizarRechazado(ferreteriaId, supervisor.nombre, "El proveedor envió el ticket correcto por correo.")).toBe(true);
    expect(mov(ferreteriaId)).toMatchObject({ estatus: "autorizado", motivoAutorizacion: "El proveedor envió el ticket correcto por correo." });
    expect(mov(ferreteriaId).timeline.map((e) => e.tipo).slice(-2)).toEqual(["rechazado", "autorizado"]);
    // "Aprobar seleccionados" en la bandeja llama a las mismas acciones por fila: solo UI.
  });

  it("Tesorería: saldo y gasto del corte, re-fondeo automático, Restaurantes, monitor, carga masiva y SLA", async () => {
    vi.setSystemTime(new Date(LUNES.getTime() + 5 * HORA));

    // 1. Tarjeta de Cancún: saldo y gasto aprobado del corte (aprobados + autorizado de la sesión).
    const aprobados = mov(limpiezaId).total + mov(papeleriaId).total + mov(ferreteriaId).total;
    expect(aprobadosDelCorte(tarjeta(), store().movimientos)).toBeCloseTo(aprobados, 2);
    expect(tarjeta().estatus).toBe("activa");

    // 2. Re-fondeo automático: presupuesto − saldo + aprobados, dispersado con Pay Connect.
    const calculo = calcularRefondeo(tarjeta(), store().movimientos);
    expect(calculo.presupuesto).toBe(40_000);
    expect(calculo.propuesto).toBeCloseTo(calculo.presupuesto - calculo.saldo + aprobados, 2);
    const d = dispersar(TARJETA_DEMO_ID, calculo.propuesto, "automatico");
    const fondeo = () => store().fondeos.find((f) => f.id === d.dispersiones[0].fondeoId)!;
    expect(d.pasos.map((p) => p.id)).toEqual(["enviado", "aceptado", "depositado"]);
    expect(fondeo()).toMatchObject({ estatus: "enviado", tipo: "automatico", actor: tesoreria.nombre });
    d.alTerminarPaso("enviado");
    d.alTerminarPaso("aceptado");
    expect(fondeo().estatus).toBe("aceptado");
    d.finalizar(); // se cerró el diálogo antes del webhook: el depósito llega igual
    expect(fondeo().estatus).toBe("depositado");
    // El saldo ya había bajado al registrar los cargos: la fórmula deja la tarjeta en presupuesto + aprobados.
    expect(tarjeta().saldo).toBeCloseTo(calculo.presupuesto + aprobados, 2);
    // Con el depósito empieza un corte nuevo: nada aprobado y nada por proponer.
    expect(aprobadosDelCorte(tarjeta(), store().movimientos)).toBe(0);
    expect(calcularRefondeo(tarjeta(), store().movimientos).propuesto).toBe(0);

    // 3. Bloquea "Restaurantes": la factura de Restaurante Marisol ya no pasaría en Recepción.
    const marisol = parseCfdi(crearXmlEjemplo("restaurante-marisol", new Date()));
    expect(validarCategorias(marisol.conceptos, tarjeta().categoriasBloqueadas).nivel).toBe("ok");
    store().bloquearCategoria(TARJETA_DEMO_ID, "restaurantes", true);
    expect(tarjeta().categoriasBloqueadas).toContain("restaurantes");
    expect(validarCategorias(marisol.conceptos, tarjeta().categoriasBloqueadas).titulo).toBe("Categoría bloqueada: Restaurantes");

    // Fuera del guion: la excepción de Aeroméxico espera a Tesorería; al aprobarla pasa a supervisión.
    expect(store().resolverExcepcion(aeromexicoId, true, tesoreria.nombre)).toBe(true);
    expect(mov(aeromexicoId).estatus).toBe("pendiente");
    expect(validacionesMovimiento(mov(aeromexicoId), tarjeta()).find((v) => v.id === "categoria")!.titulo).toBe("Excepción aprobada por Tesorería");

    // 4. Monitor: 2 discrepancias sembradas; al sincronizar se vincula una y queda la de monto distinto.
    const filas = () => conciliar(TARJETA_DEMO_ID, store().estadoCuenta, store().movimientos, store().fondeos);
    const abono = filas().find((f) => f.movimientoSistema?.tipo === "fondeo" && f.movimientoSistema.fondeo.id === fondeo().id)!;
    expect(abono.estatus).toBe("cuadrado"); // el re-fondeo de la sesión ya aparece en el estado de cuenta
    expect(contarPorEstatus(filas())).toEqual({ cuadrado: 39, no_cuadrado: 1, sin_registro: 1 });
    store().sincronizarConciliacion();
    expect(contarPorEstatus(filas())).toEqual({ cuadrado: 40, no_cuadrado: 1, sin_registro: 0 });
    const noCuadra = filas().find((f) => f.estatus === "no_cuadrado")!;
    expect(noCuadra.movimientoSistema).toMatchObject({ tipo: "movimiento", movimiento: { id: store().discrepancias.montoDistinto.movimientoId } });
    expect(noCuadra.diferencia).toBe(30);
    expect(store().conciliacion.ultimaSincronizacion).toBe(new Date().toISOString());

    // Fuera del guion: carga masiva con el Excel de ejemplo (5 filas válidas, 2 con error).
    const revisadas = revisarFilas(await leerExcel(await archivoEjemplo(store().tarjetas)), store().tarjetas);
    expect(revisadas.filter((f) => f.error)).toHaveLength(2);
    const fondeosAntes = store().fondeos.length;
    const r = store().aplicarCargaMasiva(revisadas.filter((f) => !f.error));
    expect(r.aplicadas).toHaveLength(5);
    expect(store().fondeos.slice(fondeosAntes).every((f) => f.estatus === "depositado" && f.tipo === "carga_masiva")).toBe(true);

    // 5. Reportes: el SLA de Cancún incluye las dos aprobaciones de la sesión (3 h cada una).
    const sla = slaPorHotel(store().movimientos).find((f) => f.hotelId === HOTEL_DEMO_ID)!;
    expect(sla.supervisor).toBe(supervisor.nombre);
    expect(sla.promedioHoras).toBeGreaterThan(0);
    expect(horasDeAprobacion(mov(papeleriaId))).toBeCloseTo(3, 5);
    // El gasto de Limpieza de la sesión aparece en el centro de costos y el re-fondeo en el historial del mes.
    const limpiezaCentro = gastoPorCentro(store().movimientos, HOTEL_DEMO_ID).find((c) => c.centroId === "limpieza")!;
    expect(limpiezaCentro.total).toBeGreaterThanOrEqual(mov(limpiezaId).total);
    const historial = fondeosPorMes(store().fondeos, new Date()).filas.find((f) => f.hotelId === HOTEL_DEMO_ID)!;
    expect(historial.porMes["2026-09"]).toBeGreaterThanOrEqual(calculo.propuesto);
    // Tabs, gráficas y "Ver tabla" de Reportes: solo UI.
  });

  it("Reiniciar demo restaura las fixtures: 6 pendientes en Cancún, sin Restaurantes y 2 discrepancias", () => {
    store().reset();
    expect(cancun().filter(enBandeja)).toHaveLength(6);
    expect(store().movimientos).toHaveLength(120);
    expect(tarjeta().categoriasBloqueadas).not.toContain("restaurantes");
    expect(tarjeta().saldo).toBeCloseTo(saldoInicial, 2);
    const filas = conciliar(TARJETA_DEMO_ID, store().estadoCuenta, store().movimientos, store().fondeos);
    expect(contarPorEstatus(filas)).toEqual({ cuadrado: 38, no_cuadrado: 1, sin_registro: 1 });
  });
});
