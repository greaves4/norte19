// Estado de las cinco fases del estándar y de los módulos del proyecto, a partir del proyecto guardado.
// El store usa fase 1 (inputs), 2 (gate liberado: Retrieval hecho y Validation en curso), 4 (definición aprobada)
// y 5 (auditoría ejecutada).
import { evaluarInputs } from "@/lib/sim/desarrollo/gates";
import { calcularAvance } from "@/lib/sim/desarrollo/semaforo";
import type { Fase, Proyecto } from "@/lib/types/desarrollo";

export type EstadoPaso = "completo" | "en_curso" | "detenido" | "pendiente";

export type PasoFase = { fase: Fase; nombre: string; estado: EstadoPaso; detalle: string; gate?: string };

export function estadoFases(p: Proyecto): PasoFase[] {
  const gate = evaluarInputs(p.inputs);
  const f = p.fase;
  return [
    {
      fase: 1,
      nombre: "Inputs",
      estado: f === 1 ? "detenido" : "completo",
      detalle: f === 1 ? `Falta ${gate.faltantes.map((x) => x.input.nombre).join(", ")}` : gate.supuestos.length ? `Completo con ${gate.supuestos.length === 1 ? "1 supuesto" : `${gate.supuestos.length} supuestos`}` : "Completo",
      gate: "Gate de insuficiencia",
    },
    { fase: 2, nombre: "Retrieval", estado: f === 1 ? "pendiente" : "completo", detalle: f === 1 ? "Espera los inputs" : "5 hoteles y 24 documentos recuperados" },
    {
      fase: 3,
      nombre: "Validation",
      estado: f === 1 ? "pendiente" : f < 4 ? "en_curso" : "completo",
      detalle: f < 2 ? "Fase de Definición" : f < 4 ? "Fase de Definición en revisión" : `Aprobada por ${p.definicion.acta?.aprobadoPor ?? "el revisor"}`,
      gate: "Aprobación de la Fase de Definición",
    },
    {
      fase: 4,
      nombre: "Generation",
      estado: f < 4 ? "pendiente" : f === 4 ? "en_curso" : "completo",
      detalle: f < 4 ? "Criterios, catálogos y paquete ejecutivo" : p.paquete ? `Paquete cargado: ${p.paquete.length} archivos` : "Criterios y catálogos listos; falta el paquete ejecutivo",
    },
    { fase: 5, nombre: "QA", estado: p.auditoria ? "completo" : "pendiente", detalle: p.auditoria ? "Auditoría ejecutada" : "Auditoría integral" },
  ];
}

export type EstadoModulo = { estado: "listo" | "en_curso" | "bloqueado" | "atencion"; texto: string };

export function estadoModulos(p: Proyecto) {
  const gate = evaluarInputs(p.inputs);
  const tras = (fase: Fase, texto: string): EstadoModulo | null => (p.fase < fase ? { estado: "bloqueado", texto } : null);
  const avance = calcularAvance(p.semaforo);
  return {
    inputs: gate.nivel === 1 ? { estado: "atencion", texto: `Detenido: falta ${gate.faltantes.map((x) => x.input.nombre.toLowerCase()).join(", ")}` } : gate.nivel === 2 ? { estado: "en_curso", texto: `Completo con ${gate.supuestos.length} supuesto${gate.supuestos.length === 1 ? "" : "s"}` } : { estado: "listo", texto: "Completo" },
    definicion: tras(2, "Se habilita al liberar el gate de inputs") ?? (p.fase < 4 ? { estado: "en_curso", texto: "En revisión" } : { estado: "listo", texto: "Aprobada" }),
    criterios: tras(4, "Se habilita al aprobar la Fase de Definición") ?? { estado: "listo", texto: p.bibliotecaAgregada.length ? `${p.bibliotecaAgregada.length} soluciones en el paquete` : "Disponibles" },
    completitud: tras(4, "Se habilita al aprobar la Fase de Definición") ?? (p.paquete ? { estado: "en_curso", texto: `${p.paquete.length} archivos cargados` } : { estado: "atencion", texto: "Falta cargar el paquete ejecutivo" }),
    catalogos: tras(4, "Se habilita al aprobar la Fase de Definición") ?? { estado: "listo", texto: "Generados por ratio del corpus" },
    semaforo: { estado: avance >= 0.95 ? "listo" : "en_curso", texto: `Avance ${Math.round(avance * 100)}%` } satisfies EstadoModulo,
    auditoria: tras(4, "Requiere la Fase de Definición aprobada") ?? (p.auditoria ? { estado: "listo", texto: "Ejecutada" } : p.paquete ? { estado: "en_curso", texto: "Lista para ejecutar" } : { estado: "bloqueado", texto: "Requiere el paquete ejecutivo" }),
    reporte: p.auditoria ? { estado: "listo", texto: `${p.auditoria.hallazgos.length} hallazgos` } : { estado: "bloqueado", texto: "Se genera al ejecutar la auditoría" },
  } satisfies Record<string, EstadoModulo>;
}
