// Los 8 contratos formalizados: metadatos del catálogo + extracción precomputada + custodia e historial.
import { addDays, subDays } from "date-fns";
import { CONTRATOS_CATALOGO } from "@/lib/fixtures/contratos/catalogo";
import { EXTRACCIONES } from "@/lib/fixtures/contratos/extracciones";
import { USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos/personas";
import type { Contrato, Tanto } from "@/lib/types/contratos";

export const ARCHIVO_CENTRAL = "Archivo central · Ciudad de México";
const RESPONSABLE_ARCHIVO = USUARIOS_CONTRATOS.admin.nombre;

// Préstamos vigentes al iniciar la demo: uno vencido (alerta) y uno al corriente.
type PrestamoSemilla = { numero: 1 | 2 | 3; aQuien: string; desdeDias: number; hastaDias: number };
const PRESTAMOS: Record<string, PrestamoSemilla> = {
  "arr-pue": { numero: 1, aQuien: "Dirección de Desarrollo (Ing. Alejandro Ríos)", desdeDias: -20, hastaDias: -5 },
  "srv-ele": { numero: 2, aQuien: "Auditoría interna", desdeDias: -3, hastaDias: 10 },
};

function custodia(id: string, contraparte: string, hoy: Date): [Tanto, Tanto, Tanto] {
  const tantos: [Tanto, Tanto, Tanto] = [
    { numero: 1, ubicacion: ARCHIVO_CENTRAL, responsable: RESPONSABLE_ARCHIVO, estatus: "en_resguardo", historialPrestamos: [] },
    { numero: 2, ubicacion: ARCHIVO_CENTRAL, responsable: RESPONSABLE_ARCHIVO, estatus: "en_resguardo", historialPrestamos: [] },
    { numero: 3, ubicacion: `Contraparte · ${contraparte}`, responsable: "Contraparte", estatus: "en_resguardo", historialPrestamos: [] },
  ];
  const p = PRESTAMOS[id];
  if (p) {
    const prestamo = { aQuien: p.aQuien, desde: addDays(hoy, p.desdeDias).toISOString(), hasta: addDays(hoy, p.hastaDias).toISOString() };
    tantos[p.numero - 1] = { ...tantos[p.numero - 1], estatus: "prestado", prestamo, historialPrestamos: [prestamo] };
  }
  return tantos;
}

export function crearContratos(hoy: Date): Contrato[] {
  return CONTRATOS_CATALOGO.map((c) => {
    const extraccion = EXTRACCIONES[c.id];
    const firmado = new Date(`${c.fechaFirma}T13:00:00`);
    return {
      id: c.id,
      folio: c.folio,
      tipo: c.tipo,
      titulo: c.titulo,
      contraparte: c.contraparte,
      objeto: c.objeto,
      area: c.area,
      vigenciaInicio: c.vigenciaInicio,
      vigenciaFin: c.vigenciaFin,
      monto: c.monto,
      periodicidadMonto: c.periodicidadMonto,
      pdf: c.ocr ? `/fixtures/contratos/${c.id}-digitalizado.pdf` : `/fixtures/contratos/${c.id}.pdf`,
      pdfTexto: `/fixtures/contratos/${c.id}.pdf`,
      paginas: extraccion.paginas,
      ocr: c.ocr,
      extraccion: extraccion.campos.map((campo) => ({ ...campo })),
      custodia: custodia(c.id, c.contraparte, hoy),
      historial: [
        { fecha: firmado.toISOString(), titulo: "Contrato firmado", actor: "Partes", descripcion: `Firmado en ${c.ciudad}, ${c.estado}.` },
        {
          fecha: subDays(hoy, 30).toISOString(),
          titulo: c.ocr ? "Digitalizado por OCR y procesado" : "Procesado por extracción documental",
          actor: "Pipeline de extracción",
          descripcion: `${extraccion.campos.filter((x) => !x.confirmado).length} campos pendientes de confirmar.`,
        },
      ],
    };
  });
}
