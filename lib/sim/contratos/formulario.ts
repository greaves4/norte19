// Motor del formulario dinámico: todo sale de la definición declarativa en lib/fixtures/contratos/formularios.ts.
import { FORMULARIOS } from "@/lib/fixtures/contratos/formularios";
import type { DefinicionCampo, DefinicionFormulario, Documento, TipoContrato, TipoPersona } from "@/lib/types/contratos";

export type Valores = Record<string, string | number>;

export function definicionPara(tipoPersona: TipoPersona, tipoContrato: TipoContrato): DefinicionFormulario {
  const def = FORMULARIOS.find((f) => f.tipoPersona === tipoPersona && f.tipoContrato === tipoContrato);
  if (!def) throw new Error(`Sin definición para ${tipoPersona} × ${tipoContrato}`);
  return def;
}

// Al cambiar de combinación se conservan los valores cuyo campo existe en la nueva definición (y siguen siendo válidos).
export function conservarCompatibles(valores: Valores, def: DefinicionFormulario): Valores {
  const resultado: Valores = {};
  for (const campo of def.campos) {
    const v = valores[campo.clave];
    if (v === undefined || v === "") continue;
    if (campo.tipo === "select" && campo.opciones && !campo.opciones.includes(String(v))) continue;
    resultado[campo.clave] = v;
  }
  return resultado;
}

const RFC_MORAL = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
const RFC_FISICA = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
const CURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

function validarCampo(campo: DefinicionCampo, valor: string | number | undefined, tipoPersona: TipoPersona): string | null {
  const texto = valor === undefined ? "" : String(valor).trim();
  if (!texto) return campo.requerido ? "Campo obligatorio." : null;
  if (campo.clave === "rfc") {
    const rfc = texto.toUpperCase();
    if (tipoPersona === "moral" ? !RFC_MORAL.test(rfc) : !RFC_FISICA.test(rfc)) {
      return tipoPersona === "moral" ? "RFC de persona moral: 12 caracteres (3 letras, fecha AAMMDD y homoclave)." : "RFC de persona física: 13 caracteres (4 letras, fecha AAMMDD y homoclave).";
    }
  }
  if (campo.clave === "curp" && !CURP.test(texto.toUpperCase())) return "La CURP tiene 18 caracteres.";
  if ((campo.tipo === "number" || campo.tipo === "money") && !(Number(texto.replace(/[$,\s]/g, "")) > 0)) return "Escribe una cantidad mayor a cero.";
  return null;
}

export function validarCampos(def: DefinicionFormulario, valores: Valores): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const campo of def.campos) {
    const error = validarCampo(campo, valores[campo.clave], def.tipoPersona);
    if (error) errores[campo.clave] = error;
  }
  return errores;
}

export function documentosFaltantes(def: DefinicionFormulario, expediente: Pick<Documento, "clave">[]) {
  const cargados = new Set(expediente.map((d) => d.clave));
  return def.documentos.filter((d) => d.obligatorio && !cargados.has(d.clave));
}

// Normaliza lo capturado: números como número, RFC y CURP en mayúsculas.
export function normalizarValores(def: DefinicionFormulario, valores: Valores): Valores {
  const out: Valores = {};
  for (const campo of def.campos) {
    const v = valores[campo.clave];
    if (v === undefined || String(v).trim() === "") continue;
    if (campo.tipo === "number" || campo.tipo === "money") out[campo.clave] = Number(String(v).replace(/[$,\s]/g, ""));
    else if (campo.clave === "rfc" || campo.clave === "curp") out[campo.clave] = String(v).trim().toUpperCase();
    else out[campo.clave] = String(v).trim();
  }
  return out;
}

export function formatearValor(campo: DefinicionCampo, valor: string | number | undefined): string {
  if (valor === undefined || valor === "") return "—";
  if (campo.tipo === "money") return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(valor));
  if (campo.tipo === "number") return Number(valor).toLocaleString("es-MX");
  if (campo.tipo === "date") {
    const [a, m, d] = String(valor).split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  }
  return String(valor);
}

// Datos de ejemplo para llenar el formulario en una sesión de validación (botón visible solo en demo).
const EJEMPLO: Valores = {
  razonSocial: "Inmobiliaria Paseo del Bajío, S.A. de C.V.",
  rfc: "IPB150312K84",
  representanteLegal: "Lic. Fernando Garza Leal",
  poderNotarial: "Escritura 18,452 del 10/03/2021, Notaría 23 de León",
  domicilioFiscal: "Blvd. Adolfo López Mateos 2105, Col. Jardines del Moral, León, Gto.",
  nombre: "Ana Lucía Méndez Torres",
  curp: "META850214MGTNRN08",
  identificacion: "INE",
  domicilio: "Calle Madero 318, Col. Centro, León, Gto.",
  inmueble: "Blvd. Aeropuerto 3400, Col. San Carlos, León, Gto.",
  superficie: 1850,
  rentaMensual: 185000,
  vigenciaMeses: 60,
  deposito: "2 meses",
  incrementoAnual: "INPC",
  aval: "Jorge Méndez Ruiz",
  proyecto: "City Express León Norte, 120 habitaciones",
  ubicacion: "Blvd. Aeropuerto 3400, León, Gto.",
  montoTotal: 98500000,
  plazoMeses: 18,
  anticipo: "30%",
  garantias: "Fianzas de anticipo y cumplimiento",
  cedulaProfesional: "9876543",
  servicio: "Mantenimiento de subestaciones eléctricas",
  hoteles: 12,
  contraprestacionMensual: 64000,
  nivelServicio: "Crítico (respuesta 4 h)",
  proposito: "Evaluación de sitios en el Bajío",
  vigenciaAnios: "3 años",
  penaConvencional: 2500000,
};

export function valoresDeEjemplo(def: DefinicionFormulario, hoy: Date): Valores {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const fechaInicio = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-01`;
  const base: Valores = { ...EJEMPLO, fechaInicio, rfc: def.tipoPersona === "moral" ? "IPB150312K84" : "META850214QR5" };
  return conservarCompatibles(base, def);
}

// Monto principal de la solicitud para listas (renta o contraprestación mensual, o monto total).
// La pena convencional de un NDA no es el monto del contrato: sin monto.
export function montoPrincipal(campos: Valores): { valor: number; periodicidad: "mensual" | "total" } | null {
  const mensual = campos.rentaMensual ?? campos.contraprestacionMensual;
  if (mensual !== undefined && Number(mensual) > 0) return { valor: Number(mensual), periodicidad: "mensual" };
  const total = campos.montoTotal;
  if (total !== undefined && Number(total) > 0) return { valor: Number(total), periodicidad: "total" };
  return null;
}
