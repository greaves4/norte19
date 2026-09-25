// Verificación de completitud del paquete ejecutivo: lista de entregables por disciplina según las secciones 5.2–5.6
// del estándar y emparejamiento de cada archivo por nombre y clave de plano (prefijos de la nomenclatura del cliente).
import type { ArchivoPaquete, DisciplinaCriterio, Proyecto } from "@/lib/types/desarrollo";

export type EntregableEjecutivo = { id: string; disciplina: DisciplinaCriterio; seccion: string; nombre: string; critico: boolean; patron: RegExp; clave: string };

const e = (id: string, disciplina: DisciplinaCriterio, seccion: string, nombre: string, critico: boolean, patron: RegExp, clave: string): EntregableEjecutivo => ({ id, disciplina, seccion, nombre, critico, patron, clave });

export const ENTREGABLES_EJECUTIVO: EntregableEjecutivo[] = [
  // 5.2 Arquitectura
  e("AQ-PLANTAS", "arquitectura", "5.2", "Plantas arquitectónicas por nivel", true, /^10\d-AQ-/, "100–109 AQ"),
  e("AQ-FACHADAS", "arquitectura", "5.2", "Fachadas", true, /^11\d-AQ-/, "110–119 AQ"),
  e("AQ-CORTES", "arquitectura", "5.2", "Cortes", true, /^12\d-AQ-/, "120–129 AQ"),
  e("AQ-DETALLES", "arquitectura", "5.2", "Detalles arquitectónicos", false, /^1[34]\d-AQ-/, "130–149 AQ"),
  e("AQ-NUCLEOS", "arquitectura", "5.2", "Núcleos de escaleras y elevadores", false, /^15\d-AQ-/, "150–159 AQ"),
  e("AQ-PLAFONES", "arquitectura", "5.2", "Plafones", false, /^16\d-AQ-/, "160–169 AQ"),
  e("AQ-TIPO", "arquitectura", "5.2", "Habitación y baño tipo", true, /^17\d-AQ-/, "170–179 AQ"),
  e("AL", "arquitectura", "5.2", "Albañilería", false, /^2[0-7]\d-AL-/, "200–270 AL"),
  e("ACW", "arquitectura", "5.2", "Planos de acabados", false, /^3[0-7]\d-ACW-/, "300–370 ACW"),
  e("AH", "arquitectura", "5.2", "Cancelería y herrería", false, /^7[0-4]\d-AH-/, "700 AH"),
  e("AN", "arquitectura", "5.2", "Señalética", false, /^7[5-9]\d-AN-/, "750 AN"),
  e("BIM", "arquitectura", "5.2", "Modelo BIM", false, /^BIM-|\.(IFC|RVT)$/, "BIM / IFC / RVT"),
  e("PA", "arquitectura", "5.2", "Paisajismo", false, /^PA-/, "PA"),
  // 5.3 Estructura
  e("ES-CIM", "estructura", "5.3", "Planta y detalles de cimentación", true, /^ES-10\d/, "ES-100"),
  e("ES-PLANTAS", "estructura", "5.3", "Plantas estructurales con cuantías", true, /^ES-1[1-9]\d/, "ES-110"),
  e("ES-ARMADOS", "estructura", "5.3", "Detalles y armados", false, /^ES-2\d\d/, "ES-200"),
  e("MEM-ES", "estructura", "5.3", "Memoria de cálculo estructural", true, /^MEM-ES/, "MEM-ES"),
  // 5.4 Eléctrico
  e("IE-UNIFILAR", "electrico", "5.4", "Diagrama unifilar", true, /^IE-001/, "IE-001"),
  e("IE-CARGAS", "electrico", "5.4", "Cuadro de cargas", true, /^IE-002/, "IE-002"),
  e("IE-NIVELES", "electrico", "5.4", "Alumbrado y contactos por nivel", true, /^IE-1\d\d/, "IE-100"),
  e("IE-SUBESTACION", "electrico", "5.4", "Subestación y planta de emergencia", false, /^IE-3\d\d/, "IE-300"),
  e("IE-TIERRAS", "electrico", "5.4", "Tierras y pararrayos", false, /^IE-4\d\d/, "IE-400"),
  e("MEM-IE", "electrico", "5.4", "Memoria eléctrica", false, /^MEM-IE/, "MEM-IE"),
  // 5.5 Hidrosanitario, PCI y HVAC
  e("IH-ISO", "hidrosanitario", "5.5", "Isométricos", true, /^IH-0\d\d/, "IH-000"),
  e("IH-NIVELES", "hidrosanitario", "5.5", "Planos hidráulicos y sanitarios por nivel", true, /^IH-1\d\d/, "IH-100"),
  e("IH-CISTERNA", "hidrosanitario", "5.5", "Cisterna y cuarto de máquinas", false, /^IH-3\d\d/, "IH-300"),
  e("IH-GAS", "hidrosanitario", "5.5", "Instalación de gas", false, /^IH-4\d\d/, "IH-400"),
  e("MEM-IH", "hidrosanitario", "5.5", "Memoria hidrosanitaria", false, /^MEM-IH/, "MEM-IH"),
  e("PCI-NIVELES", "pci", "5.5", "Rociadores por nivel", true, /^PCI-1\d\d/, "PCI-100"),
  e("PCI-DETECCION", "pci", "5.5", "Detección y alarma", false, /^PCI-2\d\d/, "PCI-200"),
  e("PCI-BOMBAS", "pci", "5.5", "Cuarto de bombas", false, /^PCI-3\d\d/, "PCI-300"),
  e("MEM-PCI", "pci", "5.5", "Memoria de protección contra incendio", false, /^MEM-PCI/, "MEM-PCI"),
  e("HV-NIVELES", "hvac", "5.5", "Aire acondicionado por nivel", true, /^HV-1\d\d/, "HV-100"),
  e("HV-EXTRACCION", "hvac", "5.5", "Extracciones", false, /^HV-2\d\d/, "HV-200"),
  e("HV-EQUIPOS", "hvac", "5.5", "Equipos en azotea", false, /^HV-3\d\d/, "HV-300"),
  e("MEM-HV", "hvac", "5.5", "Memoria de aire acondicionado", false, /^MEM-HV/, "MEM-HV"),
  // 5.6 Interiores
  e("DI-LAYOUTS", "interiores", "5.6", "Layouts de interiores", true, /^DI-1\d\d/, "DI-100"),
  e("DI-FICHAS", "interiores", "5.6", "Fichas de acabados", false, /^DI-2\d\d/, "DI-200"),
  e("DI-FFE", "interiores", "5.6", "Listas de FF&E", false, /^DI-3\d\d/, "DI-300"),
];

