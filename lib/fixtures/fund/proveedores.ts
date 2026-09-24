// Proveedores ficticios (razón social y RFC con formato válido) para generar movimientos.
// Los comprobantes de cada proveedor viven en public/fixtures/fund/comprobantes/<slug>.{xml,pdf,jpg} (se generan en F2).

export type PlantillaConcepto = { descripcion: string; claveProdServ: string; min: number; max: number };

export type Proveedor = {
  slug: string;
  nombre: string;
  rfc: string;
  centroCostos: string;
  conceptos: PlantillaConcepto[];
};

export const PROVEEDORES: Proveedor[] = [
  {
    slug: "limpieza-peninsular",
    nombre: "Limpieza Peninsular, S.A. de C.V.",
    rfc: "LPE150612J41",
    centroCostos: "limpieza",
    conceptos: [
      { descripcion: "Servicio de limpieza profunda de áreas comunes", claveProdServ: "76111501", min: 1200, max: 3800 },
      { descripcion: "Desengrasante industrial 20 L", claveProdServ: "47131800", min: 380, max: 950 },
    ],
  },
  {
    slug: "ferreteria-caribe",
    nombre: "Ferretería del Caribe, S.A. de C.V.",
    rfc: "FCA090318QW5",
    centroCostos: "mantenimiento",
    conceptos: [
      { descripcion: "Juego de herramientas para mantenimiento", claveProdServ: "27111700", min: 450, max: 2200 },
      { descripcion: "Tornillería y taquetes surtidos", claveProdServ: "31161500", min: 120, max: 480 },
      { descripcion: "Pintura vinílica blanca 19 L", claveProdServ: "31211500", min: 900, max: 1900 },
    ],
  },
  {
    slug: "restaurante-marisol",
    nombre: "Restaurante Marisol del Caribe, S.A. de C.V.",
    rfc: "RMC180207T63",
    centroCostos: "alimentos",
    conceptos: [{ descripcion: "Consumo de alimentos para personal de turno", claveProdServ: "90101501", min: 350, max: 1600 }],
  },
  {
    slug: "papeleria-tulum",
    nombre: "Papelería Tulum, S. de R.L. de C.V.",
    rfc: "PTU160923B87",
    centroCostos: "papeleria",
    conceptos: [
      { descripcion: "Papel bond carta, caja con 10 paquetes", claveProdServ: "14111500", min: 650, max: 1100 },
      { descripcion: "Artículos de escritorio surtidos", claveProdServ: "44121600", min: 120, max: 600 },
    ],
  },
  {
    slug: "gas-sureste",
    nombre: "Gas del Sureste Peninsular, S.A. de C.V.",
    rfc: "GSP050711HB2",
    centroCostos: "servicios",
    conceptos: [{ descripcion: "Gas LP para calentadores, 300 L", claveProdServ: "15111510", min: 2400, max: 4800 }],
  },
  {
    slug: "lavanderia-industrial",
    nombre: "Lavandería Industrial Hotelera, S.A. de C.V.",
    rfc: "LIH120530K19",
    centroCostos: "limpieza",
    conceptos: [{ descripcion: "Lavado de blancos por kilo", claveProdServ: "91111502", min: 900, max: 3200 }],
  },
  {
    slug: "clima-golfo",
    nombre: "Clima y Refrigeración del Golfo, S.A. de C.V.",
    rfc: "CRG110225LA6",
    centroCostos: "mantenimiento",
    conceptos: [
      { descripcion: "Mantenimiento preventivo a minisplit", claveProdServ: "72151200", min: 850, max: 2600 },
      { descripcion: "Carga de gas refrigerante R410A", claveProdServ: "40101700", min: 600, max: 1400 },
    ],
  },
  {
    slug: "comercializadora-oficina",
    nombre: "Comercializadora de Oficina del Norte, S.A. de C.V.",
    rfc: "CON100814PX3",
    centroCostos: "papeleria",
    conceptos: [
      { descripcion: "Tóner para impresora láser", claveProdServ: "44103100", min: 900, max: 2100 },
      { descripcion: "Carpetas y archiveros", claveProdServ: "44121600", min: 150, max: 700 },
    ],
  },
  {
    slug: "abarrotes-mayoreo",
    nombre: "Abarrotes y Mayoreo La Central, S.A. de C.V.",
    rfc: "AMC080402RT7",
    centroCostos: "alimentos",
    conceptos: [
      { descripcion: "Café, azúcar y crema para desayuno continental", claveProdServ: "50192100", min: 700, max: 2300 },
      { descripcion: "Fruta de temporada", claveProdServ: "50221200", min: 300, max: 900 },
    ],
  },
  {
    slug: "materiales-construccion",
    nombre: "Materiales y Acabados del Pacífico, S.A. de C.V.",
    rfc: "MAP130916DS4",
    centroCostos: "mantenimiento",
    conceptos: [{ descripcion: "Cemento y adhesivo para loseta", claveProdServ: "30111600", min: 500, max: 1800 }],
  },
  {
    slug: "farmacia-sanitas",
    nombre: "Farmacia Sanitas, S.A. de C.V.",
    rfc: "FSA140120MN8",
    centroCostos: "servicios",
    conceptos: [
      { descripcion: "Reposición de botiquín de primeros auxilios", claveProdServ: "42311500", min: 250, max: 900 },
      { descripcion: "Analgésicos para botiquín", claveProdServ: "51101500", min: 90, max: 320 },
    ],
  },
  {
    slug: "taxis-ejecutivos",
    nombre: "Taxis Ejecutivos del Aeropuerto, S.A. de C.V.",
    rfc: "TEA170605GC9",
    centroCostos: "transporte",
    conceptos: [{ descripcion: "Traslado de huésped por incidencia", claveProdServ: "78111804", min: 280, max: 850 }],
  },
  {
    slug: "amenidades-hoteleras",
    nombre: "Amenidades Hoteleras de México, S.A. de C.V.",
    rfc: "AHM110304VK2",
    centroCostos: "amenidades",
    conceptos: [
      { descripcion: "Shampoo y jabón en presentación hotelera", claveProdServ: "53131600", min: 800, max: 2600 },
      { descripcion: "Kit dental y de rasurado", claveProdServ: "53131500", min: 300, max: 900 },
    ],
  },
  {
    slug: "fumigaciones-profesionales",
    nombre: "Fumigaciones Profesionales del Centro, S.A. de C.V.",
    rfc: "FPC090827WE1",
    centroCostos: "servicios",
    conceptos: [{ descripcion: "Servicio mensual de control de plagas", claveProdServ: "72102100", min: 1100, max: 2400 }],
  },
  {
    slug: "mensajeria-express",
    nombre: "Mensajería Express Regional, S.A. de C.V.",
    rfc: "MER150430FA5",
    centroCostos: "servicios",
    conceptos: [{ descripcion: "Envío de documentos a corporativo", claveProdServ: "78102203", min: 150, max: 450 }],
  },
  {
    slug: "blancos-hoteleros",
    nombre: "Blancos Hoteleros del Bajío, S.A. de C.V.",
    rfc: "BHB120911PL4",
    centroCostos: "amenidades",
    conceptos: [{ descripcion: "Toallas de baño 100% algodón", claveProdServ: "52121500", min: 900, max: 3000 }],
  },
];

// Proveedores con categoría bloqueada: solo aparecen en solicitudes de excepción.
export const PROVEEDORES_BLOQUEADOS: Proveedor[] = [
  {
    slug: "aerolinea-regional",
    nombre: "Aerovías Regionales del Norte, S.A. de C.V.",
    rfc: "ARN100617BX2",
    centroCostos: "transporte",
    conceptos: [{ descripcion: "Boleto de avión para gerente (capacitación en corporativo)", claveProdServ: "78111502", min: 2800, max: 5200 }],
  },
  {
    slug: "servicios-financieros",
    nombre: "Servicios Financieros Integrales, S.A. de C.V.",
    rfc: "SFI080229TR6",
    centroCostos: "servicios",
    conceptos: [{ descripcion: "Comisión por envío de efectivo", claveProdServ: "84121500", min: 180, max: 480 }],
  },
];

export function proveedorPorSlug(slug: string) {
  return [...PROVEEDORES, ...PROVEEDORES_BLOQUEADOS].find((p) => p.slug === slug);
}
