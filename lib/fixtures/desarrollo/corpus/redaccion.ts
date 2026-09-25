// Redacción de las memorias y catálogos de ejemplo del corpus (texto plano por página) a partir de los datos de cada
// hotel. La usa scripts/desarrollo/generar-textos.mts para escribir textos/<hotel>-<disciplina>.txt y textos.json.
// Las secciones caen en las páginas de PAGINA (construir.ts), que citan las fuentes de las consultas.
import type { AreaAcabado, HotelCorpus, ZonaId } from "../../../types/desarrollo.ts";
import { PAGINA } from "./construir.ts";

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const mxn = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const ZONA: Record<ZonaId, string> = {
  habitaciones: "Habitaciones",
  areas_publicas: "Áreas públicas",
  boh: "BOH (áreas de servicio)",
  circulaciones: "Circulaciones",
  estacionamiento: "Estacionamiento (exterior)",
};

const AREA: Record<AreaAcabado, string> = {
  habitacion: "habitación tipo",
  bano_habitacion: "baño de habitación",
  lobby: "lobby",
  desayunador: "desayunador",
  pasillos: "pasillos de habitaciones",
  boh: "áreas de servicio (BOH)",
};

function acabado(h: HotelCorpus, area: AreaAcabado, elemento: "piso" | "muro" | "plafon") {
  return h.acabados.find((a) => a.area === area && a.elemento === elemento)?.material ?? "Según especificación de marca";
}

function arquitectonico(h: HotelCorpus): string[] {
  const construidas = h.cuadroAreas.filter((z) => z.zona !== "estacionamiento");
  const est = h.cuadroAreas.find((z) => z.zona === "estacionamiento")!;
  const cajones = Math.round(est.m2 / 25);
  const accesibles = Math.max(2, Math.round(h.llaves * 0.03));
  const p1 = `MEMORIA DESCRIPTIVA ARQUITECTÓNICA
${h.nombre.toUpperCase()}
${h.ciudad}, ${h.estado} · Proyecto ${h.anio}

1. DESCRIPCIÓN GENERAL
El proyecto corresponde a un hotel de servicio selecto (select-service) de la marca City Express, ubicado en ${h.ciudad}, ${h.estado}. El edificio desarrolla ${h.llaves} habitaciones distribuidas en ${h.niveles} niveles, con planta baja destinada a lobby, desayunador, áreas de servicio y cuartos técnicos, y los niveles superiores a habitaciones con un núcleo de circulación vertical central y escaleras de emergencia en los extremos.

La superficie construida total es de ${n(h.m2Total)} m², equivalente a ${n(h.m2Total / h.llaves, 1)} m² construidos por llave. El estacionamiento se resuelve a nivel de terreno, fuera de la huella del edificio, y no forma parte de la superficie construida.

2. PROGRAMA ARQUITECTÓNICO
- Habitaciones: ${h.llaves} llaves, de las cuales ${accesibles} son accesibles conforme al manual de marca y a la NOM-001-SEDATU-2021. Habitación tipo con cama king o dos matrimoniales, escritorio de trabajo, closet abierto y baño con regadera.
- Áreas públicas: lobby con recepción, business center, desayunador con capacidad para el 35% de la ocupación, gimnasio y sanitarios públicos.
- BOH: lavandería de blancos, almacén de blancos por nivel, cocina de desayunos, comedor y vestidores de personal, oficinas administrativas, cuarto de basura y andén de servicio.
- Cuartos técnicos: subestación, planta de emergencia, cuarto de bombas, cisterna y SITE de telecomunicaciones.`;

  const filas = h.cuadroAreas
    .map((z) => `- ${ZONA[z.zona]}: ${n(z.m2)} m² · ${n(z.m2PorLlave, 1)} m² por llave${z.zona === "estacionamiento" ? "" : ` · ${n((z.m2 / h.m2Total) * 100, 1)}% del construido`}`)
    .join("\n");
  const p2 = `3. CUADRO DE ÁREAS (plano AQ-100)
Las superficies se miden a paños exteriores de muros y se agrupan por zona funcional conforme al estándar de desarrollo de Norte 19.

${filas}

Superficie construida total: ${n(h.m2Total)} m² (${n(h.m2Total / h.llaves, 1)} m² por llave).

La zona de habitaciones concentra ${n((construidas.find((z) => z.zona === "habitaciones")!.m2 / h.m2Total) * 100, 1)}% de la superficie construida. Las áreas públicas se mantienen compactas: el desayunador comparte circulaciones con el lobby y el business center se integra al mismo espacio. El BOH incluye la lavandería de blancos en planta baja y un almacén de blancos por nivel junto al núcleo de servicio.

Las circulaciones horizontales se resuelven con pasillos de doble carga de 1.80 m de ancho libre, lo que mantiene el porcentaje de circulación por debajo del 20% del área construida.`;

  const p3 = `4. FACHADAS Y ENVOLVENTE
Sistema de fachada: ${h.fachada}. La selección considera el clima de ${h.ciudad}, el mantenimiento esperado y el costo por m² de fachada frente a los hoteles de referencia de la marca.

5. CIRCULACIONES VERTICALES
El edificio cuenta con ${h.elevadores} elevadores de pasajeros de 1,000 kg de capacidad a 1.0 m/s, ubicados en el núcleo central, y un elevador de servicio compartido con uno de los de pasajeros mediante control de prioridad. Dos escaleras de emergencia presurizadas o ventiladas naturalmente comunican todos los niveles con salidas directas al exterior.

6. ESTACIONAMIENTO
Estacionamiento descubierto de ${n(est.m2)} m² con ${cajones} cajones (${n(cajones / h.llaves, 2)} cajones por llave), incluidos los cajones accesibles que exige el reglamento local, pavimento de concreto hidráulico y alumbrado con postes de 6 m.`;
  return [p1, p2, p3];
}

