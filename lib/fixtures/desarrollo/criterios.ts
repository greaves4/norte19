// Criterios de diseño por disciplina para el ejecutivo de Juárez. Los rangos numéricos se calculan del corpus; los
// demás valores citan la memoria, el catálogo o el input del sitio de donde salen.
import { CORPUS } from "@/lib/fixtures/desarrollo/corpus";
import { fuenteCorpus, PAGINA, valorBase } from "@/lib/fixtures/desarrollo/corpus/construir";
import type { Criterio, Fuente } from "@/lib/types/desarrollo";

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const input = (inputId: Fuente["inputId"], documento: string, pagina?: number): Fuente => ({ tipo: "input", inputId, documento, pagina });
const manual = (pagina: number) => input("brand_standards", "Brand standards City Express 2024", pagina);

const conMep = CORPUS.filter((h) => h.mep);
const rango = (xs: number[], dec: number) => `${n(Math.min(...xs), dec)}–${n(Math.max(...xs), dec)}`;
const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Cantidad por m² construido de un concepto del catálogo de obra civil en cada hotel.
function porM2(clave: string) {
  return CORPUS.map((h) => {
    const k = h.catalogos.find((c) => c.id === "obra_civil")!.conceptos.find((x) => x.clave === clave);
    return k ? (k.ratio * valorBase(k.base, h)) / h.m2Total : 0;
  }).filter((x) => x > 0);
}

