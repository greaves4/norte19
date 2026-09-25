"use client";

// Store del prototipo Desarrollo hotelero (zustand + persist, clave 'desarrollo'). El corpus es de solo lectura y vive
// en las fixtures; aquí se guarda el proyecto Juárez y todo lo que cambia durante la sesión.
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoNow } from "@/lib/demo";
import { crearProyecto } from "@/lib/fixtures/desarrollo";
import { NOMBRE_ZONA, type Archivo, type ArchivoPaquete, type EntregableId, type EstatusHallazgo, type EstatusMarca, type EstatusRiesgo, type EventoProyecto, type Hallazgo, type InputId, type Proyecto, type Semaforo, type ZonaId } from "@/lib/types/desarrollo";

// Súbela cuando cambien las fixtures: los navegadores con datos guardados se regeneran.
export const VERSION_DATOS_DESARROLLO = 1;

type Estado = { proyecto: Proyecto };

type Acciones = {
  cargarInput: (id: InputId, archivo: Omit<Archivo, "cargadoEn"> | null, actor: string) => void;
  ajustarCuadroAreas: (zona: ZonaId, m2: number, actor: string) => void;
  setEstatusRiesgo: (id: string, estatus: EstatusRiesgo, actor: string) => void;
  setEstatusMarca: (id: string, estatus: EstatusMarca, actor: string) => void;
  aprobarGateDefinicion: (actor: string, resumen: string[]) => boolean;
  agregarABiblioteca: (id: string) => void;
  quitarDeBiblioteca: (id: string) => void;
  cargarPaquete: (archivos: ArchivoPaquete[] | null, actor: string) => void;
  continuarConSupuesto: (nota: string, actor: string) => void;
  calificarEntregable: (id: EntregableId, semaforo: Semaforo, actor: string) => void;
  setFactorActualizacion: (factor: number) => void;
  ejecutarAuditoria: (hallazgos: Hallazgo[], actor: string, verificacion?: "2d" | "bim") => void;
  setEstatusHallazgo: (id: string, estatus: EstatusHallazgo, actor: string, motivo?: string) => void;
  setResolucionHallazgo: (id: string, resolucion: NonNullable<Hallazgo["resolucion"]>) => void;
  reset: () => void;
};

export type DesarrolloStore = Estado & Acciones;

const ahora = () => demoNow().toISOString();
const estadoInicial = (): Estado => ({ proyecto: crearProyecto(demoNow()) });

// Obligatorios sin archivo: mientras haya alguno, el proyecto no sale de la fase 1.
export function obligatoriosFaltantes(p: Pick<Proyecto, "inputs">) {
  return p.inputs.filter((i) => i.obligatorio && !i.archivo);
}

const ESTATUS_HALLAZGO: Record<EstatusHallazgo, string> = { pendiente: "pendiente", confirmado: "confirmado", ajustado: "ajustado", descartado: "descartado" };

