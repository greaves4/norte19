// 12 consultas precomputadas sobre el corpus. Las respuestas y tablas se calculan de los datos de cada hotel,
// y las fuentes apuntan a la página de la memoria donde está el dato (PAGINA en construir.ts).
import type { ConsultaCorpus, Fuente, HotelCorpus, ZonaId } from "../../../types/desarrollo.ts";
import { fuenteCorpus, importeCatalogo, PAGINA } from "./construir.ts";
import { CORPUS } from "./index.ts";

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const corto = (h: HotelCorpus) => h.nombre.replace("City Express ", "");
const promedio = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function zona(h: HotelCorpus, z: ZonaId) {
  return h.cuadroAreas.find((x) => x.zona === z)!;
}

const conMep = CORPUS.filter((h) => h.mep);
const sinMep = CORPUS.filter((h) => !h.mep);
const porAnio = [...CORPUS].sort((a, b) => b.anio - a.anio);

function consultaBoh(): ConsultaCorpus {
  const valores = CORPUS.map((h) => zona(h, "boh").m2PorLlave);
  const prom = promedio(valores);
  return {
    id: "boh-m2-llave",
    pregunta: "¿Cuál es el m² por llave promedio de BOH?",
    variantes: ["cuántos metros de servicio por habitación", "superficie de BOH por llave", "área de servicio por cuarto en los hoteles", "m2 de back of house por llave"],
    claves: [["boh", "servicio", "back"], ["llave", "habitacion", "cuarto", "m2", "metro", "superficie", "area"]],
    respuesta: `El BOH promedia ${n(prom, 1)} m² por llave en los 5 hoteles, con un rango de ${n(Math.min(...valores), 1)} a ${n(Math.max(...valores), 1)} m². Cancún Aeropuerto es el más alto porque concentra lavandería y almacenes en planta baja; Ensenada, el más bajo.`,
    tabla: {
      columnas: ["Hotel", "Llaves", "BOH (m²)", "m² por llave"],
      filas: [...CORPUS.map((h) => [corto(h), h.llaves, n(zona(h, "boh").m2), n(zona(h, "boh").m2PorLlave, 1)]), ["Promedio", "", "", n(prom, 1)]],
    },
    fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "arquitectonico", PAGINA.arquitectonico.cuadroAreas, "AQ-100 Cuadro de áreas")),
  };
}

function consultaEstructuraCancun(): ConsultaCorpus {
  const h = CORPUS.find((x) => x.id === "cancun-aeropuerto")!;
  return {
    id: "estructura-cancun",
    pregunta: "¿Qué sistema estructural se usó en Cancún y por qué?",
    variantes: ["estructura del hotel de Cancún", "por qué pilas en Cancún", "cimentación de Cancún Aeropuerto"],
    claves: [["estructur", "cimentacion", "pilas", "sistema"], ["cancun"]],
    respuesta: `${h.sistemaEstructural.sistema}, con ${h.sistemaEstructural.cimentacion.toLowerCase()}. ${h.sistemaEstructural.motivo}`,
    fuentes: [fuenteCorpus(h.id, "estructural", PAGINA.estructural.sistema), fuenteCorpus(h.id, "estructural", PAGINA.estructural.cimentacion)],
  };
}

