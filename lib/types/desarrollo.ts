// Tipos del prototipo Desarrollo hotelero. Fechas como ISO string para persistir en localStorage.
// Sin imports con alias: los importan las fixtures del corpus, que también usa el script de Node.

export type PerfilDesarrollo = "direccion" | "revisor" | "proyectista";

// --- Trazabilidad -------------------------------------------------------------------------------------

// Todo dato generado lleva de dónde salió: un documento del corpus (hotel, documento, página o clave de plano)
// o un input del proyecto.
export type Fuente = {
  tipo: "corpus" | "input";
  hotelId?: string;
  inputId?: InputId;
  documento: string; // id del documento del corpus o nombre del input
  pagina?: number;
  clavePlano?: string;
  nota?: string;
};

// --- Corpus -------------------------------------------------------------------------------------------

export type Disciplina = "arquitectonico" | "estructural" | "instalaciones" | "interiores" | "equipamiento";
export type TipoDoc = "planos" | "xref" | "memoria" | "catalogo";
export type Cobertura = "completo" | "parcial" | "ausente";

export type ZonaId = "habitaciones" | "areas_publicas" | "boh" | "circulaciones" | "estacionamiento";

export type Zona = { zona: ZonaId; m2: number; m2PorLlave: number; fuentes: Fuente[] };

export type MepPorLlave = { kwPorLlave: number; trPorLlave: number; lpsPorLlave: number };

export type AreaAcabado = "habitacion" | "bano_habitacion" | "lobby" | "desayunador" | "pasillos" | "boh";
export type Acabado = { area: AreaAcabado; elemento: "piso" | "muro" | "plafon"; material: string; fuentes: Fuente[] };

export type CatalogoId = "obra_civil" | "electrico" | "hidrosanitario" | "pci" | "hvac";

// Base con la que escala la cantidad: m² construidos, llaves, niveles o una cantidad fija por hotel.
export type BaseRatio = "m2" | "llave" | "nivel" | "global";

export type Concepto = {
  clave: string;
  concepto: string;
  unidad: string;
  base: BaseRatio;
  ratio: number; // cantidad por unidad de base
  precioUnitario: number; // MXN sin IVA a la fecha de origen
};

export type Catalogo = {
  id: CatalogoId;
  nombre: string;
  fechaOrigen: string; // AAAA-MM de los precios
  conceptos: Concepto[];
  fuente: Fuente;
};

export type DocumentoCorpus = {
  id: string; // "<hotel>-<disciplina>"
  hotelId: string;
  disciplina: Disciplina | "catalogo";
  titulo: string;
  paginas: number;
};

export type HotelCorpus = {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  llaves: number;
  niveles: number;
  elevadores: number;
  m2Total: number;
  anio: number;
  cuadroAreas: Zona[];
  sistemaEstructural: { sistema: string; cimentacion: string; motivo: string; claros: string };
  fachada: string;
  mep: MepPorLlave | null; // null cuando el corpus no tiene instalaciones
  acabados: Acabado[];
  catalogos: Catalogo[];
  cobertura: Record<Disciplina, Record<TipoDoc, Cobertura>>;
  documentos: DocumentoCorpus[];
};

export type EstadoCorpus = {
  documentosProcesados: number;
  paginasOcr: number;
  planosDwg: number;
  xrefResueltos: number;
  duplicadosDetectados: number;
  duplicadosDescartados: number;
  campos: { alta: number; media: number; baja: number };
};

export type ConsultaCorpus = {
  id: string;
  pregunta: string;
  variantes: string[];
  // Grupos de raíces normalizadas (sin acentos, minúsculas); la pregunta debe tocar cada grupo.
  claves: string[][];
  respuesta: string;
  tabla?: { columnas: string[]; filas: (string | number)[][] };
  fuentes: Fuente[];
};

// --- Proyecto -----------------------------------------------------------------------------------------

export type InputId =
  | "anteproyecto"
  | "uso_suelo"
  | "mecanica_suelos"
  | "topografia"
  | "corpus"
  | "brand_standards"
  | "programa"
  | "capex_objetivo"
  | "reglamento"
  | "estudio_mercado";

export type Archivo = { nombre: string; src: string; tipo: "pdf" | "imagen" | "otro"; tamano?: number; cargadoEn: string };

export type InputProyecto = {
  id: InputId;
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
  // Qué no se puede hacer (obligatorio) o qué queda como supuesto (complementario) si falta.
  impacto: string;
  // Entregables del semáforo que quedan en ámbar mientras falte (complementarios).
  afecta: EntregableId[];
  archivo?: Archivo;
};

// 01 Inputs → 02 Retrieval → 03 Validation → 04 Generation → 05 QA
export type Fase = 1 | 2 | 3 | 4 | 5;

export type ZonaProyecto = { zona: ZonaId; m2: number; m2Original: number; fuentes: Fuente[] };

export type EstatusMarca = "cumple" | "desvia" | "sin_dato";
export type RequisitoMarca = {
  id: string;
  categoria: string;
  requisito: string;
  estatus: EstatusMarca;
  evidencia: string;
  origen: "manual" | "inferido";
  fuentes: Fuente[];
};