function estructural(h: HotelCorpus): string[] {
  const s = h.sistemaEstructural;
  const p1 = `MEMORIA DE CÁLCULO ESTRUCTURAL
${h.nombre.toUpperCase()}

1. SISTEMA ESTRUCTURAL
Sistema: ${s.sistema}.
Claros de diseño: ${s.claros}.

Criterio de selección: ${s.motivo}

El análisis se realizó con modelos tridimensionales de elementos finitos considerando cargas muertas, vivas (170 kg/m² en habitaciones y 350 kg/m² en áreas públicas), sismo conforme al Manual de Diseño de Obras Civiles de CFE (2015) y viento para la zona de ${h.ciudad}. Las distorsiones de entrepiso se limitaron a 0.012 para proteger los muros divisorios y la fachada.`;
  const p2 = `2. CIMENTACIÓN
Tipo: ${s.cimentacion}.

La cimentación se diseñó con base en el estudio de mecánica de suelos del predio. ${s.motivo.split(":")[0]}. Se verificaron asentamientos inmediatos y diferidos, y la capacidad de carga admisible con un factor de seguridad de 3.

3. MATERIALES
Concreto premezclado f'c = 300 kg/cm² en columnas, trabes y losas; f'c = 250 kg/cm² en cimentación. Acero de refuerzo fy = 4,200 kg/cm². El recubrimiento mínimo se incrementa a 4 cm en elementos expuestos al exterior.

4. ELEMENTOS NO ESTRUCTURALES
Los muros divisorios de habitación se desligan de la estructura con juntas de 2.5 cm rellenas de material compresible. Los equipos en azotea se anclan con bases antivibratorias y restricción sísmica.`;
  return [p1, p2];
}

function instalaciones(h: HotelCorpus): string[] {
  const m = h.mep!;
  const p1 = `MEMORIA DE INSTALACIONES
${h.nombre.toUpperCase()}

1. INSTALACIÓN ELÉCTRICA
Carga instalada de ${n(m.kwPorLlave, 1)} kW por llave, ${n(m.kwPorLlave * h.llaves)} kW en total, con un factor de demanda de 0.65. Acometida en media tensión de 23 kV con subestación compacta tipo pedestal; tablero general en baja tensión, tableros de fuerza y alumbrado por nivel y centro de carga en cada habitación.

Planta de emergencia diésel con transferencia automática que respalda elevadores, bombas, alumbrado de emergencia, SITE y el 30% del alumbrado de áreas públicas. Iluminación LED en todo el edificio y tarjetero ahorrador de energía en habitaciones.`;
  const p2 = `2. INSTALACIÓN HIDROSANITARIA
Gasto medio de diseño de ${n(m.lpsPorLlave, 3)} L/s por llave (${n(m.lpsPorLlave * h.llaves, 2)} L/s en total). Cisterna de concreto con reserva para dos días de consumo más la reserva contra incendio; equipo hidroneumático triplex de velocidad variable.

Agua caliente con calentadores de paso a gas de alta eficiencia, tanques de almacenamiento y recirculación. Muebles de bajo consumo: inodoros de 4.8 L, regaderas de 7.6 L/min y lavabos con aireador.

3. INSTALACIÓN DE GAS
Gas L.P. con tanque estacionario de 5,000 L, reguladores de alta y baja presión y tubería de cobre tipo L hacia calentadores y cocina.`;
  const p3 = `4. AIRE ACONDICIONADO Y VENTILACIÓN (HVAC)
Capacidad de ${n(m.trPorLlave, 2)} TR por llave (${n(m.trPorLlave * h.llaves)} TR en total). Habitaciones con equipos minisplit inverter y termostato programable; lobby, desayunador y áreas públicas con equipos paquete en azotea y unidad de aire exterior. Extracción mecánica en baños por núcleo y extracción de cocina con campana y aire de reposición.

5. PROTECCIÓN CONTRA INCENDIO
Red de rociadores automáticos en todo el edificio, gabinetes con manguera en cada nivel, bomba eléctrica, bomba de combustión interna y bomba jockey. Detección de humo direccionable en habitaciones y pasillos, estaciones manuales y sirenas con estrobo conforme a la NOM-002-STPS y al reglamento local.`;
  return [p1, p2, p3];
}