function consultaTr(): ConsultaCorpus {
  const h = CORPUS.find((x) => x.id === "altamira")!;
  return {
    id: "tr-altamira",
    pregunta: "¿Cuántas toneladas de refrigeración por llave tiene Altamira?",
    variantes: ["capacidad de aire acondicionado de Altamira", "TR por habitación en Altamira", "clima de Altamira por llave"],
    claves: [["tr", "tonelada", "refrigeracion", "aire", "clima", "hvac"], ["altamira"]],
    respuesta: `Altamira tiene ${n(h.mep!.trPorLlave, 2)} TR por llave (${n(h.mep!.trPorLlave * h.llaves)} TR en total). El promedio de los hoteles con instalaciones en el corpus es ${n(promedio(conMep.map((x) => x.mep!.trPorLlave)), 2)} TR por llave; Guaymas no tiene memoria de instalaciones.`,
    tabla: { columnas: ["Hotel", "TR por llave", "TR total"], filas: CORPUS.map((x) => [corto(x), x.mep ? n(x.mep.trPorLlave, 2) : "Sin dato", x.mep ? n(x.mep.trPorLlave * x.llaves) : "—"]) },
    fuentes: conMep.map((x) => fuenteCorpus(x.id, "instalaciones", PAGINA.instalaciones.hvac)),
  };
}

function consultaPiso(): ConsultaCorpus {
  const ultimos = porAnio.slice(0, 3);
  const piso = (h: HotelCorpus) => h.acabados.find((a) => a.area === "habitacion" && a.elemento === "piso")!.material;
  return {
    id: "piso-habitaciones",
    pregunta: "¿Qué acabado de piso se usó en habitaciones en los últimos tres hoteles?",
    variantes: ["piso de las habitaciones recientes", "acabado de piso en cuartos", "qué piso llevan las habitaciones"],
    claves: [["piso", "acabado"], ["habitacion", "cuarto"]],
    respuesta: `En los tres hoteles más recientes: ${ultimos.map((h) => `${corto(h)} (${h.anio}) ${piso(h).charAt(0).toLowerCase()}${piso(h).slice(1)}`).join("; ")}. El vinílico LVT sustituye a la alfombra de los proyectos anteriores; en costa se prefiere porcelanato por el salitre.`,
    tabla: { columnas: ["Hotel", "Año", "Piso de habitación"], filas: porAnio.map((h) => [corto(h), h.anio, piso(h)]) },
    fuentes: ultimos.map((h) => fuenteCorpus(h.id, "interiores", PAGINA.interiores.habitacion)),
  };
}

function consultaKw(): ConsultaCorpus {
  const vals = conMep.map((h) => h.mep!.kwPorLlave);
  return {
    id: "kw-llave",
    pregunta: "¿Cuál es la carga eléctrica instalada por llave?",
    variantes: ["kW por habitación en el corpus", "carga instalada por llave", "demanda eléctrica por cuarto"],
    claves: [["kw", "carga", "electric", "demanda"], ["llave", "habitacion", "cuarto", "instalada"]],
    respuesta: `La carga instalada va de ${n(Math.min(...vals), 1)} a ${n(Math.max(...vals), 1)} kW por llave (promedio ${n(promedio(vals), 2)} kW) en los ${conMep.length} hoteles con memoria de instalaciones. Guaymas no tiene el dato.`,
    tabla: { columnas: ["Hotel", "kW por llave", "kW totales"], filas: CORPUS.map((h) => [corto(h), h.mep ? n(h.mep.kwPorLlave, 1) : "Sin dato", h.mep ? n(h.mep.kwPorLlave * h.llaves) : "—"]) },
    fuentes: conMep.map((h) => fuenteCorpus(h.id, "instalaciones", PAGINA.instalaciones.electrico)),
  };
}

function consultaConstruidos(): ConsultaCorpus {
  const vals = CORPUS.map((h) => h.m2Total / h.llaves);
  return {
    id: "m2-construidos",
    pregunta: "¿Cuántos m² construidos por llave tienen los hoteles?",
    variantes: ["superficie total por habitación", "metros construidos por llave", "área construida total de cada hotel"],
    claves: [["construid", "total"], ["llave", "habitacion", "hotel", "m2", "metro", "superficie"]],
    respuesta: `Los hoteles del corpus tienen entre ${n(Math.min(...vals), 1)} y ${n(Math.max(...vals), 1)} m² construidos por llave (promedio ${n(promedio(vals), 1)} m²), sin contar el estacionamiento exterior.`,
    tabla: { columnas: ["Hotel", "Llaves", "m² construidos", "m² por llave"], filas: CORPUS.map((h) => [corto(h), h.llaves, n(h.m2Total), n(h.m2Total / h.llaves, 1)]) },
    fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "arquitectonico", PAGINA.arquitectonico.cuadroAreas, "AQ-100 Cuadro de áreas")),
  };
}

