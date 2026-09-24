// Los 5 CFDI de ejemplo de la sesión de Recepción. Solo datos y sin imports: los usa también
// scripts/generar-comprobantes-fund.mts. La fecha de emisión es relativa ("días atrás") y el XML se
// construye en el navegador con el reloj de demo (ver lib/sim/fund/ejemplos.ts).

export type ConceptoEjemplo = {
  claveProdServ: string;
  cantidad: number;
  claveUnidad: string;
  unidad: string;
  descripcion: string;
  valorUnitario: number;
};

export type CfdiEjemplo = {
  id: string;
  etiqueta: string; // como aparece en "Usar archivo de ejemplo"
  diasAtras: number;
  hora: string; // hh:mm:ss de emisión
  serie: string;
  folio: string;
  lugarExpedicion: string;
  emisor: { rfc: string; nombre: string; regimenFiscal: string };
  conceptos: ConceptoEjemplo[];
  centroCostosSugerido: string;
  comprobante: "pdf" | "imagen";
};

// Receptor de todos los ejemplos: City Express Cancún Aeropuerto (mismo RFC que en hoteles.ts; lo verifica una prueba).
export const RECEPTOR_CANCUN = {
  rfc: "HCA110315KT4",
  nombre: "HOTELERA CANCUN AEROPUERTO",
  domicilioFiscal: "77565",
  regimenFiscal: "601",
  usoCfdi: "G03",
};

export const CFDI_EJEMPLOS: CfdiEjemplo[] = [
  {
    id: "limpieza-peninsular",
    etiqueta: "Limpieza Peninsular · factura de ayer",
    diasAtras: 1,
    hora: "18:42:10",
    serie: "LP",
    folio: "10482",
    lugarExpedicion: "77500",
    emisor: { rfc: "LPE150612J41", nombre: "LIMPIEZA PENINSULAR", regimenFiscal: "601" },
    conceptos: [
      { claveProdServ: "76111501", cantidad: 1, claveUnidad: "E48", unidad: "Servicio", descripcion: "Servicio de limpieza profunda de áreas comunes", valorUnitario: 2350 },
      { claveProdServ: "47131800", cantidad: 2, claveUnidad: "H87", unidad: "Pieza", descripcion: "Desengrasante industrial 20 L", valorUnitario: 415 },
    ],
    centroCostosSugerido: "limpieza",
    comprobante: "pdf",
  },
  {
    id: "ferreteria-caribe",
    etiqueta: "Ferretería del Caribe · hace 2 días",
    diasAtras: 2,
    hora: "11:05:33",
    serie: "FC",
    folio: "58821",
    lugarExpedicion: "77500",
    emisor: { rfc: "FCA090318QW5", nombre: "FERRETERIA DEL CARIBE", regimenFiscal: "601" },
    conceptos: [
      { claveProdServ: "27111700", cantidad: 1, claveUnidad: "H87", unidad: "Pieza", descripcion: "Juego de herramientas para mantenimiento", valorUnitario: 1284.5 },
      { claveProdServ: "31161500", cantidad: 4, claveUnidad: "H87", unidad: "Pieza", descripcion: "Tornillería y taquetes surtidos", valorUnitario: 89 },
    ],
    centroCostosSugerido: "mantenimiento",
    comprobante: "imagen",
  },
  {
    id: "restaurante-marisol",
    etiqueta: "Restaurante Marisol · factura de hoy",
    diasAtras: 0,
    hora: "13:15:00",
    serie: "RM",
    folio: "3307",
    lugarExpedicion: "77504",
    emisor: { rfc: "RMC180207T63", nombre: "RESTAURANTE MARISOL DEL CARIBE", regimenFiscal: "601" },
    conceptos: [
      { claveProdServ: "90101501", cantidad: 1, claveUnidad: "E48", unidad: "Servicio", descripcion: "Consumo de alimentos para personal de turno", valorUnitario: 1120.69 },
    ],
    centroCostosSugerido: "alimentos",
    comprobante: "imagen",
  },
  {
    // Categoría bloqueada: la clave 78111502 cae en "Aerolíneas". RFC ficticio.
    id: "aeromexico",
    etiqueta: "Aeroméxico · boleto de avión",
    diasAtras: 1,
    hora: "09:20:45",
    serie: "AM",
    folio: "900417",
    lugarExpedicion: "06500",
    emisor: { rfc: "AEM910315KJ2", nombre: "AEROVIAS DE MEXICO", regimenFiscal: "601" },
    conceptos: [
      { claveProdServ: "78111502", cantidad: 1, claveUnidad: "E48", unidad: "Servicio", descripcion: "Boleto de avión CUN-MEX para capacitación", valorUnitario: 4310.34 },
    ],
    centroCostosSugerido: "transporte",
    comprobante: "pdf",
  },
  {
    // Fuera de la ventana de 3 días.
    id: "papeleria-tulum",
    etiqueta: "Papelería Tulum · hace 6 días",
    diasAtras: 6,
    hora: "16:48:02",
    serie: "PT",
    folio: "2219",
    lugarExpedicion: "77780",
    emisor: { rfc: "PTU160923B87", nombre: "PAPELERIA TULUM", regimenFiscal: "601" },
    conceptos: [
      { claveProdServ: "14111500", cantidad: 2, claveUnidad: "H87", unidad: "Caja", descripcion: "Papel bond carta, caja con 10 paquetes", valorUnitario: 489 },
      { claveProdServ: "44121600", cantidad: 1, claveUnidad: "H87", unidad: "Pieza", descripcion: "Artículos de escritorio surtidos", valorUnitario: 214.5 },
    ],
    centroCostosSugerido: "papeleria",
    comprobante: "pdf",
  },
];