export type Decision = { id: string; tema: string; decision: string; justificacion: string; fuentes: Fuente[] };

export type EstatusRiesgo = "pendiente" | "confirmado" | "descartado";
export type Riesgo = {
  id: string;
  tipo: "constructivo" | "operativo" | "coordinacion";
  descripcion: string;
  severidad: "alta" | "media" | "baja";
  origen: "sitio" | "corpus";
  mitigacion: string;
  estatus: EstatusRiesgo;
  fuentes: Fuente[];
};

export type ActaGate = { aprobadoPor: string; fecha: string; resumen: string[] };

export type Definicion = {
  cuadroAreas: ZonaProyecto[];
  marca: RequisitoMarca[];
  decisiones: Decision[];
  riesgos: Riesgo[];
  acta?: ActaGate;
};

export type ArchivoPaquete = { nombre: string; src?: string; tamano?: number };

export type EntregableId =
  | "cuadro_areas"
  | "marca"
  | "decisiones"
  | "riesgos"
  | "capex"
  | "arquitectura"
  | "coordinacion"
  | "estructura"
  | "electrico"
  | "hidrosanitario"
  | "pci_hvac"
  | "interiores"
  | "catalogos";

export type Semaforo = "verde" | "ambar" | "rojo";
export type Entregable = { id: EntregableId; nombre: string; peso: number; semaforo: Semaforo };

export type Rubro = "coordinacion" | "funcional" | "marca" | "constructiva" | "documental" | "economica";
export type Severidad = "critico" | "medio" | "menor";
export type EstatusHallazgo = "pendiente" | "confirmado" | "ajustado" | "descartado";
export type Impacto = "costo" | "tiempo" | "operacion" | "marca" | "construccion";

export type Hallazgo = {
  id: string; // C-nn críticos, M-nn medios, N-nn menores
  rubro: Rubro;
  disciplina: string;
  nivel?: number;
  zona?: string;
  eje?: { x: string; y: number };
  descripcion: string;
  severidad: Severidad;
  impacto: Impacto[];
  accion: string;
  responsable: string;
  prioridad: "alta" | "media" | "baja";
  estatus: EstatusHallazgo;
  motivo?: string;
  resolucion?: "abierto" | "en_proceso" | "resuelto";
};

export type Auditoria = { ejecutadaEn: string; ejecutadaPor: string; verificacion: "2d" | "bim"; hallazgos: Hallazgo[] };

export type EventoProyecto = { fecha: string; titulo: string; actor: string; descripcion?: string };

export type Proyecto = {
  id: string;
  nombre: string;
  ciudad: string;
  segmento: string;
  llaves: number;
  niveles: number;
  terreno: { superficieM2: number; direccion: string; lat: number; lng: number };
  fase: Fase;
  inputs: InputProyecto[];
  definicion: Definicion;
  bibliotecaAgregada: string[]; // ids de la biblioteca de soluciones
  paquete: ArchivoPaquete[] | null;
  notaSupuestoPaquete?: string;
  factorActualizacion: number;
  semaforo: Entregable[];
  auditoria?: Auditoria;
  bitacora: EventoProyecto[];
};

// --- Etiquetas ----------------------------------------------------------------------------------------

export const NOMBRE_DISCIPLINA: Record<Disciplina, string> = {
  arquitectonico: "Arquitectónico",
  estructural: "Estructural",
  instalaciones: "Instalaciones",
  interiores: "Interiores",
  equipamiento: "Equipamiento",
};

export const NOMBRE_TIPO_DOC: Record<TipoDoc, string> = { planos: "Planos", xref: "XREF", memoria: "Memoria", catalogo: "Catálogo" };

export const NOMBRE_ZONA: Record<ZonaId, string> = {
  habitaciones: "Habitaciones",
  areas_publicas: "Áreas públicas",
  boh: "BOH (servicio)",
  circulaciones: "Circulaciones",
  estacionamiento: "Estacionamiento",
};

export const NOMBRE_CATALOGO: Record<CatalogoId, string> = {
  obra_civil: "Obra civil",
  electrico: "Eléctrico",
  hidrosanitario: "Hidrosanitario y gas",
  pci: "Protección contra incendio",
  hvac: "HVAC",
};

export const NOMBRE_FASE: Record<Fase, string> = { 1: "Inputs", 2: "Retrieval", 3: "Validation", 4: "Generation", 5: "QA" };

export const ZONAS: ZonaId[] = ["habitaciones", "areas_publicas", "boh", "circulaciones", "estacionamiento"];
export const DISCIPLINAS: Disciplina[] = ["arquitectonico", "estructural", "instalaciones", "interiores", "equipamiento"];
export const TIPOS_DOC: TipoDoc[] = ["planos", "xref", "memoria", "catalogo"];
export const CATALOGOS: CatalogoId[] = ["obra_civil", "electrico", "hidrosanitario", "pci", "hvac"];