function consultaCimentacion(): ConsultaCorpus {
  return {
    id: "cimentacion",
    pregunta: "¿Qué tipo de cimentación se usó en cada hotel?",
    variantes: ["cimentaciones del corpus", "zapatas, pilas o pilotes por hotel", "cómo se cimentaron los hoteles"],
    claves: [["cimentac", "zapata", "pilote"]],
    respuesta: `La cimentación depende del suelo: zapatas en Tijuana y Ensenada (suelos firmes), pilas a roca en Cancún, pilotes en Altamira (arcillas blandas) y losa de cimentación en Guaymas (arcillas expansivas).`,
    tabla: { columnas: ["Hotel", "Cimentación", "Sistema estructural"], filas: CORPUS.map((h) => [corto(h), h.sistemaEstructural.cimentacion, h.sistemaEstructural.sistema]) },
    fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "estructural", PAGINA.estructural.cimentacion)),
  };
}

function consultaCostoCivil(): ConsultaCorpus {
  const filas = CORPUS.map((h) => {
    const c = h.catalogos.find((x) => x.id === "obra_civil")!;
    return { h, fecha: c.fechaOrigen, porM2: importeCatalogo(c, h) / h.m2Total };
  });
  return {
    id: "costo-obra-civil",
    pregunta: "¿Cuánto cuesta por m² la obra civil en el corpus?",
    variantes: ["costo de obra civil por metro cuadrado", "precio por m2 de estructura y albañilería", "cuánto costó la obra negra por m²"],
    claves: [["costo", "cuesta", "precio", "importe"], ["obra civil", "civil", "obra negra", "m2", "metro", "estructura"]],
    respuesta: `A precios de su fecha de origen, la obra civil costó entre ${n(Math.min(...filas.map((f) => f.porM2)))} y ${n(Math.max(...filas.map((f) => f.porM2)))} MXN por m² construido. Los precios van de ${filas.map((f) => f.fecha).sort()[0]} a ${filas.map((f) => f.fecha).sort().at(-1)}: para comparar hay que actualizarlos con el factor de la Fase de Definición.`,
    tabla: { columnas: ["Hotel", "Precios a", "MXN por m²"], filas: filas.map((f) => [corto(f.h), f.fecha, n(f.porM2)]) },
    fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "catalogo", 1)),
  };
}

function consultaElevadores(): ConsultaCorpus {
  return {
    id: "elevadores",
    pregunta: "¿Cuántos elevadores tiene cada hotel?",
    variantes: ["número de elevadores por hotel", "elevadores por llave", "circulación vertical del corpus"],
    claves: [["elevador", "ascensor"]],
    respuesta: `Los hoteles de 4 y 5 niveles resolvieron con 2 elevadores de pasajeros; Cancún, con 6 niveles y 138 llaves, lleva 3. Equivale a un elevador por cada ${n(promedio(CORPUS.map((h) => h.llaves / h.elevadores)))} llaves en promedio.`,
    tabla: { columnas: ["Hotel", "Niveles", "Llaves", "Elevadores"], filas: CORPUS.map((h) => [corto(h), h.niveles, h.llaves, h.elevadores]) },
    fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "arquitectonico", PAGINA.arquitectonico.elevadores)),
  };
}