export function crearCriterios(): Criterio[] {
  const m2Llave = CORPUS.map((h) => h.m2Total / h.llaves);
  const kw = conMep.map((h) => h.mep!.kwPorLlave);
  const tr = conMep.map((h) => h.mep!.trPorLlave);
  const lps = conMep.map((h) => h.mep!.lpsPorLlave);
  const concreto = CORPUS.map((_, i) => porM2("OC-008")[i] + porM2("OC-009")[i]);
  const acero = porM2("OC-010").map((t) => t * 1000);
  const catalogo = (id: string, i: number) => fuenteCorpus(id, "catalogo", i);

  return [
    // --- Arquitectura
    { id: "AR-01", disciplina: "arquitectura", titulo: "Superficie construida por llave", valor: `${n(promedio(m2Llave), 1)} m² por llave como referencia`, rango: `${rango(m2Llave, 1)} m² por llave en el corpus`, sitio: "El anteproyecto de Juárez tiene 45.3 m² por llave.", fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "arquitectonico", PAGINA.arquitectonico.cuadroAreas)) },
    { id: "AR-02", disciplina: "arquitectura", titulo: "Habitación tipo", valor: "24 a 28 m² con baño; módulo estructural de 3.6 m", rango: "25.2–27.6 m² por llave de zona de habitaciones", fuentes: [manual(12), fuenteCorpus("ensenada", "arquitectonico", 1)] },
    { id: "AR-03", disciplina: "arquitectura", titulo: "Pasillos de habitaciones", valor: "1.80 m libres, doble carga", sitio: "El anteproyecto marca 1.60 m: ajustar en el ejecutivo.", fuentes: [manual(46), fuenteCorpus("altamira", "arquitectonico", 2)] },
    { id: "AR-04", disciplina: "arquitectura", titulo: "Circulación vertical", valor: "2 elevadores de 1,000 kg a 1.0 m/s y 2 escaleras de emergencia", rango: "2 elevadores en los hoteles de 4 y 5 niveles; 3 en Cancún (6 niveles)", fuentes: [fuenteCorpus("altamira", "arquitectonico", 3), fuenteCorpus("ensenada", "arquitectonico", 3)] },
    { id: "AR-05", disciplina: "arquitectura", titulo: "Envolvente", valor: "EIFS sobre muro de block con ventanería de aluminio y doble vidrio", sitio: "Extremos de −5 °C a 42 °C y tolvaneras: sellos perimetrales de doble contacto.", fuentes: [fuenteCorpus("tijuana-florido", "arquitectonico", 3), input("reglamento", "Reglamento de construcción Juárez", 18)] },
    { id: "AR-06", disciplina: "arquitectura", titulo: "Estacionamiento", valor: "0.55 cajones por llave (71 cajones), descubierto", rango: "0.44–0.55 cajones por llave en el corpus", sitio: "Uso de suelo: 1 cajón por cada 2 habitaciones más áreas públicas.", fuentes: [input("uso_suelo", "Uso de suelo Juárez", 1), fuenteCorpus("tijuana-florido", "arquitectonico", 3)] },

    // --- Estructura
    { id: "ES-01", disciplina: "estructura", titulo: "Sistema de referencia", valor: "Marcos de concreto reforzado con losa plana aligerada, claros de 7.5 a 8.0 m", rango: "7.5–8.0 m en los hoteles con marcos de concreto", fuentes: [fuenteCorpus("tijuana-florido", "estructural", 1), fuenteCorpus("ensenada", "estructural", 1)] },
    { id: "ES-02", disciplina: "estructura", titulo: "Cimentación", valor: "Zapatas corridas de concreto armado para capacidad de carga ≥ 15 t/m², desplante a 1.8 m", sitio: "Mecánica de suelos Juárez: 18 t/m² admisibles y nivel freático a 6 m.", fuentes: [input("mecanica_suelos", "Mecánica de suelos Juárez", 1), fuenteCorpus("ensenada", "estructural", 2)] },
    { id: "ES-03", disciplina: "estructura", titulo: "Concreto en superestructura", valor: `${n(promedio(concreto), 3)} m³ por m² construido (columnas, trabes y losas)`, rango: `${rango(concreto, 3)} m³/m² en el corpus`, fuentes: CORPUS.map((h) => catalogo(h.id, 1)) },
    { id: "ES-04", disciplina: "estructura", titulo: "Acero de refuerzo en estructura", valor: `${n(promedio(acero), 1)} kg por m² construido`, rango: `${rango(acero, 1)} kg/m² en el corpus`, fuentes: CORPUS.map((h) => catalogo(h.id, 1)) },
    { id: "ES-05", disciplina: "estructura", titulo: "Cargas y distorsión", valor: "Carga viva de 170 kg/m² en habitaciones y 350 kg/m² en áreas públicas; distorsión de entrepiso ≤ 0.012", fuentes: [fuenteCorpus("altamira", "estructural", 1), fuenteCorpus("ensenada", "estructural", 1)] },
    { id: "ES-06", disciplina: "estructura", titulo: "Sismo", valor: "Zona sísmica B (Manual de CFE 2015); muros divisorios desligados con junta de 2.5 cm", sitio: "Mecánica de suelos Juárez.", fuentes: [input("mecanica_suelos", "Mecánica de suelos Juárez", 1), fuenteCorpus("tijuana-florido", "estructural", 2)] },

    // --- Eléctrico
    { id: "IE-01", disciplina: "electrico", titulo: "Carga instalada", valor: `${n(promedio(kw), 1)} kW por llave (${n(promedio(kw) * 128)} kW en total)`, rango: `${rango(kw, 1)} kW por llave en el corpus`, fuentes: conMep.map((h) => fuenteCorpus(h.id, "instalaciones", PAGINA.instalaciones.electrico)) },
    { id: "IE-02", disciplina: "electrico", titulo: "Acometida y subestación", valor: "Media tensión 23 kV con subestación compacta de 500 kVA", sitio: "Factibilidad de CFE pendiente para cargas mayores a 300 kVA (riesgo R-09).", fuentes: [catalogo("altamira", 2), input("uso_suelo", "Uso de suelo Juárez", 1)] },
    { id: "IE-03", disciplina: "electrico", titulo: "Planta de emergencia", valor: "300 kW diésel con transferencia automática; respalda elevadores, bombas, SITE y 30% del alumbrado público", fuentes: [fuenteCorpus("tijuana-florido", "instalaciones", 1), catalogo("tijuana-florido", 2)] },
    { id: "IE-04", disciplina: "electrico", titulo: "Alumbrado", valor: "LED en todo el edificio; 6 luminarios por habitación y tarjetero ahorrador", fuentes: [catalogo("cancun-aeropuerto", 2), manual(50)] },
    { id: "IE-05", disciplina: "electrico", titulo: "Cuadro de cargas y unifilar", valor: "Entregables obligatorios del ejecutivo; el cuadro de cargas debe balancear fases ±5%", fuentes: [fuenteCorpus("ensenada", "instalaciones", 1)] },

    // --- Hidrosanitario y gas
    { id: "IH-01", disciplina: "hidrosanitario", titulo: "Gasto de diseño", valor: `${n(promedio(lps), 3)} L/s por llave`, rango: `${rango(lps, 3)} L/s por llave en el corpus`, fuentes: conMep.map((h) => fuenteCorpus(h.id, "instalaciones", PAGINA.instalaciones.hidrosanitario)) },
    { id: "IH-02", disciplina: "hidrosanitario", titulo: "Almacenamiento", valor: "Cisterna para dos días de consumo más reserva contra incendio de 60 m³", sitio: "Suministro municipal intermitente (uso de suelo).", fuentes: [input("uso_suelo", "Uso de suelo Juárez", 1), catalogo("altamira", 4)] },
    { id: "IH-03", disciplina: "hidrosanitario", titulo: "Agua caliente", valor: "Calentadores de paso a gas de alta eficiencia con tanques de 1,000 L y recirculación", fuentes: [fuenteCorpus("altamira", "instalaciones", 2), fuenteCorpus("cancun-aeropuerto", "instalaciones", 2)] },
    { id: "IH-04", disciplina: "hidrosanitario", titulo: "Muebles", valor: "Inodoro de 4.8 L, regadera de 7.6 L/min y lavabo con aireador", fuentes: [fuenteCorpus("ensenada", "instalaciones", 2)] },
    { id: "IH-05", disciplina: "hidrosanitario", titulo: "Protección contra congelamiento", valor: "Tuberías en azotea y fachada aisladas, con cinta calefactora en tramos expuestos", sitio: "Temperatura mínima de diseño de −5 °C (reglamento local).", fuentes: [input("reglamento", "Reglamento de construcción Juárez", 18)] },
    { id: "IH-06", disciplina: "hidrosanitario", titulo: "Gas", valor: "Gas L.P. con tanque estacionario de 5,000 L y tubería de cobre tipo L", fuentes: [fuenteCorpus("altamira", "instalaciones", 2)] },

    // --- PCI
    { id: "PC-01", disciplina: "pci", titulo: "Rociadores", valor: "Red de rociadores automáticos en todo el edificio; de pared en habitaciones", fuentes: [fuenteCorpus("altamira", "instalaciones", 3), catalogo("altamira", 4)] },
    { id: "PC-02", disciplina: "pci", titulo: "Equipo de bombeo", valor: "Bomba eléctrica de 500 gpm, bomba de combustión interna y bomba jockey", fuentes: [catalogo("ensenada", 4), catalogo("tijuana-florido", 4)] },
    { id: "PC-03", disciplina: "pci", titulo: "Detección y alarma", valor: "Panel direccionable, detector de humo por habitación, estaciones manuales y sirenas con estrobo", fuentes: [catalogo("cancun-aeropuerto", 4)] },
    { id: "PC-04", disciplina: "pci", titulo: "Compartimentación", valor: "Puertas cortafuego de 90 minutos en escaleras y sello cortafuego en pasos de instalaciones", fuentes: [catalogo("altamira", 4)] },
    { id: "PC-05", disciplina: "pci", titulo: "Reserva contra incendio", valor: "60 m³ en cisterna compartida con toma siamesa en fachada", fuentes: [catalogo("ensenada", 4)] },

    // --- HVAC
    { id: "HV-01", disciplina: "hvac", titulo: "Capacidad por llave", valor: "1.0 TR por llave (128 TR en habitaciones)", rango: `${rango(tr, 2)} TR por llave en el corpus`, sitio: "Veranos de 42 °C con baja humedad: más cerca de Altamira que de Tijuana.", fuentes: conMep.map((h) => fuenteCorpus(h.id, "instalaciones", PAGINA.instalaciones.hvac)) },
    { id: "HV-02", disciplina: "hvac", titulo: "Habitaciones", valor: "Minisplit inverter con bomba de calor y termostato programable", sitio: "Inviernos bajo cero: se requiere calefacción.", fuentes: [catalogo("altamira", 5), input("reglamento", "Reglamento de construcción Juárez", 18)] },
    { id: "HV-03", disciplina: "hvac", titulo: "Áreas públicas", valor: "2 equipos paquete de 10 TR y 1 de 5 TR con unidad de aire exterior", fuentes: [catalogo("cancun-aeropuerto", 5)] },
    { id: "HV-04", disciplina: "hvac", titulo: "Filtración", valor: "Filtros MERV 8 en equipos paquete y unidad de aire exterior", sitio: "Tolvaneras de primavera (topografía).", fuentes: [input("topografia", "Levantamiento topográfico Juárez", 1)] },
    { id: "HV-05", disciplina: "hvac", titulo: "Extracciones", valor: "Extracción de baños por núcleo; campana de cocina con aire de reposición y ducto trazado antes de cerrar estructura", sitio: "Riesgo R-04: cruce del ducto de cocina con trabes (patrón de Tijuana).", fuentes: [fuenteCorpus("tijuana-florido", "instalaciones", 3)] },

    // --- Interiores
    { id: "DI-01", disciplina: "interiores", titulo: "Piso de habitaciones", valor: "Piso vinílico LVT de 2.5 mm con apariencia de madera", fuentes: [fuenteCorpus("altamira", "interiores", 1), fuenteCorpus("ensenada", "interiores", 1)] },
    { id: "DI-02", disciplina: "interiores", titulo: "Baño de habitación", valor: "Porcelanato de 30×60 cm antiderrapante en piso y a 2.10 m en muros; cancel de cristal templado de 9 mm", fuentes: [fuenteCorpus("tijuana-florido", "interiores", 1), manual(18)] },
    { id: "DI-03", disciplina: "interiores", titulo: "Lobby y desayunador", valor: "Porcelanato rectificado de 60×120 cm en lobby y de 60×60 cm en desayunador", fuentes: [fuenteCorpus("altamira", "interiores", 2), fuenteCorpus("guaymas", "interiores", 2)] },
    { id: "DI-04", disciplina: "interiores", titulo: "Áreas de servicio", valor: "Concreto pulido con sellador epóxico o loseta antiderrapante de 33×33 cm", fuentes: [fuenteCorpus("altamira", "interiores", 2), fuenteCorpus("ensenada", "interiores", 2)] },
    { id: "DI-05", disciplina: "interiores", titulo: "FF&E de habitación", valor: "Cabecera tapizada, escritorio con contactos y USB, closet abierto y cortinas black-out", fuentes: [manual(14), manual(16)] },
  ];
}