export const useDesarrollo = create<DesarrolloStore>()(
  persist(
    (set, get) => {
      const actualizar = (cambio: (p: Proyecto) => Proyecto, evento?: Omit<EventoProyecto, "fecha">) =>
        set((st) => {
          const p = cambio(st.proyecto);
          return { proyecto: evento ? { ...p, bitacora: [...p.bitacora, { fecha: ahora(), ...evento }] } : p };
        });

      return {
        ...estadoInicial(),

        // Carga o quita un input. Liberar el último obligatorio abre el gate (fase 2); quitar uno lo vuelve a cerrar.
        cargarInput: (id, archivo, actor) => {
          const antes = get().proyecto;
          const input = antes.inputs.find((i) => i.id === id);
          if (!input) return;
          actualizar(
            (p) => ({ ...p, inputs: p.inputs.map((i) => (i.id === id ? { ...i, archivo: archivo ? { ...archivo, cargadoEn: ahora() } : undefined } : i)) }),
            { titulo: archivo ? `Input cargado: ${input.nombre}` : `Input retirado: ${input.nombre}`, actor, descripcion: archivo?.nombre },
          );
          const p = get().proyecto;
          const faltan = obligatoriosFaltantes(p);
          if (p.fase === 1 && faltan.length === 0) {
            actualizar((x) => ({ ...x, fase: 2 }), { titulo: "Gate de inputs liberado", actor: "Sistema", descripcion: "Inicia la Fase 02 · Retrieval." });
          } else if (p.fase > 1 && p.fase < 4 && faltan.length > 0) {
            actualizar((x) => ({ ...x, fase: 1 }), { titulo: "Gate de inputs detenido", actor: "Sistema", descripcion: `Falta ${faltan.map((f) => f.nombre).join(", ")}.` });
          }
        },

        ajustarCuadroAreas: (zona, m2, actor) => {
          const z = get().proyecto.definicion.cuadroAreas.find((x) => x.zona === zona);
          if (!z || !(m2 > 0) || Math.round(m2) === z.m2) return;
          actualizar(
            (p) => ({ ...p, definicion: { ...p.definicion, cuadroAreas: p.definicion.cuadroAreas.map((x) => (x.zona === zona ? { ...x, m2: Math.round(m2) } : x)) } }),
            { titulo: `Cuadro de áreas ajustado: ${NOMBRE_ZONA[zona]}`, actor, descripcion: `${z.m2.toLocaleString("es-MX")} → ${Math.round(m2).toLocaleString("es-MX")} m²` },
          );
        },

        setEstatusRiesgo: (id, estatus, actor) =>
          actualizar((p) => ({ ...p, definicion: { ...p.definicion, riesgos: p.definicion.riesgos.map((r) => (r.id === id ? { ...r, estatus } : r)) } }), {
            titulo: `Riesgo ${id}: ${estatus}`,
            actor,
          }),

        setEstatusMarca: (id, estatus, actor) =>
          actualizar((p) => ({ ...p, definicion: { ...p.definicion, marca: p.definicion.marca.map((m) => (m.id === id ? { ...m, estatus } : m)) } }), {
            titulo: `Requisito de marca ${id}: ${estatus.replace("_", " ")}`,
            actor,
          }),

        // Solo desde las fases 2–3 (gate de inputs liberado). Genera el acta y pasa a Generation (fase 4).
        aprobarGateDefinicion: (actor, resumen) => {
          const p = get().proyecto;
          if (p.fase < 2 || p.fase > 3) return false;
          actualizar((x) => ({ ...x, fase: 4, definicion: { ...x.definicion, acta: { aprobadoPor: actor, fecha: ahora(), resumen } } }), {
            titulo: "Fase de Definición aprobada",
            actor,
            descripcion: "Se habilitan criterios por disciplina y catálogos de obra.",
          });
          return true;
        },

        agregarABiblioteca: (id) =>
          set((st) => (st.proyecto.bibliotecaAgregada.includes(id) ? st : { proyecto: { ...st.proyecto, bibliotecaAgregada: [...st.proyecto.bibliotecaAgregada, id] } })),

        quitarDeBiblioteca: (id) => set((st) => ({ proyecto: { ...st.proyecto, bibliotecaAgregada: st.proyecto.bibliotecaAgregada.filter((x) => x !== id) } })),

        cargarPaquete: (archivos, actor) =>
          actualizar((p) => ({ ...p, paquete: archivos, notaSupuestoPaquete: undefined }), {
            titulo: archivos ? `Paquete ejecutivo cargado: ${archivos.length} archivos` : "Paquete ejecutivo retirado",
            actor,
          }),

        continuarConSupuesto: (nota, actor) =>
          actualizar((p) => ({ ...p, notaSupuestoPaquete: nota }), { titulo: "Auditoría habilitada con nota de supuesto", actor, descripcion: nota }),

        calificarEntregable: (id, semaforo, actor) => {
          const e = get().proyecto.semaforo.find((x) => x.id === id);
          if (!e || e.semaforo === semaforo) return;
          actualizar((p) => ({ ...p, semaforo: p.semaforo.map((x) => (x.id === id ? { ...x, semaforo } : x)) }), { titulo: `Semáforo: ${e.nombre} en ${semaforo}`, actor });
        },

        setFactorActualizacion: (factor) => {
          if (!(factor > 0)) return;
          set((st) => ({ proyecto: { ...st.proyecto, factorActualizacion: factor } }));
        },

        ejecutarAuditoria: (hallazgos, actor, verificacion = "2d") =>
          actualizar(
            (p) => ({
              ...p,
              fase: 5,
              auditoria: { ejecutadaEn: ahora(), ejecutadaPor: actor, verificacion, hallazgos: hallazgos.map((h) => ({ ...h, estatus: "pendiente" as const, motivo: undefined, resolucion: "abierto" as const })) },
            }),
            { titulo: "Auditoría integral ejecutada", actor, descripcion: `${hallazgos.length} hallazgos.` },
          ),

        setEstatusHallazgo: (id, estatus, actor, motivo) => {
          if (!get().proyecto.auditoria?.hallazgos.some((h) => h.id === id)) return;
          actualizar(
            (p) => ({ ...p, auditoria: { ...p.auditoria!, hallazgos: p.auditoria!.hallazgos.map((h) => (h.id === id ? { ...h, estatus, motivo: motivo?.trim() || undefined } : h)) } }),
            { titulo: `Hallazgo ${id} ${ESTATUS_HALLAZGO[estatus]}`, actor, descripcion: motivo },
          );
        },

        setResolucionHallazgo: (id, resolucion) =>
          set((st) =>
            st.proyecto.auditoria
              ? { proyecto: { ...st.proyecto, auditoria: { ...st.proyecto.auditoria, hallazgos: st.proyecto.auditoria.hallazgos.map((h) => (h.id === id ? { ...h, resolucion } : h)) } } }
              : st,
          ),

        reset: () => set(estadoInicial()),
      };
    },
    {
      name: "desarrollo",
      version: VERSION_DATOS_DESARROLLO,
      migrate: () => estadoInicial(),
      storage: createJSONStorage(() => localStorage),
      partialize: ({ proyecto }) => ({ proyecto }),
    },
  ),
);

export function useDesarrolloHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useDesarrollo.persist.onFinishHydration(cb),
    () => useDesarrollo.persist.hasHydrated(),
    () => false,
  );
}
