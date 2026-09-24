// Los 8 contratos formalizados de ejemplo: metadatos compartidos por la app y por
// scripts/contratos/generar-contratos.mts (que genera los PDF, el texto y las extracciones).
// Sin imports: el script corre con Node directamente.
//
// Las fechas están escritas en los PDF, así que son fijas (no relativas a "hoy"). Se eligieron para que,
// durante las sesiones de validación (sep–nov 2026), 2 contratos estén por vencer en menos de 90 días y 1 vencido.

export type TipoContrato = "arrendamiento" | "desarrollo" | "servicios" | "confidencialidad";

export type ContratoCatalogo = {
  id: string;
  folio: string;
  tipo: TipoContrato;
  titulo: string;
  area: string; // área solicitante (id de solicitantes.ts)
  contraparte: string;
  contraparteRfc: string;
  contraparteRepresentante: string;
  contraparteDomicilio: string;
  objeto: string; // resumen corto para el repositorio
  inmueble?: string;
  ciudad: string;
  estado: string;
  fechaFirma: string; // AAAA-MM-DD
  vigenciaInicio: string;
  vigenciaFin: string;
  monto: number;
  periodicidadMonto: "mensual" | "total";
  incremento?: { tipo: "inpc" } | { tipo: "fijo"; porcentaje: number };
  depositoMeses?: number;
  penalizacionMeses?: number;
  fiador?: { nombre: string; domicilio: string; inmuebleGarantia: string };
  jurisdiccion: string;
  ocr: boolean;
};

export const ARRENDATARIA = {
  razonSocial: "NORTE 19 OPERADORA HOTELERA, S.A. DE C.V.",
  rfc: "NOH150820QK3",
  representante: "Lic. Fernando Ibarra Soto",
  domicilio: "Paseo de la Reforma 2693, piso 11, colonia Lomas de Bezares, alcaldía Miguel Hidalgo, C.P. 11910, Ciudad de México",
};

