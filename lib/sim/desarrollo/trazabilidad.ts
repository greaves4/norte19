// Trazabilidad de los 13 entregables: cada dato generado con sus fuentes (hotel del corpus, documento y página, o
// input del proyecto), y la calificación que sugiere el sistema para que el revisor decida.
import { crearCriterios } from "@/lib/fixtures/desarrollo/criterios";
import { compararCuadro } from "@/lib/sim/desarrollo/benchmark";
import { calcularCapex } from "@/lib/sim/desarrollo/capex";
import { generarCatalogos } from "@/lib/sim/desarrollo/catalogos";
import { verificar } from "@/lib/sim/desarrollo/completitud";
import { NOMBRE_ZONA, type DisciplinaCriterio, type EntregableId, type Fuente, type Proyecto, type Semaforo } from "@/lib/types/desarrollo";

export type NodoTraza = { dato: string; detalle?: string; fuentes: Fuente[] };

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const usd = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const mxn = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const DISCIPLINA_ENTREGABLE: Partial<Record<EntregableId, DisciplinaCriterio[]>> = {
  arquitectura: ["arquitectura"],
  estructura: ["estructura"],
  electrico: ["electrico"],
  hidrosanitario: ["hidrosanitario"],
  pci_hvac: ["pci", "hvac"],
  interiores: ["interiores"],
};

const archivoFuente = (nombre: string): Fuente => ({ tipo: "input", documento: `Paquete ejecutivo · ${nombre}`, nota: "Archivo del proyectista" });

export function trazabilidad(p: Proyecto): Record<EntregableId, NodoTraza[]> {
  const conObjetivo = !!p.inputs.find((i) => i.id === "capex_objetivo")?.archivo;
  const criterios = crearCriterios();
  const completitud = p.paquete ? verificar(p.paquete) : null;
  const porDisciplina = (ds: DisciplinaCriterio[]): NodoTraza[] => [
    ...criterios.filter((c) => ds.includes(c.disciplina)).map((c) => ({ dato: `${c.id} · ${c.titulo}`, detalle: c.valor, fuentes: c.fuentes })),
    ...(completitud
      ? completitud.entregables
          .filter((x) => ds.includes(x.entregable.disciplina))
          .map((x) => ({
            dato: `Entregable: ${x.entregable.nombre}`,
            detalle: x.estatus === "presente" ? `${x.archivos.length === 1 ? "1 archivo" : `${x.archivos.length} archivos`} en el paquete` : "Falta en el paquete",
            fuentes: x.archivos.map(archivoFuente),
          }))
      : [{ dato: "Paquete ejecutivo", detalle: "Aún no se carga", fuentes: [] }]),
  ];

  const capex = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, conObjetivo);
  const catalogos = generarCatalogos(p.definicion.cuadroAreas, p.llaves, p.niveles, p.factorActualizacion);

  return {
    cuadro_areas: compararCuadro(p.definicion.cuadroAreas, p.llaves).map((f) => ({
      dato: `${NOMBRE_ZONA[f.zona]}: ${n(f.m2)} m² (${n(f.m2PorLlave, 1)} m² por llave)`,
      detalle: `Benchmark ${n(f.promedio, 1)} m² por llave · desviación ${f.desviacion > 0 ? "+" : ""}${n(f.desviacion * 100, 1)}%`,
      fuentes: [...f.fuentes, ...f.fuentesBenchmark],
    })),
    marca: p.definicion.marca.map((m) => ({ dato: `${m.id} · ${m.requisito}`, detalle: `${m.estatus === "cumple" ? "Cumple" : m.estatus === "desvia" ? "Desvía" : "Sin dato"}: ${m.evidencia}`, fuentes: m.fuentes })),
    decisiones: p.definicion.decisiones.map((d) => ({ dato: `${d.id} · ${d.tema}`, detalle: d.decision, fuentes: d.fuentes })),
    riesgos: p.definicion.riesgos.map((r) => ({ dato: `${r.id} · ${r.descripcion}`, detalle: `Severidad ${r.severidad} · ${r.estatus}`, fuentes: r.fuentes })),
    capex: [
      ...capex.porDisciplina.map((d) => ({ dato: `${d.nombre}: ${usd(d.usd)}`, detalle: `${mxn(d.mxnPorM2)} por m², catálogos de ${d.hoteles} hoteles`, fuentes: d.fuentes })),
      ...capex.supuestos.map((s) => ({ dato: `${s.concepto}: ${usd(s.usd)}`, detalle: `Supuesto paramétrico (${n(s.pct * 100)}% del costo directo): sin catálogo en el corpus`, fuentes: [] })),
      {
        dato: `Objetivo: ${capex.objetivo ? `${usd(capex.objetivo.usdPorLlave)} por llave` : "sin objetivo aprobado"}`,
        detalle: capex.objetivo ? `Estimación ${capex.objetivo.desviacion > 0 ? "+" : ""}${n(capex.objetivo.desviacion * 100, 1)}% contra el objetivo` : "Supuesto documentado nivel 2",
        fuentes: capex.objetivo ? [{ tipo: "input", inputId: "capex_objetivo", documento: "CAPEX objetivo aprobado", pagina: 1 }] : [],
      },
    ],
    arquitectura: porDisciplina(DISCIPLINA_ENTREGABLE.arquitectura!),
    coordinacion: [
      ...p.definicion.riesgos.filter((r) => r.tipo === "coordinacion").map((r) => ({ dato: `${r.id} · ${r.descripcion}`, detalle: r.mitigacion, fuentes: r.fuentes })),
      ...(p.auditoria
        ? p.auditoria.hallazgos
            .filter((h) => h.rubro === "coordinacion" && h.estatus !== "descartado")
            .map((h) => ({ dato: `${h.id} · ${h.descripcion}`, detalle: `Hallazgo ${h.severidad} · ${h.estatus}`, fuentes: [{ tipo: "input" as const, documento: "Auditoría integral", nota: h.nivel ? `Nivel ${h.nivel}${h.eje ? `, eje ${h.eje.x}-${h.eje.y}` : ""}` : undefined }] }))
        : [{ dato: "Auditoría de coordinación", detalle: "Aún no se ejecuta", fuentes: [] }]),
    ],
    estructura: porDisciplina(DISCIPLINA_ENTREGABLE.estructura!),
    electrico: porDisciplina(DISCIPLINA_ENTREGABLE.electrico!),
    hidrosanitario: porDisciplina(DISCIPLINA_ENTREGABLE.hidrosanitario!),
    pci_hvac: porDisciplina(DISCIPLINA_ENTREGABLE.pci_hvac!),
    interiores: porDisciplina(DISCIPLINA_ENTREGABLE.interiores!),
    catalogos: catalogos.map((c) => ({
      dato: `${c.nombre}: ${mxn(c.total)}`,
      detalle: `${c.conceptos.length} conceptos · ${c.conceptos.filter((k) => k.confianza === "baja").length} requieren revisión`,
      fuentes: [...new Map(c.conceptos.flatMap((k) => k.fuentes).map((f) => [`${f.documento}-${f.pagina}`, f])).values()],
    })),
  };
}

