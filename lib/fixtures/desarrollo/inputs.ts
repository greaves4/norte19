// Inputs del proyecto según el estándar: obligatorios (bloquean) y complementarios (supuesto documentado).
// Al iniciar la demo faltan la mecánica de suelos (obligatorio) y el CAPEX objetivo (complementario).
import type { InputProyecto } from "@/lib/types/desarrollo";

const CARGADO = "2026-09-01T10:00:00.000Z";
const archivo = (nombre: string) => ({ nombre, src: `/fixtures/desarrollo/inputs/${nombre}`, tipo: "pdf" as const, cargadoEn: CARGADO });

export function crearInputs(): InputProyecto[] {
  return [
    {
      id: "anteproyecto",
      nombre: "Anteproyecto arquitectónico (PDF + DWG)",
      obligatorio: true,
      descripcion: "Plantas, cortes y cuadro de áreas del anteproyecto aprobado por la Dirección.",
      impacto: "Sin anteproyecto no hay cuadro de áreas ni base para criterios.",
      afecta: [],
      archivo: archivo("anteproyecto-juarez.pdf"),
    },
    {
      id: "uso_suelo",
      nombre: "Uso de suelo",
      obligatorio: true,
      descripcion: "Constancia de uso de suelo con COS, CUS, altura máxima y cajones exigidos.",
      impacto: "No es posible validar la envolvente ni el estacionamiento contra la norma local.",
      afecta: [],
      archivo: archivo("uso-de-suelo-juarez.pdf"),
    },
    {
      id: "mecanica_suelos",
      nombre: "Mecánica de suelos",
      obligatorio: true,
      descripcion: "Estudio geotécnico con capacidad de carga, nivel freático y recomendaciones de cimentación.",
      impacto: "No es posible definir sistema estructural ni cimentación.",
      afecta: [],
    },
    {
      id: "topografia",
      nombre: "Levantamiento topográfico (KMZ + PDF)",
      obligatorio: true,
      descripcion: "Poligonal, curvas de nivel, colindancias y servicios existentes.",
      impacto: "No es posible definir niveles de desplante, drenaje pluvial ni accesos.",
      afecta: [],
      archivo: archivo("topografia-juarez.pdf"),
    },
    {
      id: "corpus",
      nombre: "Corpus de referencia (5 hoteles)",
      obligatorio: true,
      descripcion: "Proyectos ejecutivos procesados de los 5 hoteles de referencia.",
      impacto: "Sin corpus no hay benchmark, criterios ni catálogos por ratio.",
      afecta: [],
      archivo: { nombre: "Corpus procesado · 5 hoteles", src: "/desarrollo/corpus", tipo: "otro", cargadoEn: CARGADO },
    },
    {
      id: "brand_standards",
      nombre: "Brand standards City Express",
      obligatorio: false,
      descripcion: "Manual de estándares de marca vigente.",
      impacto: "Los requisitos de marca se infieren del corpus.",
      afecta: ["marca"],
      archivo: archivo("brand-standards-city-express.pdf"),
    },
    {
      id: "programa",
      nombre: "Programa de necesidades",
      obligatorio: false,
      descripcion: "Llaves, mezcla de habitaciones y áreas complementarias solicitadas.",
      impacto: "Se toma el programa típico del corpus.",
      afecta: ["cuadro_areas"],
      archivo: archivo("programa-juarez.pdf"),
    },
    {
      id: "capex_objetivo",
      nombre: "CAPEX objetivo",
      obligatorio: false,
      descripcion: "Presupuesto objetivo por llave aprobado por el comité de inversión.",
      impacto: "Supuesto documentado: la estimación de CAPEX no se compara contra un objetivo aprobado.",
      afecta: ["capex"],
    },
    {
      id: "reglamento",
      nombre: "Reglamento de construcción local",
      obligatorio: false,
      descripcion: "Reglamento de Construcción del Municipio de Juárez y normas técnicas complementarias.",
      impacto: "Se aplican las normas del estándar sin ajustes locales.",
      afecta: ["arquitectura"],
      archivo: archivo("reglamento-juarez.pdf"),
    },
    {
      id: "estudio_mercado",
      nombre: "Estudio de mercado",
      obligatorio: false,
      descripcion: "Demanda, ocupación esperada y tarifa promedio.",
      impacto: "La mezcla de habitaciones se toma del corpus.",
      afecta: [],
      archivo: archivo("estudio-mercado-juarez.pdf"),
    },
  ];
}