function interiores(h: HotelCorpus): string[] {
  const p1 = `ESPECIFICACIÓN DE ACABADOS E INTERIORES
${h.nombre.toUpperCase()}

1. HABITACIÓN TIPO
Piso: ${acabado(h, "habitacion", "piso")}.
Muros: ${acabado(h, "habitacion", "muro")}.
Plafón: ${acabado(h, "habitacion", "plafon")}.
Mobiliario de marca: cabecera tapizada, escritorio con toma de corriente y USB, closet abierto y cortinas black-out.

2. BAÑO DE HABITACIÓN
Piso: ${acabado(h, "bano_habitacion", "piso")}.
Muros: ${acabado(h, "bano_habitacion", "muro")}.
Cancel de cristal templado de 9 mm y regadera con mezcladora termostática.`;
  const areas: AreaAcabado[] = ["lobby", "desayunador", "pasillos", "boh"];
  const p2 = `3. ÁREAS PÚBLICAS Y DE SERVICIO
${areas.map((a) => `Piso de ${AREA[a]}: ${acabado(h, a, "piso")}.`).join("\n")}

Los acabados de áreas públicas siguen el manual de marca vigente en ${h.anio}; los de BOH priorizan limpieza y resistencia al tránsito de carros de servicio.`;
  return [p1, p2];
}

function catalogo(h: HotelCorpus): string[] {
  const base = { m2: "por m² construido", llave: "por llave", nivel: "por nivel", global: "por hotel" } as const;
  return h.catalogos.map(
    (c) => `CATÁLOGO DE CONCEPTOS · ${c.nombre.toUpperCase()}
${h.nombre} · Precios a ${c.fechaOrigen} (MXN sin IVA)

${c.conceptos.map((k) => `${k.clave} | ${k.concepto} | ${k.unidad} | ${n(k.ratio, 4)} ${base[k.base]} | P.U. ${mxn(k.precioUnitario)}`).join("\n")}`,
  );
}

// Páginas de cada documento del hotel: { "<hotel>-<disciplina>": [página1, página2, ...] }.
export function redactarHotel(h: HotelCorpus): Record<string, string[]> {
  const out: Record<string, string[]> = {
    [`${h.id}-arquitectonico`]: arquitectonico(h),
    [`${h.id}-estructural`]: estructural(h),
    [`${h.id}-interiores`]: interiores(h),
    [`${h.id}-catalogo`]: catalogo(h),
  };
  if (h.mep) out[`${h.id}-instalaciones`] = instalaciones(h);
  return out;
}

// Comprobación de la redacción contra el mapa de páginas (lo usa la prueba).
export const SECCIONES_ESPERADAS: [keyof typeof PAGINA, number, string][] = [
  ["arquitectonico", PAGINA.arquitectonico.cuadroAreas, "3. CUADRO DE ÁREAS"],
  ["arquitectonico", PAGINA.arquitectonico.elevadores, "5. CIRCULACIONES VERTICALES"],
  ["estructural", PAGINA.estructural.sistema, "1. SISTEMA ESTRUCTURAL"],
  ["estructural", PAGINA.estructural.cimentacion, "2. CIMENTACIÓN"],
  ["instalaciones", PAGINA.instalaciones.electrico, "1. INSTALACIÓN ELÉCTRICA"],
  ["instalaciones", PAGINA.instalaciones.hidrosanitario, "2. INSTALACIÓN HIDROSANITARIA"],
  ["instalaciones", PAGINA.instalaciones.hvac, "4. AIRE ACONDICIONADO"],
  ["interiores", PAGINA.interiores.habitacion, "1. HABITACIÓN TIPO"],
  ["interiores", PAGINA.interiores.publicas, "3. ÁREAS PÚBLICAS"],
];
