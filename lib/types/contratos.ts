// Tipos del prototipo Contratos (CLM). Fechas como ISO string para persistir en localStorage.
import type { StatusMap } from "@/components/shared/StatusBadge";
import type { TipoContrato } from "@/lib/fixtures/contratos/catalogo";

export type { TipoContrato };

export type PerfilContratos = "solicitante" | "abogado" | "directivo" | "admin";

export type UsuarioContratos = { perfil: PerfilContratos; id: string; nombre: string; puesto: string };

export type TipoPersona = "fisica" | "moral";

export type Abogado = { id: string; nombre: string; especialidad: string };

export type Solicitante = { id: string; area: string; nombre: string; puesto: string };

// Definición declarativa del formulario dinámico.
export type TipoCampo = "text" | "number" | "date" | "select" | "money";

export type DefinicionCampo = {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];
  ayuda?: string;
  placeholder?: string;
};

export type DefinicionDocumento = { clave: string; etiqueta: string; obligatorio: boolean };

export type DefinicionFormulario = {
  tipoPersona: TipoPersona;
  tipoContrato: TipoContrato;
  campos: DefinicionCampo[];
  documentos: DefinicionDocumento[];
};

export type Documento = {
  clave: string;
  etiqueta: string;
  nombre: string;
  src: string;
  tipo: "pdf" | "imagen";
  tamano?: number;
};

export type EstatusSolicitud =
  | "nueva"
  | "en_analisis"
  | "en_aprobacion"
  | "aprobada"
  | "en_firma"
  | "formalizada"
  | "en_ajustes";

export type TipoEventoSolicitud =
  | "creada"
  | "asignada"
  | "reasignada"
  | "en_analisis"
  | "analisis_guardado"
  | "regresada"
  | "reenviada"
  | "enviada_aprobacion"
  | "aprobada"
  | "rechazada_ajustes"
  | "enviada_firma"
  | "firma"
  | "formalizada";

export type EventoSolicitud = {
  fecha: string;
  tipo: TipoEventoSolicitud;
  titulo: string;
  actor: string;
  descripcion?: string;
};

export type VersionAnalisis = { fecha: string; autor: string; texto: string };

export type PasoFirma = "enviado" | "firmante_1" | "firmante_2" | "constancia" | "formalizado";

export type Solicitud = {
  id: string;
  folio: string;
  tipoPersona: TipoPersona;
  tipoContrato: TipoContrato;
  campos: Record<string, string | number>;
  expediente: Documento[];
  solicitanteId: string;
  abogadoId: string;
  estatus: EstatusSolicitud;
  slaDiasHabiles: number;
  creadaEn: string;
  timeline: EventoSolicitud[];
  analisis?: string;
  versionesAnalisis: VersionAnalisis[];
  motivoRechazo?: string;
  // Estatus y fecha en que se entró a cada etapa (para tiempos por columna del Kanban).
  etapas: Partial<Record<EstatusSolicitud, string>>;
  firma?: { pasos: Partial<Record<PasoFirma, string>> };
  contratoId?: string;
  renovacionDe?: string;
};

export type Confianza = "alta" | "media" | "baja";

export type CampoExtraido = {
  clave: string;
  etiqueta: string;
  valor: string;
  confianza: Confianza;
  pagina: number | null;
  clausula: string | null;
  confirmado: boolean;
};

export type EstatusTanto = "en_resguardo" | "prestado";

export type Prestamo = { aQuien: string; desde: string; hasta: string; devuelto?: string };

export type Tanto = {
  numero: 1 | 2 | 3;
  ubicacion: string;
  responsable: string;
  estatus: EstatusTanto;
  prestamo?: Prestamo;
  historialPrestamos: Prestamo[];
};

export type EventoContrato = { fecha: string; titulo: string; actor: string; descripcion?: string };

export type Contrato = {
  id: string;
  folio: string;
  solicitudId?: string;
  tipo: TipoContrato;
  titulo: string;
  contraparte: string;
  objeto: string;
  area: string;
  vigenciaInicio: string; // AAAA-MM-DD
  vigenciaFin: string;
  monto: number;
  periodicidadMonto: "mensual" | "total";
  pdf: string; // el que se muestra (digitalizado si ocr)
  pdfTexto: string; // versión con texto seleccionable
  paginas: number;
  ocr: boolean;
  extraccion: CampoExtraido[];
  custodia: [Tanto, Tanto, Tanto];
  historial: EventoContrato[];
  sello?: { hash: string; fecha: string };
};

export type EstatusVigencia = "vigente" | "por_vencer" | "vencido";

export const NOMBRE_TIPO_CONTRATO: Record<TipoContrato, string> = {
  arrendamiento: "Arrendamiento",
  desarrollo: "Desarrollo",
  servicios: "Prestación de servicios",
  confidencialidad: "Confidencialidad",
};

export const NOMBRE_TIPO_PERSONA: Record<TipoPersona, string> = { fisica: "Persona física", moral: "Persona moral" };

export const ESTATUS_SOLICITUD: StatusMap<EstatusSolicitud> = {
  nueva: { label: "Nueva", tone: "info" },
  en_analisis: { label: "En análisis", tone: "info" },
  en_ajustes: { label: "En ajustes", tone: "warning" },
  en_aprobacion: { label: "En aprobación", tone: "warning" },
  aprobada: { label: "Aprobada", tone: "success" },
  en_firma: { label: "En firma", tone: "info" },
  formalizada: { label: "Formalizada", tone: "success" },
};

export const ESTATUS_VIGENCIA: StatusMap<EstatusVigencia> = {
  vigente: { label: "Vigente", tone: "success" },
  por_vencer: { label: "Por vencer", tone: "warning" },
  vencido: { label: "Vencido", tone: "danger" },
};

export const ESTATUS_TANTO: StatusMap<EstatusTanto> = {
  en_resguardo: { label: "En resguardo", tone: "success" },
  prestado: { label: "Prestado", tone: "warning" },
};

export const PASOS_FIRMA: { id: PasoFirma; etiqueta: string }[] = [
  { id: "enviado", etiqueta: "Documento enviado al proveedor de firma" },
  { id: "firmante_1", etiqueta: "Firmante 1 (representante Norte 19) firmó" },
  { id: "firmante_2", etiqueta: "Firmante 2 (contraparte) firmó" },
  { id: "constancia", etiqueta: "Constancia de conservación generada" },
  { id: "formalizado", etiqueta: "Formalizado" },
];

export const CONFIANZA: StatusMap<Confianza> = {
  alta: { label: "Confianza alta", tone: "success" },
  media: { label: "Confianza media", tone: "warning" },
  baja: { label: "Confianza baja", tone: "danger" },
};
