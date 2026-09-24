// 24 solicitudes en distintos estatus, con fechas relativas a "hoy" para que el SLA quede en verde, ámbar y una en rojo.
// Carga activa inicial (nueva / en análisis / en ajustes): Robles 4, Salgado 6, Nieto 3.
import { CONTRATOS_CATALOGO } from "@/lib/fixtures/contratos/catalogo";
import { DOCUMENTOS_EJEMPLO, FORMULARIOS } from "@/lib/fixtures/contratos/formularios";
import { abogadoPorId, solicitantePorId, USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos/personas";
import { restarDiasHabiles, slaPorTipo, sumarDiasHabiles } from "@/lib/sim/contratos/sla";
import type {
  Documento,
  EstatusSolicitud,
  EventoSolicitud,
  PasoFirma,
  Solicitud,
  TipoContrato,
  TipoPersona,
} from "@/lib/types/contratos";

type Plan = {
  persona: TipoPersona;
  tipo: TipoContrato;
  solicitante: string;
  abogado: string;
  estatus: EstatusSolicitud;
  // Días hábiles desde la creación (define el semáforo del SLA de análisis).
  transcurridos: number;
  campos: Record<string, string | number>;
  faltan?: string[]; // documentos sin cargar
  motivo?: string;
  pasosFirma?: PasoFirma[];
  contratoId?: string;
  analisis?: boolean;
};

const DIRECTIVO = USUARIOS_CONTRATOS.directivo.nombre;
const ADMIN = USUARIOS_CONTRATOS.admin.nombre;

const PLANES: Plan[] = [
  // --- Lic. Mariana Robles (carga activa 4)
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-robles", estatus: "nueva", transcurridos: 0.3,
    campos: { razonSocial: "Inmobiliaria Cumbres de León, S.A. de C.V.", rfc: "ICL140522BN4", representanteLegal: "Lic. Gustavo Aranda Pérez", poderNotarial: "Escritura 48,215 del 12/05/2022, Notaría 7 de León", domicilioFiscal: "Blvd. Adolfo López Mateos 2710, León, Gto.", inmueble: "Blvd. Aeropuerto 1155, León, Gto.", superficie: 2400, rentaMensual: 128000, vigenciaMeses: 120, fechaInicio: "2027-01-01", deposito: "2 meses", incrementoAnual: "INPC" },
  },
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "desarrollo", abogado: "ab-robles", estatus: "en_ajustes", transcurridos: 2.4,
    campos: { razonSocial: "Terrenos del Bajío Norte, S.A. de C.V.", rfc: "TBN180903KL1", representanteLegal: "Ing. Rosa María Oropeza", poderNotarial: "", domicilioFiscal: "Av. Universidad 450, Aguascalientes, Ags.", inmueble: "Carretera a Zacatecas km 5, Aguascalientes, Ags.", superficie: 3100, rentaMensual: 99500, vigenciaMeses: 120, fechaInicio: "2027-03-01", deposito: "2 meses", incrementoAnual: "Fijo 4%" },
    faltan: ["poderNotarial"],
    motivo: "Falta el poder notarial vigente del representante legal. Por favor adjúntalo y captura número de escritura, fecha y notaría.",
  },
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-robles", estatus: "en_analisis", transcurridos: 3.85,
    campos: { razonSocial: "Desarrolladora Laguna del Carmen, S.A. de C.V.", rfc: "DLC100215HT6", representanteLegal: "Lic. Jorge Luis Canul", poderNotarial: "Escritura 9,811 del 03/02/2020, Notaría 12 de Campeche", domicilioFiscal: "Calle 31 núm. 88, Ciudad del Carmen, Camp.", inmueble: "Av. Periférica Norte 300, Ciudad del Carmen, Camp.", superficie: 2050, rentaMensual: 112000, vigenciaMeses: 96, fechaInicio: "2026-12-01", deposito: "2 meses", incrementoAnual: "INPC" },
    analisis: true,
  },
  {
    persona: "moral", tipo: "confidencialidad", solicitante: "compras", abogado: "ab-robles", estatus: "en_analisis", transcurridos: 1.0,
    campos: { razonSocial: "Analítica Hotelera STR México, S.C.", rfc: "AHS190604PQ2", representanteLegal: "Mtro. Daniel Fuentes Ibarra", poderNotarial: "Escritura 3,410 del 18/06/2019, Notaría 45 de la CDMX", domicilioFiscal: "Av. Insurgentes Sur 1602, CDMX", proposito: "Intercambio de datos de ocupación y tarifa para benchmarking", vigenciaAnios: "2 años", penaConvencional: 1000000 },
  },
  // --- Lic. Eduardo Salgado (carga activa 6)
  {
    persona: "moral", tipo: "desarrollo", solicitante: "operaciones", abogado: "ab-salgado", estatus: "nueva", transcurridos: 0.5,
    campos: { razonSocial: "Edificaciones Occidente Integral, S.A. de C.V.", rfc: "EOI150710RT3", representanteLegal: "Ing. Hugo Villalobos", poderNotarial: "Escritura 22,190 del 10/07/2015, Notaría 5 de Guadalajara", domicilioFiscal: "Av. Vallarta 5500, Zapopan, Jal.", proyecto: "Remodelación de lobby y 40 habitaciones, City Express Guadalajara Expo", ubicacion: "Av. Mariano Otero 1350, Guadalajara, Jal.", montoTotal: 18750000, plazoMeses: 6, fechaInicio: "2027-01-15", anticipo: "30%", garantias: "Fianzas de anticipo y cumplimiento" },
  },
  {
    persona: "moral", tipo: "desarrollo", solicitante: "desarrollo", abogado: "ab-salgado", estatus: "en_analisis", transcurridos: 5.4,
    campos: { razonSocial: "Constructora Sierra Madre del Norte, S.A. de C.V.", rfc: "CSM110330AB5", representanteLegal: "Ing. Arturo Chavira Loya", poderNotarial: "Escritura 17,002 del 30/03/2021, Notaría 8 de Chihuahua", domicilioFiscal: "Periférico de la Juventud 3100, Chihuahua, Chih.", proyecto: "Construcción de City Express Chihuahua Norte, 110 habitaciones", ubicacion: "Av. Tecnológico 8900, Chihuahua, Chih.", montoTotal: 162000000, plazoMeses: 18, fechaInicio: "2027-02-01", anticipo: "30%", garantias: "Fianzas de anticipo y cumplimiento" },
    analisis: true,
  },
  {
    persona: "fisica", tipo: "desarrollo", solicitante: "operaciones", abogado: "ab-salgado", estatus: "en_analisis", transcurridos: 2.0,
    campos: { nombre: "Arq. Fernanda Olvera Ruiz", rfc: "OERF850412AB3", curp: "OERF850412MQTLZR07", identificacion: "INE", domicilio: "Calle Hidalgo 45, Santiago de Querétaro, Qro.", proyecto: "Proyecto de imagen de fachada para 6 hoteles", ubicacion: "Varios estados", montoTotal: 1450000, plazoMeses: 4, fechaInicio: "2026-11-15", cedulaProfesional: "8812345" },
  },
  {
    persona: "fisica", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-salgado", estatus: "en_analisis", transcurridos: 5.35,
    campos: { nombre: "C. Ernesto Romo Delgado", rfc: "RODE700815JK2", curp: "RODE700815HASMLR03", identificacion: "INE", domicilio: "Calle Madero 212, Aguascalientes, Ags.", inmueble: "Local para bodega de blancos, Av. Convención 1914, Aguascalientes, Ags.", rentaMensual: 32000, vigenciaMeses: 36, fechaInicio: "2026-11-01", aval: "C. Verónica Macías Esparza" },
    analisis: true,
  },
  {
    persona: "moral", tipo: "servicios", solicitante: "mantenimiento", abogado: "ab-salgado", estatus: "nueva", transcurridos: 1.1,
    campos: { razonSocial: "Subestaciones y Energía del Centro, S.A. de C.V.", rfc: "SEC090918GH7", representanteLegal: "Ing. Paola Muñoz Ortega", poderNotarial: "Escritura 30,455 del 18/09/2019, Notaría 2 de Querétaro", domicilioFiscal: "Av. 5 de Febrero 1500, Querétaro, Qro.", servicio: "Mantenimiento preventivo de subestaciones eléctricas", hoteles: 18, contraprestacionMensual: 74500, vigenciaMeses: 24, fechaInicio: "2026-12-01", nivelServicio: "Crítico (respuesta 4 h)" },
  },
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-salgado", estatus: "en_analisis", transcurridos: 3.2,
    campos: { razonSocial: "Inversiones Pacífico Sur, S.A. de C.V.", rfc: "IPS130617UV8", representanteLegal: "Lic. Iván Gastélum Osuna", poderNotarial: "Escritura 11,309 del 17/06/2013, Notaría 101 de Culiacán", domicilioFiscal: "Blvd. Pedro Infante 2300, Culiacán, Sin.", inmueble: "Blvd. Francisco I. Madero 1100, Mazatlán, Sin.", superficie: 2200, rentaMensual: 121000, vigenciaMeses: 120, fechaInicio: "2027-02-01", deposito: "2 meses", incrementoAnual: "Fijo 5%" },
  },
  // --- Lic. Patricia Nieto (carga activa 3)
  {
    persona: "moral", tipo: "confidencialidad", solicitante: "compras", abogado: "ab-nieto", estatus: "nueva", transcurridos: 0.2,
    campos: { razonSocial: "Tecnologías de Reservación Quetzal, S.A.P.I. de C.V.", rfc: "TRQ200110MN5", representanteLegal: "Ing. Luis Fernando Dávila", poderNotarial: "Escritura 8,720 del 10/01/2020, Notaría 60 de Monterrey", domicilioFiscal: "Av. Constitución 400, Monterrey, N.L.", proposito: "Evaluación de motor de reservaciones y channel manager", vigenciaAnios: "3 años", penaConvencional: 1500000 },
  },
  {
    persona: "moral", tipo: "servicios", solicitante: "compras", abogado: "ab-nieto", estatus: "en_analisis", transcurridos: 2.0,
    campos: { razonSocial: "Blancos y Lavandería Industrial del Norte, S.A. de C.V.", rfc: "BLI080505ZX4", representanteLegal: "C.P. Silvia Castañeda Rocha", poderNotarial: "Escritura 14,556 del 05/05/2018, Notaría 30 de Monterrey", domicilioFiscal: "Av. Ruiz Cortines 1200, Guadalupe, N.L.", servicio: "Lavandería industrial de blancos", hoteles: 9, contraprestacionMensual: 188000, vigenciaMeses: 24, fechaInicio: "2026-11-01", nivelServicio: "Estándar (respuesta 24 h)" },
  },
  {
    persona: "fisica", tipo: "servicios", solicitante: "mantenimiento", abogado: "ab-nieto", estatus: "nueva", transcurridos: 0.8,
    campos: { nombre: "Ing. Javier Castro Meza", rfc: "CAMJ780920QW1", curp: "CAMJ780920HBCSZV05", identificacion: "INE", domicilio: "Calle Segunda 845, Ensenada, B.C.", servicio: "Dictámenes de seguridad estructural", contraprestacionMensual: 28000, vigenciaMeses: 12, fechaInicio: "2026-11-01" },
  },
  // --- En aprobación (4)
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-robles", estatus: "en_aprobacion", transcurridos: 4.5,
    campos: { razonSocial: "Plazas Comerciales del Sureste, S.A. de C.V.", rfc: "PCS070221DE3", representanteLegal: "Lic. Wendy Canché Poot", poderNotarial: "Escritura 6,102 del 21/02/2017, Notaría 40 de Mérida", domicilioFiscal: "Calle 20 núm. 100, Mérida, Yuc.", inmueble: "Periférico Norte km 4.5, Mérida, Yuc.", superficie: 1850, rentaMensual: 104000, vigenciaMeses: 120, fechaInicio: "2027-01-01", deposito: "3 meses", incrementoAnual: "INPC" },
    analisis: true,
  },
  {
    persona: "moral", tipo: "desarrollo", solicitante: "operaciones", abogado: "ab-salgado", estatus: "en_aprobacion", transcurridos: 7.0,
    campos: { razonSocial: "Grupo Constructor Huasteco, S.A. de C.V.", rfc: "GCH060808LK9", representanteLegal: "Ing. Jorge Olvera Zapata", poderNotarial: "Escritura 19,870 del 08/08/2016, Notaría 25 de Tampico", domicilioFiscal: "Av. Hidalgo 5000, Tampico, Tamps.", proyecto: "Ampliación de 30 habitaciones, City Express Tampico", ubicacion: "Av. Ejército Mexicano 1200, Tampico, Tamps.", montoTotal: 41200000, plazoMeses: 9, fechaInicio: "2027-01-10", anticipo: "20%", garantias: "Fianzas de anticipo y cumplimiento" },
    analisis: true,
  },
  {
    persona: "moral", tipo: "servicios", solicitante: "mantenimiento", abogado: "ab-nieto", estatus: "en_aprobacion", transcurridos: 4.0,
    campos: { razonSocial: "Fumigaciones Profesionales del Centro, S.A. de C.V.", rfc: "FPC090827WE1", representanteLegal: "Lic. Alejandra Encinas Félix", poderNotarial: "Escritura 5,540 del 27/08/2019, Notaría 14 de la CDMX", domicilioFiscal: "Av. Tláhuac 4400, CDMX", servicio: "Control integral de plagas", hoteles: 25, contraprestacionMensual: 63500, vigenciaMeses: 24, fechaInicio: "2026-12-01", nivelServicio: "Estándar (respuesta 24 h)" },
    analisis: true,
  },
  {
    persona: "moral", tipo: "confidencialidad", solicitante: "compras", abogado: "ab-robles", estatus: "en_aprobacion", transcurridos: 2.5,
    campos: { razonSocial: "Asesores en Adquisiciones Hoteleras, S.C.", rfc: "AAH160401RS2", representanteLegal: "Lic. Rodrigo Cantú Elizondo", poderNotarial: "Escritura 2,210 del 01/04/2016, Notaría 9 de San Pedro Garza García", domicilioFiscal: "Av. Vasconcelos 150, San Pedro Garza García, N.L.", proposito: "Análisis de posible adquisición de un portafolio de hoteles", vigenciaAnios: "3 años", penaConvencional: 5000000 },
    analisis: true,
  },
  // --- Aprobadas (2)
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-salgado", estatus: "aprobada", transcurridos: 6.0,
    campos: { razonSocial: "Inmuebles del Valle de Toluca, S.A. de C.V.", rfc: "IVT120905PL3", representanteLegal: "Lic. Sergio Albarrán Peña", poderNotarial: "Escritura 25,601 del 05/09/2012, Notaría 3 de Toluca", domicilioFiscal: "Paseo Tollocan 1000, Toluca, Edo. Méx.", inmueble: "Blvd. Aeropuerto 500, Toluca, Edo. Méx.", superficie: 2600, rentaMensual: 118500, vigenciaMeses: 120, fechaInicio: "2026-12-01", deposito: "2 meses", incrementoAnual: "INPC" },
    analisis: true,
  },
  {
    persona: "moral", tipo: "servicios", solicitante: "mantenimiento", abogado: "ab-nieto", estatus: "aprobada", transcurridos: 5.0,
    campos: { razonSocial: "Climatización Integral del Norte, S.A. de C.V.", rfc: "CIN100312FG6", representanteLegal: "Ing. Francisco Durazo Leyva", poderNotarial: "Escritura 13,003 del 12/03/2010, Notaría 18 de Hermosillo", domicilioFiscal: "Blvd. Kino 900, Hermosillo, Son.", servicio: "Mantenimiento de equipos de aire acondicionado", hoteles: 11, contraprestacionMensual: 92000, vigenciaMeses: 36, fechaInicio: "2026-11-15", nivelServicio: "Crítico (respuesta 4 h)" },
    analisis: true,
  },
  // --- En firma (2)
  {
    persona: "moral", tipo: "arrendamiento", solicitante: "operaciones", abogado: "ab-robles", estatus: "en_firma", transcurridos: 8.0,
    campos: { razonSocial: "Patrimonial Tres Ríos, S.A. de C.V.", rfc: "PTR090611CU7", representanteLegal: "Lic. Karen Zazueta Beltrán", poderNotarial: "Escritura 7,340 del 11/06/2009, Notaría 55 de Culiacán", domicilioFiscal: "Blvd. Enrique Sánchez Alonso 1500, Culiacán, Sin.", inmueble: "Blvd. Pedro Infante 2800, Culiacán, Sin.", superficie: 2300, rentaMensual: 109000, vigenciaMeses: 120, fechaInicio: "2026-11-01", deposito: "2 meses", incrementoAnual: "Fijo 4%" },
    analisis: true,
    pasosFirma: ["enviado", "firmante_1"],
  },
  {
    persona: "moral", tipo: "confidencialidad", solicitante: "compras", abogado: "ab-nieto", estatus: "en_firma", transcurridos: 3.0,
    campos: { razonSocial: "Estudios de Mercado Turístico Aurora, S.C.", rfc: "EMT180220AB1", representanteLegal: "Mtra. Itzel Ramírez Cortés", poderNotarial: "Escritura 1,905 del 20/02/2018, Notaría 88 de Puebla", domicilioFiscal: "Av. Juárez 2915, Puebla, Pue.", proposito: "Estudio de demanda para nuevos destinos de playa", vigenciaAnios: "2 años", penaConvencional: 800000 },
    analisis: true,
    pasosFirma: ["enviado"],
  },
  // --- Formalizadas (3), ligadas a contratos del repositorio
  { persona: "moral", tipo: "desarrollo", solicitante: "desarrollo", abogado: "ab-salgado", estatus: "formalizada", transcurridos: 0, campos: {}, contratoId: "des-qro", analisis: true },
  { persona: "moral", tipo: "confidencialidad", solicitante: "compras", abogado: "ab-nieto", estatus: "formalizada", transcurridos: 0, campos: {}, contratoId: "nda-sitios", analisis: true },
  { persona: "moral", tipo: "servicios", solicitante: "mantenimiento", abogado: "ab-nieto", estatus: "formalizada", transcurridos: 0, campos: {}, contratoId: "srv-ele", analisis: true },
];

