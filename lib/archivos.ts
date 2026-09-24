// Convierte lo que devuelve UploadZone en un archivo guardable en localStorage (lo usan Fund y Contratos).
import type { UploadValue } from "@/components/shared/UploadZone";

// Arriba de este tamaño el archivo no se guarda en localStorage: queda como URL temporal de la sesión.
const MAX_DATA_URL = 1.5 * 1024 * 1024;

export type ArchivoGuardado = { nombre: string; src: string; tipo: "pdf" | "imagen"; tamano?: number };

export async function archivoDeUpload(value: UploadValue): Promise<ArchivoGuardado> {
  if (value.kind === "fixture") {
    const { fixture } = value;
    const nombre = fixture.src.split("/").pop() ?? fixture.name;
    const esPdf = fixture.type === "application/pdf" || nombre.toLowerCase().endsWith(".pdf");
    return { nombre, src: fixture.src, tipo: esPdf ? "pdf" : "imagen", tamano: fixture.size };
  }
  const { file } = value;
  const esPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const src = file.size <= MAX_DATA_URL ? await leerComoDataUrl(file) : URL.createObjectURL(file);
  return { nombre: file.name, src, tipo: esPdf ? "pdf" : "imagen", tamano: file.size };
}

function leerComoDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