export function identificar(nombre: string): EntregableEjecutivo | null {
  const clave = nombre.trim().toUpperCase();
  return ENTREGABLES_EJECUTIVO.find((x) => x.patron.test(clave)) ?? null;
}

export type ResultadoCompletitud = {
  archivos: { nombre: string; entregable: EntregableEjecutivo | null }[];
  entregables: { entregable: EntregableEjecutivo; archivos: string[]; estatus: "presente" | "faltante" }[];
  porDisciplina: { disciplina: DisciplinaCriterio; total: number; presentes: number; porcentaje: number }[];
  faltantes: EntregableEjecutivo[];
  faltantesCriticos: EntregableEjecutivo[];
  noIdentificados: string[];
  porcentaje: number;
};

export function verificar(archivos: Pick<ArchivoPaquete, "nombre">[]): ResultadoCompletitud {
  const clasificados = archivos.map((a) => ({ nombre: a.nombre, entregable: identificar(a.nombre) }));
  const entregables = ENTREGABLES_EJECUTIVO.map((entregable) => {
    const suyos = clasificados.filter((c) => c.entregable?.id === entregable.id).map((c) => c.nombre);
    return { entregable, archivos: suyos, estatus: suyos.length ? ("presente" as const) : ("faltante" as const) };
  });
  const disciplinas = [...new Set(ENTREGABLES_EJECUTIVO.map((x) => x.disciplina))];
  const porDisciplina = disciplinas.map((disciplina) => {
    const d = entregables.filter((x) => x.entregable.disciplina === disciplina);
    const presentes = d.filter((x) => x.estatus === "presente").length;
    return { disciplina, total: d.length, presentes, porcentaje: presentes / d.length };
  });
  const faltantes = entregables.filter((x) => x.estatus === "faltante").map((x) => x.entregable);
  return {
    archivos: clasificados,
    entregables,
    porDisciplina,
    faltantes,
    faltantesCriticos: faltantes.filter((x) => x.critico),
    noIdentificados: clasificados.filter((c) => !c.entregable).map((c) => c.nombre),
    porcentaje: entregables.filter((x) => x.estatus === "presente").length / entregables.length,
  };
}

// La auditoría requiere paquete cargado y sin faltantes críticos, salvo que se continúe con nota de supuesto.
export function puedeAuditar(p: Pick<Proyecto, "paquete" | "notaSupuestoPaquete" | "fase">): { puede: boolean; motivo?: string } {
  if (p.fase < 4) return { puede: false, motivo: "La Fase de Definición aún no está aprobada." };
  if (!p.paquete?.length) return { puede: false, motivo: "Falta cargar el paquete ejecutivo." };
  const r = verificar(p.paquete);
  if (r.faltantesCriticos.length && !p.notaSupuestoPaquete) return { puede: false, motivo: `Faltan ${r.faltantesCriticos.length} entregables críticos.` };
  return { puede: true };
}
