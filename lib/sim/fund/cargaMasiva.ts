// Carga masiva de fondeos desde Excel (SheetJS): plantilla, lectura y validación previa a aplicar.
import { hotelPorId } from "@/lib/fixtures/fund";
import type { FilaCargaMasiva, Tarjeta } from "@/lib/types/fund";

export const COLUMNAS = ["Hotel", "Tarjeta (últimos cuatro)", "Monto", "Referencia"] as const;

export type FilaRevisada = FilaCargaMasiva & { fila: number; tarjetaId: string | null; error: string | null };

type Hoja = (string | number)[][];

async function xlsx() {
  return import("xlsx");
}

function libro(XLSX: typeof import("xlsx"), filas: Hoja) {
  const hoja = XLSX.utils.aoa_to_sheet([[...COLUMNAS], ...filas]);
  hoja["!cols"] = [{ wch: 36 }, { wch: 24 }, { wch: 12 }, { wch: 18 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, hoja, "Fondeos");
  return book;
}

// Plantilla vacía con las columnas esperadas y una fila de ejemplo.
export async function descargarPlantilla(tarjetas: Tarjeta[]) {
  const XLSX = await xlsx();
  const t = tarjetas[0];
  XLSX.writeFile(libro(XLSX, [[hotelPorId(t.hotelId)?.nombre ?? "", t.ultimosCuatro, 5000, "LOTE-0001"]]), "plantilla-carga-masiva-fund.xlsx");
}

// Archivo de ejemplo llenado con tarjetas reales del prototipo y dos filas con error para mostrar la validación.
export async function archivoEjemplo(tarjetas: Tarjeta[]): Promise<File> {
  const XLSX = await xlsx();
  const activas = tarjetas.filter((t) => t.estatus === "activa").slice(0, 5);
  const bloqueada = tarjetas.find((t) => t.estatus === "bloqueada");
  const filas: Hoja = activas.map((t, i) => [hotelPorId(t.hotelId)?.nombre ?? "", t.ultimosCuatro, 3000 + i * 1250, `LOTE-${String(i + 1).padStart(4, "0")}`]);
  filas.push(["City Express Monterrey Universidad", "0000", 2500, "LOTE-0006"]);
  if (bloqueada) filas.push([hotelPorId(bloqueada.hotelId)?.nombre ?? "", bloqueada.ultimosCuatro, 4000, "LOTE-0007"]);
  const datos = XLSX.write(libro(XLSX, filas), { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([datos], "carga-masiva-ejemplo.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function leerExcel(archivo: File): Promise<FilaCargaMasiva[]> {
  const XLSX = await xlsx();
  const book = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
  const hoja = book.Sheets[book.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" });
  return filas.map((f) => ({
    hotel: String(valor(f, "hotel") ?? "").trim() || undefined,
    ultimosCuatro: String(valor(f, "tarjeta") ?? "").trim().padStart(4, "0"),
    monto: Number(String(valor(f, "monto") ?? "").replace(/[$,\s]/g, "")),
    referencia: String(valor(f, "referencia") ?? "").trim(),
  }));
}

// Misma validación que aplica el store, para mostrarla en la vista previa.
export function revisarFilas(filas: FilaCargaMasiva[], tarjetas: Tarjeta[]): FilaRevisada[] {
  return filas.map((f, i) => {
    const fila = i + 2; // la fila 1 es el encabezado
    const candidatas = tarjetas.filter((t) => t.ultimosCuatro === f.ultimosCuatro);
    const tarjeta = f.hotel
      ? candidatas.find((t) => hotelPorId(t.hotelId)?.nombre.toLowerCase() === f.hotel!.toLowerCase()) ?? (candidatas.length === 1 ? candidatas[0] : undefined)
      : candidatas[0];
    const error = !tarjeta
      ? "No existe una tarjeta con esos últimos cuatro dígitos."
      : tarjeta.estatus === "bloqueada"
        ? "La tarjeta está bloqueada."
        : !(f.monto > 0)
          ? "El monto debe ser mayor a cero."
          : !f.referencia
            ? "Falta la referencia."
            : null;
    return { ...f, fila, tarjetaId: tarjeta?.id ?? null, error };
  });
}

// Busca la columna por prefijo sin importar acentos ni mayúsculas ("Tarjeta (últimos cuatro)" → "tarjeta").
function valor(fila: Record<string, unknown>, prefijo: string) {
  const clave = Object.keys(fila).find((k) => normalizar(k).startsWith(prefijo));
  return clave ? (fila[clave] as string | number) : undefined;
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
