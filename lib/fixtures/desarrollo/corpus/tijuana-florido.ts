// City Express Tijuana El Florido (ejemplo verosímil; los datos reales se toman del Drive de Norte 19 si se da acceso).
import { construirHotel } from "./construir.ts";

export const tijuanaFlorido = construirHotel({
  id: "tijuana-florido",
  nombre: "City Express Tijuana El Florido",
  ciudad: "Tijuana",
  estado: "Baja California",
  llaves: 124,
  niveles: 5,
  elevadores: 2,
  anio: 2019,
  fechaPrecios: "2019-03",
  porLlave: { habitaciones: 27.1, areas_publicas: 4.4, boh: 5.5, circulaciones: 8.9, estacionamiento: 13.8 },
  sistemaEstructural: {
    sistema: "Marcos de concreto reforzado con losa plana aligerada",
    cimentacion: "Zapatas aisladas ligadas con contratrabes",
    motivo: "Arenas limosas compactas con capacidad de carga de 20 t/m² y zona sísmica C; los marcos dúctiles de concreto resolvieron sismo sin muros de cortante.",
    claros: "7.8 × 7.8 m en habitaciones; 9.0 m en lobby",
  },
  fachada: "Sistema EIFS sobre muro de block con ventanería de aluminio y cristal claro de 6 mm",
  mep: { kwPorLlave: 3.4, trPorLlave: 0.85, lpsPorLlave: 0.045 },
  acabados: [
    ["habitacion", "piso", "Alfombra modular de nylon en losetas de 50×50 cm"],
    ["habitacion", "muro", "Pintura vinílica lavable sobre tablaroca"],
    ["habitacion", "plafon", "Tablaroca con pintura vinílica mate"],
    ["bano_habitacion", "piso", "Porcelanato 30×60 cm antiderrapante"],
    ["bano_habitacion", "muro", "Porcelanato 30×60 cm a 2.10 m de altura"],
    ["lobby", "piso", "Porcelanato rectificado de 60×120 cm"],
    ["desayunador", "piso", "Porcelanato de 60×60 cm"],
    ["pasillos", "piso", "Alfombra modular de nylon"],
    ["boh", "piso", "Loseta cerámica antiderrapante de 33×33 cm"],
  ],
  cobertura: { equipamiento: { catalogo: "parcial" } },
});