export const CONTRATOS_CATALOGO: ContratoCatalogo[] = [
  {
    id: "arr-gym",
    folio: "CTR-2022-0087",
    tipo: "arrendamiento",
    titulo: "Contrato de arrendamiento · City Express Guaymas",
    area: "desarrollo",
    contraparte: "Inmobiliaria Bahía de San Carlos, S.A. de C.V.",
    contraparteRfc: "IBS060315MX8",
    contraparteRepresentante: "Lic. Ramón Félix Salazar",
    contraparteDomicilio: "Boulevard Manlio Fabio Beltrones 1450, colonia Centro, C.P. 85400, Guaymas, Sonora",
    objeto: "Terreno y local comercial para la operación del hotel City Express Guaymas",
    inmueble: "Boulevard Manlio Fabio Beltrones 1450, colonia Centro, C.P. 85400, Guaymas, Sonora, con superficie de 3,200 m²",
    ciudad: "Guaymas",
    estado: "Sonora",
    fechaFirma: "2022-02-14",
    vigenciaInicio: "2022-03-01",
    vigenciaFin: "2032-02-29",
    monto: 185000,
    periodicidadMonto: "mensual",
    incremento: { tipo: "inpc" },
    depositoMeses: 2,
    penalizacionMeses: 6,
    fiador: {
      nombre: "C. Ramón Félix Salazar",
      domicilio: "Calle Miramar 22, colonia San Carlos, C.P. 85506, Guaymas, Sonora",
      inmuebleGarantia: "casa habitación ubicada en Calle Miramar 22, San Carlos, Guaymas, inscrita en el Registro Público de la Propiedad bajo el folio real 44718",
    },
    jurisdiccion: "Hermosillo, Sonora",
    ocr: false,
  },
  {
    id: "arr-ens",
    folio: "CTR-2021-0152",
    tipo: "arrendamiento",
    titulo: "Contrato de arrendamiento · City Express Ensenada",
    area: "desarrollo",
    contraparte: "Desarrollos Costa Pacífico, S.A. de C.V.",
    contraparteRfc: "DCP090611T45",
    contraparteRepresentante: "Ing. Laura Beltrán Osuna",
    contraparteDomicilio: "Avenida López Mateos 1020, Zona Centro, C.P. 22800, Ensenada, Baja California",
    objeto: "Inmueble para la operación del hotel City Express Ensenada",
    inmueble: "Avenida Reforma 1780, fraccionamiento Bahía, C.P. 22880, Ensenada, Baja California, con superficie de 2,650 m²",
    ciudad: "Ensenada",
    estado: "Baja California",
    fechaFirma: "2021-11-18",
    vigenciaInicio: "2021-12-01",
    vigenciaFin: "2026-11-30",
    monto: 142500,
    periodicidadMonto: "mensual",
    incremento: { tipo: "fijo", porcentaje: 4 },
    depositoMeses: 2,
    fiador: {
      nombre: "C. Laura Beltrán Osuna",
      domicilio: "Calle Del Mar 318, colonia Playa Hermosa, C.P. 22880, Ensenada, Baja California",
      inmuebleGarantia: "departamento ubicado en Calle Del Mar 318, Playa Hermosa, Ensenada, inscrito bajo el folio real 90231",
    },
    jurisdiccion: "Tijuana, Baja California",
    ocr: false,
  },
  {
    id: "arr-alt",
    folio: "CTR-2016-0034",
    tipo: "arrendamiento",
    titulo: "Contrato de arrendamiento · City Express Altamira",
    area: "operaciones",
    contraparte: "Promotora Industrial del Golfo, S.A. de C.V.",
    contraparteRfc: "PIG010402HN7",
    contraparteRepresentante: "C.P. Héctor Villarreal Garza",
    contraparteDomicilio: "Boulevard de los Ríos 300, colonia Industrial, C.P. 89600, Altamira, Tamaulipas",
    objeto: "Terreno en el corredor industrial para el hotel City Express Altamira",
    inmueble: "Carretera Tampico–Mante kilómetro 14.5, Corredor Industrial, C.P. 89603, Altamira, Tamaulipas, con superficie de 4,100 m²",
    ciudad: "Altamira",
    estado: "Tamaulipas",
    fechaFirma: "2016-08-22",
    vigenciaInicio: "2016-09-01",
    vigenciaFin: "2026-08-31",
    monto: 118000,
    periodicidadMonto: "mensual",
    incremento: { tipo: "inpc" },
    depositoMeses: 1,
    penalizacionMeses: 4,
    jurisdiccion: "Tampico, Tamaulipas",
    ocr: true,
  },
  {
    id: "arr-mid",
    folio: "CTR-2019-0211",
    tipo: "arrendamiento",
    titulo: "Contrato de arrendamiento · City Express Mérida",
    area: "desarrollo",
    contraparte: "Grupo Inmobiliario Paseo Montejo, S.A. de C.V.",
    contraparteRfc: "GIP040923LB2",
    contraparteRepresentante: "Arq. José Manuel Cetina Pérez",
    contraparteDomicilio: "Calle 60 número 491, colonia Centro, C.P. 97000, Mérida, Yucatán",
    objeto: "Inmueble sobre Paseo de Montejo para el hotel City Express Mérida",
    inmueble: "Calle 56-A número 451, colonia Centro, C.P. 97000, Mérida, Yucatán, con superficie de 1,980 m²",
    ciudad: "Mérida",
    estado: "Yucatán",
    fechaFirma: "2019-12-02",
    vigenciaInicio: "2019-12-16",
    vigenciaFin: "2026-12-15",
    monto: 131750,
    periodicidadMonto: "mensual",
    incremento: { tipo: "inpc" },
    depositoMeses: 3,
    jurisdiccion: "Mérida, Yucatán",
    ocr: true,
  },
  {
    id: "arr-pue",
    folio: "CTR-2023-0019",
    tipo: "arrendamiento",
    titulo: "Contrato de arrendamiento · City Express Puebla",
    area: "desarrollo",
    contraparte: "Inversiones Angelópolis del Centro, S.A. de C.V.",
    contraparteRfc: "IAC110707PR1",
    contraparteRepresentante: "Lic. Eduardo Méndez Rojas",
    contraparteDomicilio: "Vía Atlixcáyotl 5208, Reserva Territorial Atlixcáyotl, C.P. 72190, San Andrés Cholula, Puebla",
    objeto: "Local y estacionamiento para el hotel City Express Puebla Angelópolis",
    inmueble: "Boulevard del Niño Poblano 2510, Reserva Territorial Atlixcáyotl, C.P. 72197, Puebla, Puebla, con superficie de 2,840 m²",
    ciudad: "Puebla",
    estado: "Puebla",
    fechaFirma: "2023-01-20",
    vigenciaInicio: "2023-02-01",
    vigenciaFin: "2033-01-31",
    monto: 164300,
    periodicidadMonto: "mensual",
    incremento: { tipo: "fijo", porcentaje: 5 },
    depositoMeses: 2,
    penalizacionMeses: 3,
    jurisdiccion: "Puebla, Puebla",
    ocr: false,
  },
  {
    id: "des-qro",
    folio: "CTR-2025-0063",
    tipo: "desarrollo",
    titulo: "Contrato de desarrollo y supervisión de obra · City Express Querétaro Norte",
    area: "desarrollo",
    contraparte: "Constructora Bajío Integral, S.A. de C.V.",
    contraparteRfc: "CBI120418SE9",
    contraparteRepresentante: "Ing. Miguel Ángel Reséndiz Olvera",
    contraparteDomicilio: "Avenida Constituyentes 118 Oriente, colonia Centro, C.P. 76000, Santiago de Querétaro, Querétaro",
    objeto: "Desarrollo, construcción y supervisión del hotel City Express Querétaro Norte (128 habitaciones)",
    inmueble: "Avenida 5 de Febrero 2145, parque industrial Benito Juárez, C.P. 76120, Santiago de Querétaro, Querétaro",
    ciudad: "Santiago de Querétaro",
    estado: "Querétaro",
    fechaFirma: "2025-04-10",
    vigenciaInicio: "2025-05-01",
    vigenciaFin: "2027-04-30",
    monto: 186400000,
    periodicidadMonto: "total",
    penalizacionMeses: undefined,
    jurisdiccion: "Ciudad de México",
    ocr: false,
  },
  {
    id: "srv-ele",
    folio: "CTR-2024-0118",
    tipo: "servicios",
    titulo: "Contrato de prestación de servicios de mantenimiento de elevadores",
    area: "mantenimiento",
    contraparte: "Elevadores y Sistemas Verticales de México, S.A. de C.V.",
    contraparteRfc: "ESV080229KD6",
    contraparteRepresentante: "Ing. Sergio Albarrán Peña",
    contraparteDomicilio: "Calzada de Tlalpan 3016, colonia Santa Úrsula Coapa, alcaldía Coyoacán, C.P. 04650, Ciudad de México",
    objeto: "Mantenimiento preventivo y correctivo de elevadores en 12 hoteles City Express",
    ciudad: "Ciudad de México",
    estado: "Ciudad de México",
    fechaFirma: "2024-06-28",
    vigenciaInicio: "2024-07-01",
    vigenciaFin: "2027-06-30",
    monto: 96800,
    periodicidadMonto: "mensual",
    incremento: { tipo: "inpc" },
    jurisdiccion: "Ciudad de México",
    ocr: false,
  },
  {
    id: "nda-sitios",
    folio: "CTR-2025-0147",
    tipo: "confidencialidad",
    titulo: "Convenio de confidencialidad · evaluación de sitios Bajío y Noreste",
    area: "compras",
    contraparte: "Consultoría Inmobiliaria Meridiano, S.C.",
    contraparteRfc: "CIM170905AA3",
    contraparteRepresentante: "Mtra. Andrea Garza Salinas",
    contraparteDomicilio: "Avenida Ricardo Margáin Zozaya 575, colonia Santa Engracia, C.P. 66267, San Pedro Garza García, Nuevo León",
    objeto: "Confidencialidad sobre la evaluación de sitios para nuevos hoteles en el Bajío y el Noreste",
    ciudad: "Monterrey",
    estado: "Nuevo León",
    fechaFirma: "2025-09-15",
    vigenciaInicio: "2025-09-15",
    vigenciaFin: "2028-09-14",
    monto: 0,
    periodicidadMonto: "total",
    jurisdiccion: "Ciudad de México",
    ocr: false,
  },
];

export function contratoCatalogoPorId(id: string) {
  return CONTRATOS_CATALOGO.find((c) => c.id === id);
}
