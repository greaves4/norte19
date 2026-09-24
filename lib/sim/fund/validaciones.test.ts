import { describe, expect, it } from "vitest";
import { CATEGORIAS_BLOQUEADAS_POR_DEFECTO, HOTEL_DEMO_ID, hotelPorId } from "@/lib/fixtures/fund";
import { fechaEmision, parseCfdi } from "@/lib/sim/fund/cfdi";
import { crearXmlEjemplo } from "@/lib/sim/fund/ejemplos";
import {
  hayBloqueo,
  validarCategorias,
  validarDocumental,
  validarRfcReceptor,
  validarVentana3Dias,
} from "@/lib/sim/fund/validaciones";

const HOY = new Date(2026, 8, 24, 15, 30);
const hace = (dias: number, hora = 10) => new Date(2026, 8, 24 - dias, hora, 0);
const RFC_HOTEL = hotelPorId(HOTEL_DEMO_ID)!.rfc;

describe("validarVentana3Dias", () => {
  it.each([
    [0, "ok"],
    [1, "ok"],
    [2, "ok"],
    [3, "ok"],
    [4, "bloqueo"],
    [6, "bloqueo"],
  ] as const)("hace %i días → %s", (dias, nivel) => {
    const r = validarVentana3Dias(hace(dias, dias === 0 ? 9 : 23), HOY);
    expect(r.nivel).toBe(nivel);
    expect(r.diasTranscurridos).toBe(dias);
  });

  it("usa el mensaje del documento al bloquear", () => {
    expect(validarVentana3Dias(hace(6), HOY).detalle).toBe(
      "El movimiento está fuera de la ventana de registro de 3 días. Requiere autorización del supervisor.",
    );
  });

  it("advierte si la fecha es futura", () => {
    expect(validarVentana3Dias(new Date(2026, 8, 25), HOY).nivel).toBe("advertencia");
  });
});

describe("validarCategorias", () => {
  it("bloquea Aerolíneas por defecto", () => {
    const r = validarCategorias([{ claveProdServ: "78111502", descripcion: "Boleto" }], CATEGORIAS_BLOQUEADAS_POR_DEFECTO);
    expect(r.nivel).toBe("bloqueo");
    expect(r.bloqueadas.map((c) => c.id)).toEqual(["aerolineas"]);
    expect(r.detalle).toBe("La categoría Aerolíneas está bloqueada para esta tarjeta. Solicita una excepción a Tesorería.");
  });

  it("permite categorías no bloqueadas y respeta bloqueos nuevos", () => {
    const conceptos = [{ claveProdServ: "90101501", descripcion: "Alimentos" }];
    expect(validarCategorias(conceptos, CATEGORIAS_BLOQUEADAS_POR_DEFECTO).nivel).toBe("ok");
    expect(validarCategorias(conceptos, [...CATEGORIAS_BLOQUEADAS_POR_DEFECTO, "restaurantes"]).nivel).toBe("bloqueo");
  });
});

describe("validarRfcReceptor", () => {
  it("acepta el RFC del hotel sin importar mayúsculas", () => {
    expect(validarRfcReceptor(RFC_HOTEL.toLowerCase(), RFC_HOTEL).nivel).toBe("ok");
  });

  it("advierte sin bloquear si no coincide", () => {
    const r = validarRfcReceptor("XAXX010101000", RFC_HOTEL);
    expect(r.nivel).toBe("advertencia");
    expect(hayBloqueo([r])).toBe(false);
  });
});

describe("validarDocumental", () => {
  it("queda pendiente sin XML o sin comprobante", () => {
    expect(validarDocumental(null, 100, true).nivel).toBe("pendiente");
    expect(validarDocumental({ total: 100 }, 100, false).detalle).toBe("Falta cargar el comprobante.");
  });

  it("verifica coincidencia y detecta diferencias", () => {
    expect(validarDocumental({ total: 3688.8 }, 3688.8, true).titulo).toBe("Coincidencia verificada");
    expect(validarDocumental({ total: 3688.8 }, null, true).nivel).toBe("ok");
    const r = validarDocumental({ total: 3688.8 }, 3700, true);
    expect(r.titulo).toBe("Diferencia contra el CFDI");
    expect(r.diferencia).toBe(11.2);
  });
});

describe("los 5 ejemplos disparan las validaciones del guion", () => {
  const resultado = (id: string) => {
    const cfdi = parseCfdi(crearXmlEjemplo(id, HOY));
    return {
      ventana: validarVentana3Dias(fechaEmision(cfdi), HOY).nivel,
      categoria: validarCategorias(cfdi.conceptos, CATEGORIAS_BLOQUEADAS_POR_DEFECTO).nivel,
      rfc: validarRfcReceptor(cfdi.rfcReceptor, RFC_HOTEL).nivel,
      documental: validarDocumental(cfdi, cfdi.total, true).nivel,
    };
  };

  it.each([
    ["limpieza-peninsular", { ventana: "ok", categoria: "ok", rfc: "ok", documental: "ok" }],
    ["ferreteria-caribe", { ventana: "ok", categoria: "ok", rfc: "ok", documental: "ok" }],
    ["restaurante-marisol", { ventana: "ok", categoria: "ok", rfc: "ok", documental: "ok" }],
    ["aeromexico", { ventana: "ok", categoria: "bloqueo", rfc: "ok", documental: "ok" }],
    ["papeleria-tulum", { ventana: "bloqueo", categoria: "ok", rfc: "ok", documental: "ok" }],
  ])("%s", (id, esperado) => {
    expect(resultado(id)).toEqual(esperado);
  });
});