export type Sugerencia = { semaforo: Semaforo; motivo: string };

// Calificación que sugiere el sistema con lo que hay en el proyecto; el revisor decide.
export function sugerencias(p: Proyecto): Record<EntregableId, Sugerencia> {
  const conObjetivo = !!p.inputs.find((i) => i.id === "capex_objetivo")?.archivo;
  const peor = (xs: Semaforo[]): Semaforo => (xs.includes("rojo") ? "rojo" : xs.includes("ambar") ? "ambar" : "verde");
  const cuadro = compararCuadro(p.definicion.cuadroAreas, p.llaves);
  const marca = p.definicion.marca.filter((m) => m.estatus === "cumple").length / p.definicion.marca.length;
  const pendientes = p.definicion.riesgos.filter((r) => r.estatus === "pendiente").length;
  const capex = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, conObjetivo);
  const completitud = p.paquete ? verificar(p.paquete) : null;
  const disciplina = (ds: DisciplinaCriterio[]): Sugerencia => {
    if (p.fase < 4) return { semaforo: "rojo", motivo: "La Fase de Definición no está aprobada." };
    if (!completitud) return { semaforo: "rojo", motivo: "Falta el paquete ejecutivo." };
    const d = completitud.porDisciplina.filter((x) => ds.includes(x.disciplina));
    const presentes = d.reduce((t, x) => t + x.presentes, 0);
    const total = d.reduce((t, x) => t + x.total, 0);
    const pct = presentes / total;
    return { semaforo: pct === 1 ? "verde" : pct >= 0.75 ? "ambar" : "rojo", motivo: `${presentes} de ${total} entregables en el paquete.` };
  };
  const bajas = generarCatalogos(p.definicion.cuadroAreas, p.llaves, p.niveles, p.factorActualizacion).flatMap((c) => c.conceptos).filter((k) => k.confianza === "baja").length;
  return {
    cuadro_areas: { semaforo: peor(cuadro.map((f) => f.semaforo)), motivo: `${cuadro.filter((f) => f.semaforo !== "verde").length} zonas fuera del rango verde.` },
    marca: { semaforo: marca >= 0.9 ? "verde" : marca >= 0.75 ? "ambar" : "rojo", motivo: `${Math.round(marca * 100)}% de requisitos cumplen.` },
    decisiones: p.fase >= 4 ? { semaforo: "verde", motivo: "Aprobadas en el acta de la Fase de Definición." } : { semaforo: "ambar", motivo: "Pendientes de aprobación del revisor." },
    riesgos: pendientes === 0 ? { semaforo: "verde", motivo: "Todos los riesgos revisados." } : { semaforo: "ambar", motivo: `${pendientes} riesgos pendientes de revisión experta.` },
    capex: { semaforo: capex.semaforo, motivo: capex.objetivo ? `${capex.objetivo.desviacion > 0 ? "+" : ""}${n(capex.objetivo.desviacion * 100, 1)}% contra el objetivo.` : "Supuesto: falta el CAPEX objetivo." },
    arquitectura: disciplina(["arquitectura"]),
    coordinacion: p.auditoria
      ? (() => {
          const c = p.auditoria.hallazgos.filter((h) => h.rubro === "coordinacion" && h.estatus !== "descartado");
          const criticos = c.filter((h) => h.severidad === "critico").length;
          return { semaforo: criticos ? "rojo" : c.length ? "ambar" : "verde", motivo: `${c.length} hallazgos de coordinación vigentes (${criticos} críticos).` } satisfies Sugerencia;
        })()
      : { semaforo: "rojo", motivo: "La auditoría de coordinación aún no se ejecuta." },
    estructura: disciplina(["estructura"]),
    electrico: disciplina(["electrico"]),
    hidrosanitario: disciplina(["hidrosanitario"]),
    pci_hvac: disciplina(["pci", "hvac"]),
    interiores: disciplina(["interiores"]),
    catalogos: p.fase < 4 ? { semaforo: "rojo", motivo: "Se generan al aprobar la Fase de Definición." } : { semaforo: bajas ? "ambar" : "verde", motivo: `${bajas} conceptos requieren revisión.` },
  };
}
