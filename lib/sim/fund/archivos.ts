// Convierte lo que devuelve UploadZone en comprobantes guardables en el store (localStorage).
import type { UploadValue } from "@/components/shared/UploadZone";
import type { Comprobante } from "@/lib/types/fund";

// Arriba de este tamaño el archivo no se guarda en localStorage: queda como URL temporal de la sesión.
const MAX_DATA_URL = 1.5 * 1024 * 1024;

export function comprobanteXml(xml: string, nombre: string): Comprobante {
  return { tipo: "xml", nombre, src: `data:text/xml;charset=utf-8,${encodeURIComponent(xml)}` };
}

export async function comprobanteDeUpload(value: UploadValue): Promise<Comprobante> {
  if (value.kind === "fixture") {
    const { fixture } = value;
    const nombre = fixture.src.split("/").pop() ?? fixture.name;
    return { tipo: fixture.type === "application/pdf" || nombre.endsWith(".pdf") ? "pdf" : "imagen", nombre, src: fixture.src };
  }
  const { file } = value;
  const tipo = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "imagen";
  const src = file.size <= MAX_DATA_URL ? await leerComoDataUrl(file) : URL.createObjectURL(file);
  return { tipo, nombre: file.name, src };
}

function leerComoDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
