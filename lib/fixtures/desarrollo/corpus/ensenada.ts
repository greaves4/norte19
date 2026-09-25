// City Express Ensenada (ejemplo verosímil).
import { construirHotel } from "./construir.ts";

export const ensenada = construirHotel({
  id: "ensenada",
  nombre: "City Express Ensenada",
  ciudad: "Ensenada",
  estado: "Baja California",
  llaves: 118,
  niveles: 5,
  elevadores: 2,
  anio: 2020,
  fechaPrecios: "2020-04",
  porLlave: { habitaciones: 27.6, areas_publicas: 4.0, boh: 5.4, circulaciones: 8.4, estacionamiento: 12.0 },
  sistemaEstructural: {
    sistema: "Marcos de concreto reforzado con losa plana aligerada",
    cimentacion: "Zapatas corridas de concreto armado",
    motivo: "Suelo granular denso con capacidad de carga de 22 t/m² y zona sísmica D: marcos dúctiles con muros de relleno desligados de la estructura.",
    claros: "7.8 × 8.0 m",
  },
  fachada: "Muro de block con aplanado y pintura elastomérica; ventanería de aluminio con doble vidrio",
  mep: { kwPorLlave: 3.1, trPorLlave: 0.75, lpsPorLlave: 0.042 },
  acabados: [
    ["habitacion", "piso", "Piso vinílico LVT de 2.5 mm con apariencia de madera"],
    ["habitacion", "muro", "Pintura vinílica lavable sobre tablaroca"],
    ["habitacion", "plafon", "Tablaroca con pintura vinílica mate"],
    ["bano_habitacion", "piso", "Porcelanato 30×60 cm antiderrapante"],
    ["bano_habitacion", "muro", "Porcelanato 30×60 cm a 2.10 m de altura"],
    ["lobby", "piso", "Porcelanato rectificado de 60×120 cm"],
    ["desayunador", "piso", "Porcelanato de 60×60 cm"],
    ["pasillos", "piso", "Alfombra modular de nylon"],
    ["boh", "piso", "Loseta cerámica antiderrapante de 33×33 cm"],
  ],
});
