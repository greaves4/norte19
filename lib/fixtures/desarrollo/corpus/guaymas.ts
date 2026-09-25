// City Express Guaymas (ejemplo verosímil). El corpus no incluye Instalaciones: caso real de información incompleta.
import { construirHotel } from "./construir.ts";

export const guaymas = construirHotel({
  id: "guaymas",
  nombre: "City Express Guaymas",
  ciudad: "Guaymas",
  estado: "Sonora",
  llaves: 112,
  niveles: 4,
  elevadores: 2,
  anio: 2021,
  fechaPrecios: "2021-02",
  porLlave: { habitaciones: 26.0, areas_publicas: 3.9, boh: 6.0, circulaciones: 9.1, estacionamiento: 12.9 },
  sistemaEstructural: {
    sistema: "Marcos de acero estructural con losacero y capa de compresión de 10 cm",
    cimentacion: "Losa de cimentación de concreto armado de 60 cm",
    motivo: "Arcillas expansivas con baja capacidad de carga (8 t/m²) y ambiente salino: la estructura de acero redujo el peso sobre la losa y acortó el plazo de obra.",
    claros: "8.0 × 8.0 m",
  },
  fachada: "Panel de fibrocemento sobre bastidor metálico con barrera de humedad; ventanería de PVC",
  mep: null,
  acabados: [
    ["habitacion", "piso", "Porcelanato de 60×60 cm mate, resistente al salitre"],
    ["habitacion", "muro", "Pintura vinílica lavable sobre tablaroca"],
    ["habitacion", "plafon", "Tablaroca resistente a humedad"],
    ["bano_habitacion", "piso", "Porcelanato 30×60 cm antiderrapante"],
    ["bano_habitacion", "muro", "Porcelanato 30×60 cm a 2.10 m de altura"],
    ["lobby", "piso", "Porcelanato rectificado de 60×120 cm"],
    ["desayunador", "piso", "Porcelanato de 60×60 cm"],
    ["pasillos", "piso", "Porcelanato de 60×60 cm"],
    ["boh", "piso", "Loseta cerámica antiderrapante de 33×33 cm"],
  ],
  cobertura: { instalaciones: { planos: "ausente", xref: "ausente", memoria: "ausente", catalogo: "ausente" } },
});