function consultaIncompleto(): ConsultaCorpus {
  const fuentes: Fuente[] = [
    ...sinMep.map((h) => ({ tipo: "corpus" as const, hotelId: h.id, documento: "Matriz de cobertura del corpus", nota: "Instalaciones: planos, XREF, memoria y catálogo ausentes" })),
    { tipo: "corpus", hotelId: "cancun-aeropuerto", documento: "Matriz de cobertura del corpus", nota: "Interiores: XREF, memoria y catálogo parciales" },
  ];
  return {
    id: "incompleto",
    pregunta: "¿Qué hotel tiene información incompleta?",
    variantes: ["qué le falta al corpus", "hoteles sin instalaciones", "huecos de información en el corpus", "cobertura incompleta"],
    claves: [["incomplet", "falta", "ausente", "hueco", "cobertura", "sin instalacion"]],
    respuesta: `${sinMep.map(corto).join(", ")} no tiene información de Instalaciones (ni planos, ni memoria, ni catálogo): sus datos de MEP no entran en los promedios. Cancún Aeropuerto tiene Interiores parcial. El resto del corpus está completo.`,
    fuentes,
  };
}

function consultaAgua(): ConsultaCorpus {
  const vals = conMep.map((h) => h.mep!.lpsPorLlave);
  return {
    id: "agua-llave",
    pregunta: "¿Cuál es el gasto de agua por llave?",
    variantes: ["litros por segundo por habitación", "consumo de agua por llave", "gasto hidráulico de diseño"],
    claves: [["agua", "gasto", "hidraul", "hidrosanit", "litro", "l/s"], ["llave", "habitacion", "consumo", "cuarto", "diseno"]],
    respuesta: `El gasto medio de diseño va de ${n(Math.min(...vals), 3)} a ${n(Math.max(...vals), 3)} L/s por llave (promedio ${n(promedio(vals), 3)}) en los hoteles con memoria de instalaciones.`,
    tabla: { columnas: ["Hotel", "L/s por llave", "L/s totales"], filas: CORPUS.map((h) => [corto(h), h.mep ? n(h.mep.lpsPorLlave, 3) : "Sin dato", h.mep ? n(h.mep.lpsPorLlave * h.llaves, 2) : "—"]) },
    fuentes: conMep.map((h) => fuenteCorpus(h.id, "instalaciones", PAGINA.instalaciones.hidrosanitario)),
  };
}

function consultaFachada(): ConsultaCorpus {
  return {
    id: "fachada",
    pregunta: "¿Qué sistema de fachada se usó en cada hotel?",
    variantes: ["envolvente de los hoteles", "fachadas del corpus", "EIFS o block en fachada"],
    claves: [["fachada", "envolvente", "eifs"]],
    respuesta: "Dos hoteles usan EIFS (Tijuana y Altamira), dos muro de block con pintura elastomérica (Cancún y Ensenada) y Guaymas panel de fibrocemento sobre bastidor metálico. En costa se reforzó la ventanería: cristal resistente a impacto en Cancún y PVC en Guaymas.",
    tabla: { columnas: ["Hotel", "Sistema de fachada"], filas: CORPUS.map((h) => [corto(h), h.fachada]) },
    fuentes: CORPUS.map((h) => fuenteCorpus(h.id, "arquitectonico", PAGINA.arquitectonico.fachada)),
  };
}

export const CONSULTAS_CORPUS: ConsultaCorpus[] = [
  consultaBoh(),
  consultaEstructuraCancun(),
  consultaTr(),
  consultaPiso(),
  consultaKw(),
  consultaConstruidos(),
  consultaCimentacion(),
  consultaCostoCivil(),
  consultaElevadores(),
  consultaIncompleto(),
  consultaAgua(),
  consultaFachada(),
];

export const PREGUNTAS_SUGERIDAS_CORPUS = [
  "¿Cuál es el m² por llave promedio de BOH?",
  "¿Qué sistema estructural se usó en Cancún y por qué?",
  "¿Cuántas toneladas de refrigeración por llave tiene Altamira?",
  "¿Qué acabado de piso se usó en habitaciones en los últimos tres hoteles?",
];
