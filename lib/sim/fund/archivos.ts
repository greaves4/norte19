// Comprobantes de Fund a partir de lo que devuelve UploadZone.
import type { UploadValue } from "@/components/shared/UploadZone";
import { archivoDeUpload } from "@/lib/archivos";
import type { Comprobante } from "@/lib/types/fund";

export function comprobanteXml(xml: string, nombre: string): Comprobante {
  return { tipo: "xml", nombre, src: `data:text/xml;charset=utf-8,${encodeURIComponent(xml)}` };
}

export async function comprobanteDeUpload(value: UploadValue): Promise<Comprobante> {
  const { nombre, src, tipo } = await archivoDeUpload(value);
  return { tipo, nombre, src };
}
