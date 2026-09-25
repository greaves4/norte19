// Motor de auditoría integral simulado: pasos para ProgressRunner con las cinco fases del estándar y el score.
import type { RunnerStep } from "@/components/shared/ProgressRunner";
import { verificar } from "@/lib/sim/desarrollo/completitud";
import { NOMBRE_DISCIPLINA_CRITERIO, type ArchivoPaquete, type Hallazgo, type Rubro, type Semaforo, type Severidad } from "@/lib/types/desarrollo";

export const RUBROS: { id: Rubro; nombre: string; peso: number; letra: string }[] = [
  { id: "coordinacion", nombre: "Coordinación física", peso: 30, letra: "A" },
  { id: "funcional", nombre: "Operación", peso: 15, letra: "B" },
  { id: "marca", nombre: "Marca", peso: 20, letra: "C" },
  { id: "constructiva", nombre: "Constructibilidad", peso: 20, letra: "D" },
  { id: "documental", nombre: "Calidad documental", peso: 10, letra: "E" },
  { id: "economica", nombre: "Riesgo económico", peso: 5, letra: "F" },
];
export const NOMBRE_RUBRO = Object.fromEntries(RUBROS.map((r) => [r.id, r.nombre])) as Record<Rubro, string>;

export const PENALIZACION: Record<Severidad, number> = { critico: 25, medio: 10, menor: 3 };
export const UMBRAL_SCORE = { verde: 85, ambar: 65 };

export type Recomendacion = "Liberar" | "Corregir" | "Replantear";
export type ScoreRubro = { rubro: Rubro; nombre: string; peso: number; score: number; criticos: number; medios: number; menores: number };
export type Score = { global: number; semaforo: Semaforo; recomendacion: Recomendacion; detalle: string; porRubro: ScoreRubro[] };

const cuenta = (hs: Hallazgo[], s: Severidad) => hs.filter((h) => h.severidad === s).length;

// Solo cuentan los hallazgos no descartados. Por rubro: 100 − (críticos×25 + medios×10 + menores×3), acotado a 0..100.
export function calcularScore(hallazgos: Hallazgo[]): Score {
  const vigentes = hallazgos.filter((h) => h.estatus !== "descartado");
  const porRubro = RUBROS.map(({ id, nombre, peso }) => {
    const hs = vigentes.filter((h) => h.rubro === id);
    const criticos = cuenta(hs, "critico");
    const medios = cuenta(hs, "medio");
    const menores = cuenta(hs, "menor");
    const score = Math.max(0, Math.min(100, 100 - (criticos * PENALIZACION.critico + medios * PENALIZACION.medio + menores * PENALIZACION.menor)));
    return { rubro: id, nombre, peso, score, criticos, medios, menores };
  });
  const global = Math.round((porRubro.reduce((t, r) => t + r.score * r.peso, 0) / 100) * 10) / 10;
  const semaforo: Semaforo = global >= UMBRAL_SCORE.verde ? "verde" : global >= UMBRAL_SCORE.ambar ? "ambar" : "rojo";
  const recomendacion: Recomendacion = semaforo === "verde" ? "Liberar" : semaforo === "ambar" ? "Corregir" : "Replantear";
  const detalle = {
    Liberar: "El paquete puede liberarse a licitación; los hallazgos vigentes se atienden en obra.",
    Corregir: "Corregir los hallazgos críticos y medios antes de licitar; no requiere rehacer el proyecto.",
    Replantear: "Replantear las disciplinas con críticos y volver a auditar antes de licitar.",
  }[recomendacion];
  return { global, semaforo, recomendacion, detalle, porRubro };
}

