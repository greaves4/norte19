// Tipos del prototipo Fund (caja chica hotelera). Las fechas se guardan como ISO string para persistir en localStorage.
import type { StatusMap } from "@/components/shared/StatusBadge";

export type PerfilFund = "hotel" | "supervisor" | "tesoreria";

export type UsuarioDemo = { perfil: PerfilFund; nombre: string; puesto: string; hotelId: string | null };

export type Corte = "semanal" | "quincenal" | "mensual";

export type Hotel = {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  rfc: string;
  razonSocial: string;
  recepcion: string; // nombre de quien registra
  supervisor: string; // gerente del hotel
};

export type CuentaFondeadora = {
  id: string;
  banco: string;
  alias: string;
  clabeUltimosCuatro: string;
};

export type EstatusTarjeta = "activa" | "bloqueada";

// El PAN nunca existe en el prototipo: solo token y últimos cuatro (RNF01).
export type Tarjeta = {
  id: string;
  hotelId: string;
  token: string;
  ultimosCuatro: string;
  cuentaFondeadoraId: string;
  presupuesto: number;
  saldo: number;
  corte: Corte;
  estatus: EstatusTarjeta;
  categoriasBloqueadas: string[]; // ids de Categoria
  ultimoFondeo: string | null;
};

export type CentroCostos = { id: string; nombre: string };

// Categoría de comercio tipo MCC con las claves producto/servicio SAT que la identifican.
export type Categoria = {
  id: string;
  nombre: string;
  mcc: string;
  clavesProdServ: string[];
  bloqueadaPorDefecto: boolean;
};

export type ConceptoCfdi = { descripcion: string; claveProdServ: string; importe: number };

export type Comprobante = { tipo: "xml" | "pdf" | "imagen"; nombre: string; src: string };

export type EstatusMovimiento = "registrado" | "pendiente" | "aprobado" | "rechazado" | "autorizado";

export type TipoEvento =
  | "registrado"
  | "enviado"
  | "aprobado"
  | "rechazado"
  | "autorizado"
  | "autorizacion_solicitada"
  | "excepcion_solicitada"
  | "excepcion_aprobada"
  | "excepcion_rechazada";

export type EventoMovimiento = {
  fecha: string;
  tipo: TipoEvento;
  titulo: string;
  actor: string;
  descripcion?: string;
};

export type ExcepcionSolicitada = {
  categoriaId: string;
  estatus: "pendiente" | "aprobada" | "rechazada";
  fecha: string;
};

export type Movimiento = {
  id: string;
  hotelId: string;
  tarjetaId: string;
  fecha: string; // registro en Fund
  fechaEmisionCfdi: string;
  proveedor: string; // razón social del emisor
  rfcEmisor: string;
  rfcReceptor: string;
  uuid: string;
  conceptos: ConceptoCfdi[];
  subtotal: number;
  iva: number;
  total: number;
  centroCostos: string; // id de CentroCostos
  notas: string;
  comprobantes: Comprobante[];
  estatus: EstatusMovimiento;
  timeline: EventoMovimiento[];
  extemporaneo: boolean;
  excepcionSolicitada: ExcepcionSolicitada | null;
  registradoPor: string;
  motivoRechazo?: string;
  motivoAutorizacion?: string;
  // Referencia del cargo en el estado de cuenta; null mientras Pay Connect no lo vincula.
  referenciaBancaria: string | null;
};

export type TipoFondeo = "manual" | "automatico" | "carga_masiva";
export type EstatusFondeo = "enviado" | "aceptado" | "depositado" | "fallido";

export type Fondeo = {
  id: string;
  tarjetaId: string;
  fecha: string;
  monto: number;
  tipo: TipoFondeo;
  estatus: EstatusFondeo;
  referencia: string;
  actor: string;
};

export type MovimientoBancario = {
  id: string;
  tarjetaId: string;
  fecha: string;
  referencia: string;
  concepto: string;
  tipo: "cargo" | "abono";
  monto: number;
};

export type EstadoConciliacion = {
  ultimaSincronizacion: string | null;
  sincronizaciones: number;
};

// Datos para crear un movimiento desde el formulario del hotel.
export type NuevoMovimiento = Pick<
  Movimiento,
  | "hotelId"
  | "tarjetaId"
  | "fechaEmisionCfdi"
  | "proveedor"
  | "rfcEmisor"
  | "rfcReceptor"
  | "uuid"
  | "conceptos"
  | "subtotal"
  | "iva"
  | "total"
  | "centroCostos"
  | "notas"
  | "comprobantes"
> & { extemporaneo?: boolean };

export type FilaCargaMasiva = { hotel?: string; ultimosCuatro: string; monto: number; referencia: string };

export type ResultadoCargaMasiva = {
  aplicadas: { fila: number; tarjetaId: string; monto: number }[];
  errores: { fila: number; motivo: string }[];
};

export const ESTATUS_MOVIMIENTO: StatusMap<EstatusMovimiento> = {
  registrado: { label: "Registrado", tone: "neutral" },
  pendiente: { label: "Pendiente de aprobación", tone: "info" },
  aprobado: { label: "Aprobado", tone: "success" },
  rechazado: { label: "Rechazado", tone: "danger" },
  autorizado: { label: "Autorizado", tone: "warning" },
};

export const ESTATUS_TARJETA: StatusMap<EstatusTarjeta> = {
  activa: { label: "Activa", tone: "success" },
  bloqueada: { label: "Bloqueada", tone: "danger" },
};

export const ESTATUS_FONDEO: StatusMap<EstatusFondeo> = {
  enviado: { label: "Enviado", tone: "info" },
  aceptado: { label: "Aceptado", tone: "info" },
  depositado: { label: "Depositado", tone: "success" },
  fallido: { label: "Fallido", tone: "danger" },
};

export const NOMBRE_CORTE: Record<Corte, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export const DIAS_CORTE: Record<Corte, number> = { semanal: 7, quincenal: 15, mensual: 30 };