const moneda = (n: unknown) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(n) || 0);

// Análisis del abogado con la plantilla de secciones; varía por tipo y por solicitud para que el directivo lea casos distintos.
function analisisDe(tipo: TipoContrato, c: Record<string, string | number>, i: number): string {
  const par = i % 2 === 0;
  const secciones: Record<TipoContrato, [string, string, string, string]> = {
    arrendamiento: [
      `Arrendamiento de ${c.inmueble ?? "inmueble para hotel"}${c.superficie ? ` (${Number(c.superficie).toLocaleString("es-MX")} m²)` : ""} por ${c.vigenciaMeses ?? 120} meses; renta mensual de ${moneda(c.rentaMensual)} más IVA.`,
      par
        ? `Incremento anual ${c.incrementoAnual ?? "INPC"} sin tope. El certificado de libertad de gravamen tiene más de 90 días.`
        : `Depósito de ${c.deposito ?? "2 meses"}, arriba de la práctica del grupo. El uso de suelo no menciona expresamente hotel.`,
      par ? "Tope al incremento (INPC con máximo 5%); periodo de gracia de 6 meses para adecuaciones; derecho de preferencia en venta." : "Depósito de 1 mes; constancia de uso de suelo compatible como condición suspensiva; terminación anticipada sin penalidad en los primeros 24 meses.",
      par ? "Procede, negociando el tope del incremento antes de firmar." : "Procede sujeto a la constancia de uso de suelo.",
    ],
    desarrollo: [
      `${c.proyecto ?? "Obra"} a precio alzado por ${moneda(c.montoTotal)} más IVA; plazo de ${c.plazoMeses ?? 12} meses.`,
      `Anticipo de ${c.anticipo ?? "30%"}; la fianza propuesta no cubre el 100% del anticipo. El programa de obra no fija penas por atraso.`,
      "Fianza de anticipo por el 100%; penas por atraso de 0.5% semanal con tope de 10%; retención de 5% como fondo de garantía.",
      "Procede con las garantías completas y el programa de obra como anexo.",
    ],
    servicios: [
      `${c.servicio ?? "Servicio"} para ${c.hoteles ?? "los"} hoteles; contraprestación mensual de ${moneda(c.contraprestacionMensual)} más IVA.`,
      "Registro REPSE por verificar en el portal de la STPS; responsabilidad solidaria laboral.",
      "Penalizaciones por incumplir el nivel de servicio; terminación anticipada con 30 días de aviso; seguro de responsabilidad civil.",
      par ? "Procede." : "Procede una vez validado el REPSE.",
    ],
    confidencialidad: [
      `Acuerdo de confidencialidad para ${String(c.proposito ?? "intercambio de información").toLowerCase()}; vigencia de ${c.vigenciaAnios ?? "2 años"}.`,
      "La definición de información confidencial es muy amplia y no excluye requerimientos de autoridad.",
      "Excepciones estándar (información pública, requerimiento de autoridad); devolución o destrucción al terminar.",
      "Procede con el formato del grupo.",
    ],
  };
  const [objeto, riesgos, clausulas, recomendacion] = secciones[tipo];
  return `Objeto: ${objeto}\nRiesgos identificados: ${riesgos}\nCláusulas a negociar: ${clausulas}\nRecomendación: ${recomendacion}`;
}

