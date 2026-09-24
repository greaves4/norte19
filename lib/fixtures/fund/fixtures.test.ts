import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATEGORIAS,
  CATEGORIAS_BLOQUEADAS_POR_DEFECTO,
  CENTROS_COSTOS,
  HOTEL_DEMO_ID,
  HOTELES,
  PROVEEDORES,
  PROVEEDORES_BLOQUEADOS,
  TARJETA_DEMO_ID,
  categoriaPorClave,
  crearDatosFund,
} from "@/lib/fixtures/fund";
import { parseCfdi } from "@/lib/sim/fund/cfdi";

const HOY = new Date("2026-09-23T15:00:00-06:00");
const datos = crearDatosFund(HOY);

// RFC de persona moral: 3 letras, fecha AAMMDD válida y homoclave de 3 caracteres.
function rfcValido(rfc: string) {
  const m = /^[A-ZÑ&]{3}(\d{2})(\d{2})(\d{2})[A-Z0-9]{3}$/.exec(rfc);
  if (!m) return false;
  const [, , mes, dia] = m.map(Number);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
}

describe("fixtures de Fund", () => {
  it("son deterministas para la misma fecha", () => {
    expect(crearDatosFund(HOY)).toEqual(datos);
  });

  it("tienen los tamaños del documento", () => {
    expect(HOTELES).toHaveLength(20);
    expect(datos.tarjetas).toHaveLength(20);
    expect(CENTROS_COSTOS).toHaveLength(7);
    expect(CATEGORIAS).toHaveLength(38);
    expect(datos.movimientos).toHaveLength(120);
    expect(datos.estadoCuenta).toHaveLength(40);
  });

  it("dejan 6 pendientes en Cancún Aeropuerto", () => {
    const pendientes = datos.movimientos.filter((m) => m.hotelId === HOTEL_DEMO_ID && m.estatus === "pendiente");
    expect(pendientes).toHaveLength(6);
    expect(pendientes.map((m) => m.proveedor)).toEqual(
      expect.arrayContaining(["Limpieza Peninsular, S.A. de C.V.", "Ferretería del Caribe, S.A. de C.V."]),
    );
  });

  it("bloquean por defecto las 5 categorías indicadas", () => {
    expect(CATEGORIAS_BLOQUEADAS_POR_DEFECTO.sort()).toEqual(
      ["aerolineas", "casinos", "entretenimiento-adulto", "joyerias", "servicios-financieros"].sort(),
    );
    for (const t of datos.tarjetas) expect(t.categoriasBloqueadas.sort()).toEqual(CATEGORIAS_BLOQUEADAS_POR_DEFECTO.sort());
  });

  it("usan RFC con formato válido", () => {
    for (const h of HOTELES) expect(rfcValido(h.rfc), h.rfc).toBe(true);
    for (const p of [...PROVEEDORES, ...PROVEEDORES_BLOQUEADOS]) expect(rfcValido(p.rfc), p.rfc).toBe(true);
  });

  it("nunca contienen un PAN completo", () => {
    expect(JSON.stringify(datos)).not.toMatch(/(?<!\d)\d{15,16}(?!\d)/);
    for (const t of datos.tarjetas) expect(t.ultimosCuatro).toMatch(/^\d{4}$/);
    expect(new Set(datos.tarjetas.map((t) => t.ultimosCuatro)).size).toBe(20);
  });

  it("tienen saldos entre cero y el presupuesto", () => {
    for (const t of datos.tarjetas) {
      expect(t.saldo).toBeGreaterThanOrEqual(0);
      expect(t.saldo).toBeLessThanOrEqual(t.presupuesto);
      expect(t.presupuesto).toBeGreaterThanOrEqual(15_000);
      expect(t.presupuesto).toBeLessThanOrEqual(60_000);
      expect(t.ultimoFondeo).not.toBeNull();
    }
  });

  it("ubican los movimientos en los últimos 60 días con timeline coherente", () => {
    const limite = HOY.getTime() - 61 * 86_400_000;
    for (const m of datos.movimientos) {
      expect(new Date(m.fecha).getTime()).toBeGreaterThan(limite);
      expect(new Date(m.fecha).getTime()).toBeLessThanOrEqual(HOY.getTime());
      expect(m.timeline[0].tipo).toBe("registrado");
      const fechas = m.timeline.map((e) => e.fecha);
      expect(fechas).toEqual([...fechas].sort());
      expect(fechas.every((f) => new Date(f) <= HOY)).toBe(true);
      expect(Math.abs(m.subtotal + m.iva - m.total)).toBeLessThan(0.011);

      const tipos = m.timeline.map((e) => e.tipo);
      if (m.estatus === "aprobado") expect(tipos).toContain("aprobado");
      if (m.estatus === "rechazado") expect(m.motivoRechazo).toBeTruthy();
      if (m.estatus === "autorizado") expect(tipos).toEqual(expect.arrayContaining(["rechazado", "autorizado"]));
    }
  });

  it("solo usan categorías bloqueadas en las solicitudes de excepción", () => {
    for (const m of datos.movimientos) {
      for (const c of m.conceptos) {
        const categoria = categoriaPorClave(c.claveProdServ);
        expect(categoria, c.claveProdServ).toBeDefined();
        if (!m.excepcionSolicitada) expect(categoria!.bloqueadaPorDefecto).toBe(false);
      }
    }
    expect(datos.movimientos.filter((m) => m.excepcionSolicitada?.estatus === "pendiente")).toHaveLength(2);
  });

  it("siembran exactamente 2 discrepancias en el estado de cuenta de Cancún", () => {
    const cancun = datos.movimientos.filter((m) => m.tarjetaId === TARJETA_DEMO_ID);
    const fondeos = datos.fondeos.filter((f) => f.tarjetaId === TARJETA_DEMO_ID);
    const problemas = datos.estadoCuenta.flatMap((b) => {
      const sistema =
        b.tipo === "cargo"
          ? cancun.find((m) => m.referenciaBancaria === b.referencia)?.total
          : fondeos.find((f) => f.referencia === b.referencia)?.monto;
      if (sistema === undefined) return ["sin_registro"];
      return sistema === b.monto ? [] : ["no_cuadrado"];
    });
    expect(problemas.sort()).toEqual(["no_cuadrado", "sin_registro"]);
  });

  it("los movimientos que revisa el Supervisor coinciden con su comprobante", () => {
    const revisables = datos.movimientos.filter(
      (m) => m.hotelId === HOTEL_DEMO_ID && ["pendiente", "rechazado", "autorizado"].includes(m.estatus),
    );
    expect(revisables).toHaveLength(8);
    for (const m of revisables) {
      const xml = m.comprobantes.find((c) => c.tipo === "xml")!.src;
      const cfdi = parseCfdi(readFileSync(join(process.cwd(), "public", xml), "utf8"));
      expect({ uuid: m.uuid, total: m.total, subtotal: m.subtotal, iva: m.iva }).toEqual({
        uuid: cfdi.uuid,
        total: cfdi.total,
        subtotal: cfdi.subtotal,
        iva: cfdi.iva,
      });
    }
  });
});