// Resumen ejecutivo redactado a partir de los conteos.
export function resumenEjecutivo(hallazgos: Hallazgo[], nombreProyecto: string): string[] {
  const s = calcularScore(hallazgos);
  const vigentes = hallazgos.filter((h) => h.estatus !== "descartado");
  const descartados = hallazgos.length - vigentes.length;
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  const peores = [...s.porRubro].sort((a, b) => a.score - b.score).slice(0, 2);
  const criticos = vigentes.filter((h) => h.severidad === "critico");
  const pendientes = hallazgos.filter((h) => h.estatus === "pendiente").length;
  return [
    `La auditoría integral del paquete ejecutivo de ${nombreProyecto} obtiene ${s.global.toLocaleString("es-MX")} puntos de 100 (${s.semaforo === "ambar" ? "ámbar" : s.semaforo}). Recomendación: ${s.recomendacion.toLowerCase()}. ${s.detalle}`,
    `Hay ${plural(vigentes.length, "hallazgo vigente", "hallazgos vigentes")}: ${plural(cuenta(vigentes, "critico"), "crítico", "críticos")}, ${plural(cuenta(vigentes, "medio"), "medio", "medios")} y ${plural(cuenta(vigentes, "menor"), "menor", "menores")}${descartados ? `; el revisor descartó ${descartados}` : ""}. ${pendientes ? `${plural(pendientes, "hallazgo sigue", "hallazgos siguen")} pendiente${pendientes === 1 ? "" : "s"} de revisión experta.` : "Todos los hallazgos tienen revisión experta."}`,
    `Los rubros más débiles son ${peores[0].nombre.toLowerCase()} (${peores[0].score} puntos, peso ${peores[0].peso}%) y ${peores[1].nombre.toLowerCase()} (${peores[1].score} puntos, peso ${peores[1].peso}%).`,
    criticos.length
      ? `Críticos a resolver antes de licitar: ${criticos.map((h) => `${h.id} (${h.descripcion.replace(/\.$/, "").charAt(0).toLowerCase()}${h.descripcion.replace(/\.$/, "").slice(1)})`).join("; ")}.`
      : "No quedan hallazgos críticos vigentes.",
  ];
}

// Pasos del ProgressRunner (~25 s). Los ids "motor-<rubro>" revelan los hallazgos de ese rubro.
export function pasosAuditoria(paquete: ArchivoPaquete[], hallazgos: Hallazgo[]): RunnerStep[] {
  const r = verificar(paquete);
  const deRubro = (id: Rubro) => hallazgos.filter((h) => h.rubro === id);
  const conteo = (hs: Hallazgo[]) => `${hs.length} (${cuenta(hs, "critico")} C · ${cuenta(hs, "medio")} M · ${cuenta(hs, "menor")} N)`;
  return [
    {
      id: "inputs",
      label: "Inputs · verificación documental",
      durationMs: 3000,
      log: [
        `${paquete.length} archivos recibidos`,
        `${paquete.length - r.noIdentificados.length} con clave de plano reconocida, ${r.noIdentificados.length} sin clave`,
        r.faltantes.length ? `Entregables faltantes: ${r.faltantes.map((f) => f.clave).join(", ")} (supuesto documentado)` : "Sin entregables faltantes",
      ],
    },
    {
      id: "indexacion",
      label: "Indexation · clasificación por disciplina",
      durationMs: 3500,
      log: r.porDisciplina.map((d) => `${NOMBRE_DISCIPLINA_CRITERIO[d.disciplina]}: ${r.archivos.filter((a) => a.entregable?.disciplina === d.disciplina).length} archivos`),
    },
    ...RUBROS.map((rb) => ({
      id: `motor-${rb.id}`,
      label: `Audit engine ${rb.letra} · ${rb.nombre}`,
      durationMs: 2500,
      log: [`${rb.letra} · ${rb.nombre}: ${conteo(deRubro(rb.id))} hallazgos`],
    })),
    { id: "reporte", label: "Reporting · score y plan de acción", durationMs: 2000, log: [`Score preliminar ${calcularScore(hallazgos).global.toLocaleString("es-MX")} / 100`] },
    { id: "qa", label: "QA / Cierre · consistencia del reporte", durationMs: 1500, log: ["Verificación geométrica 2D sobre plantas; sin modelo BIM federado", "Reporte listo para revisión experta"] },
  ];
}

export const rubroDePaso = (id: string): Rubro | null => (id.startsWith("motor-") ? (id.slice(6) as Rubro) : null);
