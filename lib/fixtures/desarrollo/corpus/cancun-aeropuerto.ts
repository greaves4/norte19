// City Express Cancún Aeropuerto (ejemplo verosímil).
import { construirHotel } from "./construir.ts";

export const cancunAeropuerto = construirHotel({
  id: "cancun-aeropuerto",
  nombre: "City Express Cancún Aeropuerto",
  ciudad: "Cancún",
  estado: "Quintana Roo",
  llaves: 138,
  niveles: 6,
  elevadores: 3,
  anio: 2018,
  fechaPrecios: "2018-05",
  porLlave: { habitaciones: 25.2, areas_publicas: 4.6, boh: 6.3, circulaciones: 8.1, estacionamiento: 11.0 },
  sistemaEstructural: {
    sistema: "Marcos de concreto reforzado con muros de cortante en los núcleos de escaleras",
    cimentacion: "Pilas coladas en sitio de 80 cm de diámetro desplantadas en roca caliza sana",
    motivo: "Nivel freático a 1.8 m y roca caliza fracturada con oquedades: se descartaron las zapatas por riesgo de asentamientos diferenciales y las pilas llevan la carga a roca sana. Los muros de cortante toman el viento de diseño por huracán (195 km/h).",
    claros: "7.5 × 7.5 m",
  },
  fachada: "Muro de block con aplanado y pintura elastomérica; ventanería con cristal laminado resistente a impacto",
  mep: { kwPorLlave: 3.7, trPorLlave: 1.15, lpsPorLlave: 0.052 },
  acabados: [
    ["habitacion", "piso", "Porcelanato de 20×120 cm con apariencia de madera"],
    ["habitacion", "muro", "Pintura vinílica lavable sobre aplanado"],
    ["habitacion", "plafon", "Tablaroca resistente a humedad con pintura mate"],
    ["bano_habitacion", "piso", "Porcelanato 30×60 cm antiderrapante"],
    ["bano_habitacion", "muro", "Porcelanato 30×60 cm a plafón"],
    ["lobby", "piso", "Mármol travertino nacional de 60×60 cm"],
    ["desayunador", "piso", "Porcelanato de 60×60 cm"],
    ["pasillos", "piso", "Porcelanato de 60×60 cm"],
    ["boh", "piso", "Concreto pulido con sellador epóxico"],
  ],
  // Interiores parcial: la memoria y el catálogo de acabados se entregaron incompletos.
  cobertura: { interiores: { xref: "parcial", memoria: "parcial", catalogo: "parcial" } },
});