// Datos de solicitud equivalentes a un contrato del catálogo (solicitudes formalizadas y renovaciones).
export function camposDeContrato(contratoId: string): Record<string, string | number> {
  const c = CONTRATOS_CATALOGO.find((x) => x.id === contratoId)!;
  const base = { razonSocial: c.contraparte, rfc: c.contraparteRfc, representanteLegal: c.contraparteRepresentante, poderNotarial: "Escritura vigente acreditada", domicilioFiscal: c.contraparteDomicilio };
  if (c.tipo === "arrendamiento") {
    const superficie = Number(c.inmueble?.match(/superficie de ([\d,]+) m²/)?.[1]?.replace(/,/g, "") ?? 0);
    return {
      ...base,
      inmueble: (c.inmueble ?? c.objeto).replace(/, con superficie de [\d,]+ m²$/, ""),
      ...(superficie ? { superficie } : {}),
      rentaMensual: c.monto,
      vigenciaMeses: 120,
      fechaInicio: c.vigenciaInicio,
      deposito: `${c.depositoMeses ?? 2} meses`,
      incrementoAnual: c.incremento?.tipo === "fijo" ? `Fijo ${c.incremento.porcentaje}%` : "INPC",
    };
  }
  if (c.tipo === "desarrollo") return { ...base, proyecto: c.objeto, ubicacion: c.inmueble ?? c.ciudad, montoTotal: c.monto, plazoMeses: 24, fechaInicio: c.vigenciaInicio, anticipo: "30%", garantias: "Fianzas de anticipo y cumplimiento" };
  if (c.tipo === "servicios") return { ...base, servicio: c.objeto, hoteles: 12, contraprestacionMensual: c.monto, vigenciaMeses: 36, fechaInicio: c.vigenciaInicio, nivelServicio: "Crítico (respuesta 4 h)" };
  return { ...base, proposito: c.objeto, vigenciaAnios: "3 años", penaConvencional: 2500000 };
}

