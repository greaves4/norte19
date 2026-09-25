// City Express Altamira (ejemplo verosímil).
import { construirHotel } from "./construir.ts";

export const altamira = construirHotel({
  id: "altamira",
  nombre: "City Express Altamira",
  ciudad: "Altamira",
  estado: "Tamaulipas",
  llaves: 132,
  niveles: 5,
  elevadores: 2,
  anio: 2022,
  fechaPrecios: "2022-01",
  porLlave: { habitaciones: 26.2, areas_publicas: 4.1, boh: 5.9, circulaciones: 8.5, estacionamiento: 12.2 },
  sistemaEstructural: {
    sistema: "Marcos de concreto reforzado con losa aligerada",
    cimentacion: "Pilotes precolados de concreto de 40×40 cm hincados a 18 m",
    motivo: "Arcillas blandas de alta compresibilidad y nivel freático a 2.5 m: los pilotes transmiten la carga a los estratos arenosos profundos y evitan asentamientos.",
    claros: "7.5 × 8.0 m",
  },
  fachada: "Sistema EIFS con ventanería de aluminio y cristal de control solar",
  mep: { kwPorLlave: 3.5, trPorLlave: 1.1, lpsPorLlave: 0.048 },
  acabados: [
    ["habitacion", "piso", "Piso vinílico LVT de 2.5 mm con apariencia de madera"],
    ["habitacion", "muro", "Pintura vinílica lavable sobre tablaroca"],
    ["habitacion", "plafon", "Tablaroca con pintura vinílica mate"],
    ["bano_habitacion", "piso", "Porcelanato 30×60 cm antiderrapante"],
    ["bano_habitacion", "muro", "Porcelanato 30×60 cm a plafón"],
    ["lobby", "piso", "Porcelanato rectificado de 60×120 cm"],
    ["desayunador", "piso", "Porcelanato de 60×60 cm"],
    ["pasillos", "piso", "Piso vinílico LVT de 2.5 mm"],
    ["boh", "piso", "Concreto pulido con sellador epóxico"],
  ],
  cobertura: { estructural: { xref: "parcial" } },
});
