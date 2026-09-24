import { beforeEach, describe, expect, it } from "vitest";
import { HOTEL_DEMO_ID, TARJETA_DEMO_ID } from "@/lib/fixtures/fund";
import { useFund } from "@/lib/store/fund";
import type { NuevoMovimiento } from "@/lib/types/fund";

const store = () => useFund.getState();
const mov = (id: string) => store().movimientos.find((m) => m.id === id)!;
const tarjeta = (id: string) => store().tarjetas.find((t) => t.id === id)!;

const NUEVO: NuevoMovimiento = {
  hotelId: HOTEL_DEMO_ID,
  tarjetaId: TARJETA_DEMO_ID,
  fechaEmisionCfdi: new Date().toISOString(),
  proveedor: "Limpieza Peninsular, S.A. de C.V.",
  rfcEmisor: "LPE150612J41",
  rfcReceptor: "HCA110315KT4",
  uuid: "6F1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D",
  conceptos: [{ descripcion: "Servicio de limpieza", claveProdServ: "76111501", importe: 1000 }],
  subtotal: 1000,
  iva: 160,
  total: 1160,
  centroCostos: "limpieza",
  notas: "",
  comprobantes: [],
};

beforeEach(() => store().reset());

describe("store de Fund", () => {
  it("recorre registrado → pendiente → aprobado con timeline", () => {
    const saldo = tarjeta(TARJETA_DEMO_ID).saldo;
    const id = store().crearMovimiento(NUEVO, "Mariana Cruz Pech");
    expect(mov(id).estatus).toBe("registrado");
    expect(tarjeta(TARJETA_DEMO_ID).saldo).toBeCloseTo(saldo - 1160);

    expect(store().aprobar(id, "Ricardo Salas Uc")).toBe(false); // aún no está en supervisión
    expect(store().enviarASupervision(id, "Mariana Cruz Pech")).toBe(true);
    expect(store().aprobar(id, "Ricardo Salas Uc")).toBe(true);
    expect(mov(id).estatus).toBe("aprobado");
    expect(mov(id).timeline.map((e) => e.tipo)).toEqual(["registrado", "enviado", "aprobado"]);
  });

  it("rechaza con motivo y autoriza con segunda justificación", () => {
    const pendiente = store().movimientos.find((m) => m.hotelId === HOTEL_DEMO_ID && m.estatus === "pendiente")!;
    expect(store().rechazar(pendiente.id, "Ricardo Salas Uc", "Falta comprobante")).toBe(true);
    expect(mov(pendiente.id).motivoRechazo).toBe("Falta comprobante");
    expect(store().autorizarRechazado(pendiente.id, "Ricardo Salas Uc", "Se recibió por correo")).toBe(true);
    expect(mov(pendiente.id).estatus).toBe("autorizado");
    expect(store().autorizarRechazado(pendiente.id, "Ricardo Salas Uc", "otra vez")).toBe(false);
  });

  it("resuelve excepciones de categoría", () => {
    const [a, b] = store().movimientos.filter((m) => m.excepcionSolicitada?.estatus === "pendiente");
    expect(store().resolverExcepcion(a.id, true)).toBe(true);
    expect(mov(a.id).estatus).toBe("pendiente");
    expect(store().resolverExcepcion(b.id, false)).toBe(true);
    expect(mov(b.id).estatus).toBe("rechazado");
  });

  it("deposita fondeos: sube el saldo y agrega el abono al estado de cuenta", () => {
    const saldo = tarjeta(TARJETA_DEMO_ID).saldo;
    const abonos = store().estadoCuenta.length;
    const id = store().registrarFondeo(TARJETA_DEMO_ID, 5000, "manual");
    store().actualizarEstatusFondeo(id, "aceptado");
    expect(tarjeta(TARJETA_DEMO_ID).saldo).toBe(saldo);
    store().actualizarEstatusFondeo(id, "depositado");
    expect(tarjeta(TARJETA_DEMO_ID).saldo).toBeCloseTo(saldo + 5000);
    expect(store().estadoCuenta).toHaveLength(abonos + 1);
  });

  it("aplica la carga masiva y reporta filas inválidas", () => {
    const { ultimosCuatro } = tarjeta(TARJETA_DEMO_ID);
    const bloqueada = store().tarjetas.find((t) => t.estatus === "bloqueada")!;
    const r = store().aplicarCargaMasiva([
      { ultimosCuatro, monto: 1500, referencia: "LOTE-1" },
      { ultimosCuatro: "0000", monto: 1500, referencia: "LOTE-2" },
      { ultimosCuatro: bloqueada.ultimosCuatro, monto: 1500, referencia: "LOTE-3" },
      { ultimosCuatro, monto: 0, referencia: "LOTE-4" },
    ]);
    expect(r.aplicadas).toHaveLength(1);
    expect(r.errores.map((e) => e.fila)).toEqual([3, 4, 5]);
  });

  it("bloquea categorías y tarjetas, y configura el corte global", () => {
    store().bloquearCategoria(TARJETA_DEMO_ID, "restaurantes", true);
    expect(tarjeta(TARJETA_DEMO_ID).categoriasBloqueadas).toContain("restaurantes");
    store().bloquearCategoria(TARJETA_DEMO_ID, "restaurantes", false);
    expect(tarjeta(TARJETA_DEMO_ID).categoriasBloqueadas).not.toContain("restaurantes");
    store().bloquearTarjeta(TARJETA_DEMO_ID, true);
    expect(tarjeta(TARJETA_DEMO_ID).estatus).toBe("bloqueada");
    store().configurarCorte("global", "mensual");
    expect(store().tarjetas.every((t) => t.corte === "mensual")).toBe(true);
  });

  it("la sincronización resuelve una discrepancia y el reset restaura el estado", () => {
    const { sinVincular } = store().discrepancias;
    expect(mov(sinVincular.movimientoId).referenciaBancaria).toBeNull();
    store().sincronizarConciliacion();
    expect(mov(sinVincular.movimientoId).referenciaBancaria).toBe(sinVincular.referencia);
    expect(store().conciliacion.sincronizaciones).toBe(1);

    store().reset();
    expect(mov(sinVincular.movimientoId).referenciaBancaria).toBeNull();
    expect(store().movimientos.filter((m) => m.hotelId === HOTEL_DEMO_ID && m.estatus === "pendiente")).toHaveLength(6);
  });
});