export function contraparteDe(campos: Record<string, string | number>) {
  return String(campos.razonSocial ?? campos.nombre ?? "Sin contraparte");
}

function expediente(persona: TipoPersona, tipo: TipoContrato, faltan: string[] = []): Documento[] {
  const def = FORMULARIOS.find((f) => f.tipoPersona === persona && f.tipoContrato === tipo)!;
  return def.documentos
    .filter((d) => !faltan.includes(d.clave))
    .map((d) => ({ clave: d.clave, etiqueta: d.etiqueta, nombre: `${d.clave}.pdf`, src: `/fixtures/contratos/expediente/${d.clave}.pdf`, tipo: "pdf" as const, tamano: 48_000 }))
    .filter((d) => d.clave in DOCUMENTOS_EJEMPLO);
}

const horas = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000);

export function crearSolicitudes(hoy: Date): Solicitud[] {
  return PLANES.map((plan, i) => {
    const contrato = plan.contratoId ? CONTRATOS_CATALOGO.find((c) => c.id === plan.contratoId) : undefined;
    const sla = slaPorTipo(plan.tipo);
    // Formalizadas: fechas históricas previas a la firma del contrato; activas: relativas a hoy.
    const creada = contrato ? restarDiasHabiles(new Date(`${contrato.fechaFirma}T10:00:00`), sla + 8) : restarDiasHabiles(hoy, plan.transcurridos);
    const campos = contrato ? camposDeContrato(contrato.id) : plan.campos;
    const solicitante = solicitantePorId(plan.solicitante)!;
    const abogado = abogadoPorId(plan.abogado)!;

    const orden: EstatusSolicitud[] = ["nueva", "en_analisis", "en_aprobacion", "aprobada", "en_firma", "formalizada"];
    const hasta = plan.estatus === "en_ajustes" ? 1 : orden.indexOf(plan.estatus);
    const etapas: Solicitud["etapas"] = { nueva: creada.toISOString() };
    const timeline: EventoSolicitud[] = [
      { fecha: creada.toISOString(), tipo: "creada", titulo: "Solicitud creada", actor: solicitante.nombre },
      { fecha: horas(creada, 0.02).toISOString(), tipo: "asignada", titulo: `Asignada a ${abogado.nombre}`, actor: "Asignación automática", descripcion: `SLA de análisis: ${sla} días hábiles.` },
    ];
    // Fechas de etapas repartidas entre la creación y hoy (o la firma del contrato).
    const fin = contrato ? new Date(`${contrato.fechaFirma}T13:00:00`) : hoy;
    const tramo = (fin.getTime() - creada.getTime()) / Math.max(hasta + 1, 2);
    const enEtapa = (n: number) => new Date(creada.getTime() + tramo * n);

    if (hasta >= 1) {
      etapas.en_analisis = enEtapa(0.4).toISOString();
      timeline.push({ fecha: etapas.en_analisis, tipo: "en_analisis", titulo: "En análisis", actor: abogado.nombre });
    }
    if (plan.estatus === "en_ajustes") {
      const regreso = enEtapa(0.9).toISOString();
      etapas.en_ajustes = regreso;
      timeline.push({ fecha: regreso, tipo: "regresada", titulo: "Regresada al solicitante para ajustes", actor: abogado.nombre, descripcion: plan.motivo });
    }
    if (hasta >= 2) {
      etapas.en_aprobacion = enEtapa(1.2).toISOString();
      timeline.push({ fecha: etapas.en_aprobacion, tipo: "enviada_aprobacion", titulo: "Enviada a aprobación", actor: abogado.nombre });
    }
    if (hasta >= 3) {
      etapas.aprobada = enEtapa(2).toISOString();
      timeline.push({ fecha: etapas.aprobada, tipo: "aprobada", titulo: "Aprobada", actor: DIRECTIVO });
    }
    const firma: Solicitud["firma"] = hasta >= 4 ? { pasos: {} } : undefined;
    if (hasta >= 4) {
      etapas.en_firma = enEtapa(2.6).toISOString();
      timeline.push({ fecha: etapas.en_firma, tipo: "enviada_firma", titulo: "Enviada a firma electrónica", actor: ADMIN });
      const pasos: PasoFirma[] = plan.estatus === "formalizada" ? ["enviado", "firmante_1", "firmante_2", "constancia", "formalizado"] : plan.pasosFirma ?? [];
      pasos.forEach((p, n) => {
        const fecha = horas(new Date(etapas.en_firma!), 0.3 + n * 5).toISOString();
        firma!.pasos[p] = fecha;
      });
    }
    if (hasta >= 5) {
      etapas.formalizada = fin.toISOString();
      timeline.push({ fecha: etapas.formalizada, tipo: "formalizada", titulo: "Formalizado", actor: "Firma electrónica", descripcion: `Contrato ${contrato?.folio} en el repositorio.` });
    }

    const numero = 101 + i;
    return {
      id: `sol-${String(numero).padStart(4, "0")}`,
      folio: `SOL-${creada.getFullYear()}-${String(numero).padStart(4, "0")}`,
      tipoPersona: plan.persona,
      tipoContrato: plan.tipo,
      campos,
      expediente: expediente(plan.persona, plan.tipo, plan.faltan),
      solicitanteId: plan.solicitante,
      abogadoId: plan.abogado,
      estatus: plan.estatus,
      slaDiasHabiles: sla,
      creadaEn: creada.toISOString(),
      timeline: timeline.sort((a, b) => a.fecha.localeCompare(b.fecha)),
      analisis: plan.analisis ? analisisDe(plan.tipo, campos, i) : undefined,
      versionesAnalisis: plan.analisis ? [{ fecha: etapas.en_analisis ?? creada.toISOString(), autor: abogado.nombre, texto: analisisDe(plan.tipo, campos, i) }] : [],
      motivoRechazo: plan.motivo,
      etapas,
      firma,
      contratoId: plan.contratoId,
    };
  });
}

// Fecha límite del SLA de análisis (para mostrarla en la tarjeta).
export function venceSla(s: Pick<Solicitud, "creadaEn" | "slaDiasHabiles">) {
  return sumarDiasHabiles(new Date(s.creadaEn), s.slaDiasHabiles);
}
