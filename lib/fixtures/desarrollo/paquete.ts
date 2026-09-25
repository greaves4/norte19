// Paquete ejecutivo de ejemplo de Juárez: 60 archivos con la nomenclatura del cliente. Omite a propósito la memoria
// de cálculo estructural (MEM-ES) y el cuadro de cargas eléctrico (IE-002), e incluye 3 archivos sin clave
// identificable. Sin alias: el script genera un PDF de una página por archivo en public/fixtures/desarrollo/paquete/.
export const PAQUETE_EJEMPLO: string[] = [
  // Arquitectura
  "100-AQ-101 Planta baja",
  "100-AQ-102 Planta nivel 2",
  "100-AQ-103 Planta nivel 3",
  "100-AQ-104 Planta nivel 4",
  "100-AQ-105 Planta nivel 5",
  "100-AQ-106 Planta de azotea",
  "110-AQ-111 Fachada norte",
  "110-AQ-112 Fachada sur",
  "110-AQ-113 Fachadas oriente y poniente",
  "120-AQ-121 Corte longitudinal",
  "120-AQ-122 Corte transversal",
  "130-AQ-131 Detalles de fachada",
  "130-AQ-134 Detalle de pretil",
  "150-AQ-151 Núcleo de elevadores",
  "150-AQ-152 Escaleras de emergencia",
  "160-AQ-161 Plafones planta baja",
  "170-AQ-171 Habitación tipo",
  "170-AQ-172 Baño tipo",
  "200-AL-201 Muros planta baja",
  "200-AL-202 Muros planta tipo",
  "300-ACW-301 Acabados planta baja",
  "300-ACW-302 Acabados planta tipo",
  "700-AH-701 Cancelería de fachada",
  "750-AN-751 Señalética",
  "PA-01 Paisajismo",
  "BIM-JRZ Exportación del modelo coordinado",
  // Estructura (sin MEM-ES)
  "ES-101 Planta de cimentación",
  "ES-102 Detalles de zapatas",
  "ES-111 Losa nivel 2 con cuantías",
  "ES-112 Losa nivel 3 con cuantías",
  "ES-113 Losas niveles 4 y 5 con cuantías",
  "ES-114 Losa de azotea",
  "ES-201 Armado de columnas",
  "ES-202 Armado de trabes",
  // Eléctrico (sin IE-002)
  "IE-001 Diagrama unifilar",
  "IE-101 Alumbrado planta baja",
  "IE-102 Alumbrado planta tipo",
  "IE-301 Subestación y planta de emergencia",
  "IE-401 Tierras y pararrayos",
  "MEM-IE Memoria eléctrica",
  // Hidrosanitario y gas
  "IH-001 Isométrico de agua fría y caliente",
  "IH-101 Hidráulica planta tipo",
  "IH-102 Sanitaria planta tipo",
  "IH-301 Cisterna y cuarto de máquinas",
  "IH-401 Instalación de gas",
  "MEM-IH Memoria hidrosanitaria",
  // PCI
  "PCI-101 Rociadores planta tipo",
  "PCI-201 Detección y alarma",
  "PCI-301 Cuarto de bombas",
  "MEM-PCI Memoria de protección contra incendio",
  // HVAC
  "HV-101 Aire acondicionado planta tipo",
  "HV-201 Extracciones",
  "HV-301 Equipos en azotea",
  "MEM-HV Memoria de aire acondicionado",
  // Interiores
  "DI-101 Layout de habitación king",
  "DI-201 Fichas de acabados",
  "DI-301 Lista de FF&E",
  // Sin clave identificable
  "Escaneo_0045",
  "plano final v3 (copia)",
  "Documento sin título",
];

export const archivoPaquete = (nombre: string) => `${nombre}.pdf`;
