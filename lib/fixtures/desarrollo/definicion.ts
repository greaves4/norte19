// Decisiones de diseño y mapa de riesgos de la Fase de Definición de Juárez, con su fuente (hotel del corpus o input).
import type { Decision, Fuente, Riesgo } from "@/lib/types/desarrollo";

const corpus = (hotelId: string, disciplina: string, pagina: number): Fuente => ({ tipo: "corpus", hotelId, documento: `${hotelId}-${disciplina}`, pagina });
const input = (inputId: Fuente["inputId"], documento: string, pagina?: number): Fuente => ({ tipo: "input", inputId, documento, pagina });

export function crearDecisiones(): Decision[] {
  return [
    {
      id: "D-01",
      tema: "Sistema estructural",
      decision: "Marcos de concreto reforzado con losa plana aligerada, claros de 7.5 a 8.0 m.",
      justificacion: "Mismo sistema de Tijuana y Ensenada, con suelos firmes y sismicidad comparable; permite repetir moldes y claros de la habitación tipo.",
      fuentes: [corpus("tijuana-florido", "estructural", 1), corpus("ensenada", "estructural", 1)],
    },
    {
      id: "D-02",
      tema: "Cimentación",
      decision: "Zapatas corridas de concreto armado desplantadas a 1.8 m.",
      justificacion: "La mecánica de suelos reporta 18 t/m² de capacidad de carga; Ensenada resolvió con zapatas corridas sobre 22 t/m² y Tijuana con zapatas aisladas sobre 20 t/m².",
      fuentes: [input("mecanica_suelos", "Mecánica de suelos Juárez", 1), corpus("ensenada", "estructural", 2)],
    },
    {
      id: "D-03",
      tema: "Sistema de fachada",
      decision: "EIFS sobre muro de block con ventanería de aluminio y doble vidrio.",
      justificacion: "El EIFS de Tijuana y Altamira da el mejor aislamiento por costo; el doble vidrio de Ensenada responde a los extremos de temperatura de Juárez.",
      fuentes: [corpus("tijuana-florido", "arquitectonico", 3), corpus("ensenada", "arquitectonico", 3)],
    },
    {
      id: "D-04",
      tema: "HVAC",
      decision: "Minisplit inverter en habitaciones (1.0 TR por llave) y equipos paquete en áreas públicas.",
      justificacion: "Entre Tijuana (0.85 TR) y Altamira (1.10 TR); Juárez tiene veranos de 40 °C con baja humedad. Se agrega calefacción con bomba de calor por los inviernos bajo cero.",
      fuentes: [corpus("tijuana-florido", "instalaciones", 3), corpus("altamira", "instalaciones", 3)],
    },
    {
      id: "D-05",
      tema: "Circulación vertical",
      decision: "2 elevadores de pasajeros de 1,000 kg, uno con prioridad de servicio.",
      justificacion: "Los hoteles de 5 niveles del corpus resolvieron con 2 elevadores para 118 a 132 llaves.",
      fuentes: [corpus("altamira", "arquitectonico", 3), corpus("ensenada", "arquitectonico", 3)],
    },
    {
      id: "D-06",
      tema: "Agua caliente",
      decision: "Calentadores de paso a gas de alta eficiencia con tanques de almacenamiento y recirculación.",
      justificacion: "Solución común en los 4 hoteles con memoria de instalaciones; reduce el cuarto de máquinas frente a calderas.",
      fuentes: [corpus("altamira", "instalaciones", 2), corpus("cancun-aeropuerto", "instalaciones", 2)],
    },
    {
      id: "D-07",
      tema: "Planta de emergencia",
      decision: "Planta diésel de 300 kW con transferencia automática.",
      justificacion: "Respalda elevadores, bombas y 30% del alumbrado de áreas públicas, como en el corpus; carga instalada estimada de 3.4 kW por llave.",
      fuentes: [corpus("tijuana-florido", "instalaciones", 1), corpus("altamira", "instalaciones", 1)],
    },
    {
      id: "D-08",
      tema: "Piso de habitaciones",
      decision: "Piso vinílico LVT de 2.5 mm con apariencia de madera.",
      justificacion: "Es el acabado de los dos hoteles más recientes con clima seco (Altamira y Ensenada): menor costo de mantenimiento que la alfombra.",
      fuentes: [corpus("altamira", "interiores", 1), corpus("ensenada", "interiores", 1)],
    },
  ];
}

