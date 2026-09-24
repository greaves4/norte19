import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CFDI_EJEMPLOS, RECEPTOR_CANCUN } from "@/lib/fixtures/fund/cfdiEjemplos";
import { HOTEL_DEMO_ID, hotelPorId, proveedorPorSlug } from "@/lib/fixtures/fund";
import { CfdiError, fechaEmision, parseCfdi } from "@/lib/sim/fund/cfdi";
import { calcularTotales } from "@/lib/sim/fund/cfdiXml";
import { crearXmlEjemplo } from "@/lib/sim/fund/ejemplos";

const HOY = new Date(2026, 8, 24, 15, 30); // 24 sep 2026, 15:30 local
const UUID = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
const DIR_COMPROBANTES = join(process.cwd(), "public/fixtures/fund/comprobantes");

describe("parseCfdi con los CFDI de ejemplo", () => {
  it.each(CFDI_EJEMPLOS.map((e) => [e.id, e] as const))("lee %s", (_, ejemplo) => {
    const cfdi = parseCfdi(crearXmlEjemplo(ejemplo.id, HOY));
    const totales = calcularTotales(ejemplo.conceptos);

    expect(cfdi.version).toBe("4.0");
    expect(cfdi.uuid).toMatch(UUID);
    expect(cfdi.rfcEmisor).toBe(ejemplo.emisor.rfc);
    expect(cfdi.nombreEmisor).toBe(ejemplo.emisor.nombre);
    expect(cfdi.rfcReceptor).toBe(RECEPTOR_CANCUN.rfc);
    expect(cfdi.subtotal).toBe(totales.subtotal);
    expect(cfdi.iva).toBe(totales.iva);
    expect(cfdi.total).toBe(totales.total);
    expect(cfdi.conceptos.map((c) => c.claveProdServ)).toEqual(ejemplo.conceptos.map((c) => c.claveProdServ));
    expect(cfdi.conceptos.map((c) => c.importe)).toEqual(totales.partidas.map((p) => p.importe));

    // La fecha de emisión es relativa al "hoy" del reloj de demo.
    const emision = fechaEmision(cfdi);
    const esperado = new Date(HOY);
    esperado.setDate(esperado.getDate() - ejemplo.diasAtras);
    expect(emision.toDateString()).toBe(esperado.toDateString());
    expect(emision.getTime()).toBeLessThanOrEqual(HOY.getTime());
  });

  it("el receptor de los ejemplos es el hotel de la demo", () => {
    expect(RECEPTOR_CANCUN.rfc).toBe(hotelPorId(HOTEL_DEMO_ID)!.rfc);
  });

  it("la factura de hoy nunca queda en el futuro, aunque sea temprano", () => {
    const temprano = new Date(2026, 8, 24, 8, 0);
    const emision = fechaEmision(parseCfdi(crearXmlEjemplo("restaurante-marisol", temprano)));
    expect(emision.getTime()).toBeLessThan(temprano.getTime());
    expect(emision.toDateString()).toBe(temprano.toDateString());
  });
});

describe("parseCfdi con los comprobantes estáticos por proveedor", () => {
  const archivos = readdirSync(DIR_COMPROBANTES).filter((f) => f.endsWith(".xml"));

  it("hay un XML por proveedor", () => {
    expect(archivos.length).toBe(18);
  });

  it.each(archivos)("lee %s", (archivo) => {
    const cfdi = parseCfdi(readFileSync(join(DIR_COMPROBANTES, archivo), "utf8"));
    const proveedor = proveedorPorSlug(archivo.replace(".xml", ""))!;
    expect(cfdi.rfcEmisor).toBe(proveedor.rfc);
    expect(cfdi.uuid).toMatch(UUID);
    expect(cfdi.conceptos.map((c) => c.claveProdServ)).toEqual(proveedor.conceptos.map((c) => c.claveProdServ));
    expect(Math.abs(cfdi.subtotal + cfdi.iva - cfdi.total)).toBeLessThan(0.011);
  });
});

describe("parseCfdi con archivos inválidos", () => {
  const valido = crearXmlEjemplo("limpieza-peninsular", HOY);

  it("rechaza texto que no es XML", () => {
    expect(() => parseCfdi("esto no es un xml <")).toThrow(CfdiError);
  });

  it("rechaza XML que no es CFDI", () => {
    expect(() => parseCfdi('<?xml version="1.0"?><factura total="10"/>')).toThrow(/no es un CFDI/);
  });

  it("rechaza CFDI 3.3", () => {
    expect(() => parseCfdi(valido.replace('Version="4.0"', 'Version="3.3"'))).toThrow(/Solo se aceptan CFDI 4.0/);
  });

  it("rechaza CFDI sin timbre", () => {
    const sinTimbre = valido.replace(/<cfdi:Complemento>[\s\S]*<\/cfdi:Complemento>/, "");
    expect(() => parseCfdi(sinTimbre)).toThrow(/no está timbrado/);
  });
});
