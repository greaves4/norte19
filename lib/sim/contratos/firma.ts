// Firma electrónica simulada: cinco pasos con latencias de 1.5 a 3 s. El flujo es el mismo para cualquier proveedor con API.
import type { RunnerStep } from "@/components/shared/ProgressRunner";
import { PASOS_FIRMA, type PasoFirma, type Solicitud } from "@/lib/types/contratos";

export const PROVEEDOR_NOTA = "Proveedor de firma por confirmar (Legalario u otro). El flujo es idéntico para cualquier proveedor con API.";

const LATENCIA: Record<PasoFirma, number> = {
  enviado: 1800,
  firmante_1: 2600,
  firmante_2: 3000,
  constancia: 2200,
  formalizado: 1500,
};

function logDe(paso: PasoFirma, s: Pick<Solicitud, "folio">): string[] {
  const doc = `doc_${s.folio.replace(/\D/g, "")}`;
  switch (paso) {
    case "enviado":
      return [`POST /v1/documents → 201 (${doc})`, "Firmantes registrados: 2 · orden secuencial"];
    case "firmante_1":
      return ["webhook signer.signed · firmante 1 (Norte 19)", "Firma electrónica avanzada con e.firma del representante"];
    case "firmante_2":
      return ["webhook signer.signed · firmante 2 (contraparte)", "Todas las firmas completas"];
    case "constancia":
      return ["Constancia de conservación NOM-151 emitida", "Sello de tiempo del prestador de servicios de certificación"];
    case "formalizado":
      return ["GET /v1/documents/{id}/signed → 200", "Documento firmado guardado en el repositorio"];
  }
}

// Pasos que faltan (una solicitud puede llegar con el envío o la primera firma ya hechos).
export function pasosPendientes(s: Pick<Solicitud, "firma">): PasoFirma[] {
  return PASOS_FIRMA.map((p) => p.id).filter((p) => !s.firma?.pasos[p]);
}

export function pasosRunner(s: Pick<Solicitud, "firma" | "folio">): RunnerStep[] {
  return PASOS_FIRMA.filter((p) => !s.firma?.pasos[p.id]).map((p) => ({ id: p.id, label: p.etiqueta, durationMs: LATENCIA[p.id], log: logDe(p.id, s) }));
}

export function duracionTotal(pasos: PasoFirma[]) {
  return pasos.reduce((t, p) => t + LATENCIA[p], 0);
}