export function crearRiesgos(): Riesgo[] {
  const r = (id: string, tipo: Riesgo["tipo"], severidad: Riesgo["severidad"], origen: Riesgo["origen"], descripcion: string, mitigacion: string, fuentes: Fuente[]): Riesgo => ({
    id, tipo, severidad, origen, descripcion, mitigacion, estatus: "pendiente", fuentes,
  });
  return [
    r("R-01", "constructivo", "alta", "sitio", "Nivel freático a 6 m: la excavación de cisterna y cuarto de bombas lo alcanza.", "Abatimiento con bombeo durante la excavación y cisterna impermeabilizada con aditivo cristalizante.", [input("mecanica_suelos", "Mecánica de suelos Juárez", 1)]),
    r("R-02", "operativo", "alta", "sitio", "Temperaturas de −5 °C a 42 °C: riesgo de congelamiento en tuberías expuestas y sobrecarga del HVAC en verano.", "Aislar tuberías en azotea y fachada, cinta calefactora en tramos expuestos y selección de equipos para 42 °C.", [input("reglamento", "Reglamento de construcción Juárez", 18)]),
    r("R-03", "operativo", "media", "sitio", "Tolvaneras de primavera: entrada de polvo por ventanería y filtros de equipos.", "Ventanería con sello perimetral de doble contacto y filtros MERV 8 en equipos paquete.", [input("topografia", "Levantamiento topográfico Juárez", 1)]),
    r("R-04", "coordinacion", "alta", "corpus", "Cruce del ducto de extracción de cocina con trabes de planta baja (patrón repetido en Tijuana).", "Definir el trazo del ducto antes de cerrar la estructura y dejar pasos en trabes.", [corpus("tijuana-florido", "instalaciones", 3)]),
    r("R-05", "coordinacion", "media", "corpus", "Shaft de instalaciones del núcleo insuficiente para bajantes, ductos y charolas.", "Dimensionar el shaft con el cuadro de ductos y charolas de Ensenada más 20% de reserva.", [corpus("ensenada", "instalaciones", 1)]),
    r("R-06", "coordinacion", "media", "corpus", "Bajantes pluviales embebidas en fachada EIFS con filtraciones (Altamira).", "Bajantes por ducto interior registrable, fuera del sistema EIFS.", [corpus("altamira", "arquitectonico", 3)]),
    r("R-07", "operativo", "media", "sitio", "Suministro municipal de agua intermitente en la zona.", "Cisterna para dos días de consumo más reserva contra incendio.", [input("uso_suelo", "Uso de suelo Juárez", 1)]),
    r("R-08", "constructivo", "media", "sitio", "Relleno no controlado de 1.5 m en la esquina noreste del predio.", "Retirar el relleno bajo la huella del edificio y sustituir con material compactado.", [input("topografia", "Levantamiento topográfico Juárez", 2)]),
    r("R-09", "operativo", "alta", "sitio", "Capacidad de la red de CFE en la zona para una subestación de 500 kVA.", "Solicitar factibilidad de CFE en la Fase de Definición; prever obra de refuerzo en el CAPEX.", [input("uso_suelo", "Uso de suelo Juárez", 1)]),
    r("R-10", "constructivo", "baja", "corpus", "Plazo de entrega de elevadores de 20 semanas (Guaymas y Altamira).", "Colocar la orden de compra al aprobar el proyecto ejecutivo.", [corpus("altamira", "arquitectonico", 3), corpus("guaymas", "arquitectonico", 3)]),
  ];
}
