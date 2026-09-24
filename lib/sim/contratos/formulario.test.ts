import { describe, expect, it } from "vitest";
import { FORMULARIOS } from "@/lib/fixtures/contratos/formularios";
import {
  conservarCompatibles,
  definicionPara,
  documentosFaltantes,
  formatearValor,
  normalizarValores,
  validarCampos,
  valoresDeEjemplo,
} from "@/lib/sim/contratos/formulario";

const HOY = new Date(2026, 8, 24, 10);

describe("formulario dinámico", () => {
  it("hay definición para las 8 combinaciones", () => {
    expect(FORMULARIOS).toHaveLength(8);
    expect(definicionPara("moral", "arrendamiento").campos.some((c) => c.clave === "razonSocial")).toBe(true);
    expect(definicionPara("fisica", "arrendamiento").campos.some((c) => c.clave === "curp")).toBe(true);
  });

  it("al cambiar de combinación conserva solo los valores compatibles", () => {
    const moralArr = valoresDeEjemplo(definicionPara("moral", "arrendamiento"), HOY);
    const fisicaArr = conservarCompatibles(moralArr, definicionPara("fisica", "arrendamiento"));
    // Comunes: rfc, inmueble, renta, vigencia, inicio. Se pierden razón social y superficie.
    expect(fisicaArr.inmueble).toBe(moralArr.inmueble);
    expect(fisicaArr.rentaMensual).toBe(moralArr.rentaMensual);
    expect(fisicaArr.razonSocial).toBeUndefined();
    expect(fisicaArr.superficie).toBeUndefined();
    // Un select cuyo valor no existe en la nueva definición se descarta.
    const conOpcion = conservarCompatibles({ vigenciaAnios: "10 años" }, definicionPara("moral", "confidencialidad"));
    expect(conOpcion.vigenciaAnios).toBeUndefined();
  });

  it("los datos de ejemplo pasan la validación en todas las combinaciones", () => {
    for (const def of FORMULARIOS) expect(validarCampos(def, valoresDeEjemplo(def, HOY))).toEqual({});
  });

  it("valida obligatorios, RFC por tipo de persona, CURP y montos", () => {
    const def = definicionPara("fisica", "servicios");
    const errores = validarCampos(def, { rfc: "IPB150312K84", curp: "ABC", contraprestacionMensual: "0" });
    expect(errores.nombre).toMatch(/obligatorio/);
    expect(errores.rfc).toMatch(/13 caracteres/);
    expect(errores.curp).toMatch(/18/);
    expect(errores.contraprestacionMensual).toMatch(/mayor a cero/);
    expect(validarCampos(definicionPara("moral", "servicios"), { rfc: "META850214QR5" }).rfc).toMatch(/12 caracteres/);
    // Opcional vacío no marca error.
    expect(validarCampos(definicionPara("moral", "confidencialidad"), {}).penaConvencional).toBeUndefined();
  });

  it("documentos faltantes solo cuenta obligatorios", () => {
    const def = definicionPara("moral", "arrendamiento");
    const faltan = documentosFaltantes(def, [{ clave: "actaConstitutiva" }]);
    expect(faltan.map((d) => d.clave)).toEqual(["poderNotarial", "identificacion", "constanciaFiscal", "escrituraInmueble"]);
    expect(documentosFaltantes(definicionPara("fisica", "confidencialidad"), [{ clave: "identificacion" }, { clave: "constanciaFiscal" }, { clave: "comprobanteDomicilio" }])).toEqual([]);
  });

  it("normaliza números y mayúsculas, y formatea para el resumen", () => {
    const def = definicionPara("fisica", "arrendamiento");
    const v = normalizarValores(def, { rfc: " meta850214qr5 ", rentaMensual: "$18,500", nombre: "  Ana " });
    expect(v).toEqual({ rfc: "META850214QR5", rentaMensual: 18500, nombre: "Ana" });
    const renta = def.campos.find((c) => c.clave === "rentaMensual")!;
    expect(formatearValor(renta, 18500)).toBe("$18,500.00");
  });
});
