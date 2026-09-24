import type { CuentaFondeadora, Hotel, UsuarioDemo } from "@/lib/types/fund";

export const HOTEL_DEMO_ID = "ce-cun-apt";

// 20 propiedades City Express. RFC y razón social son ficticios con formato válido de persona moral.
export const HOTELES: Hotel[] = [
  { id: "ce-cun-apt", nombre: "City Express Cancún Aeropuerto", ciudad: "Cancún", estado: "Quintana Roo", rfc: "HCA110315KT4", razonSocial: "Hotelera Cancún Aeropuerto, S.A. de C.V.", recepcion: "Mariana Cruz Pech", supervisor: "Ricardo Salas Uc" },
  { id: "ce-tij-flo", nombre: "City Express Tijuana El Florido", ciudad: "Tijuana", estado: "Baja California", rfc: "HTF120827B91", razonSocial: "Hotelera Tijuana Florido, S.A. de C.V.", recepcion: "Karla Ibarra León", supervisor: "Óscar Valenzuela Ruiz" },
  { id: "ce-gym", nombre: "City Express Guaymas", ciudad: "Guaymas", estado: "Sonora", rfc: "HGU130204QF2", razonSocial: "Hotelera Guaymas, S.A. de C.V.", recepcion: "Luis Moreno Aguilar", supervisor: "Patricia Félix Soto" },
  { id: "ce-ens", nombre: "City Express Ensenada", ciudad: "Ensenada", estado: "Baja California", rfc: "HEN120619MR7", razonSocial: "Hotelera Ensenada Costa, S.A. de C.V.", recepcion: "Daniela Ochoa Paz", supervisor: "Javier Castro Meza" },
  { id: "ce-alt", nombre: "City Express Altamira", ciudad: "Altamira", estado: "Tamaulipas", rfc: "HAL140922LS5", razonSocial: "Hotelera Altamira Puerto, S.A. de C.V.", recepcion: "Rosa Treviño Garza", supervisor: "Héctor Villarreal Ríos" },
  { id: "ce-mty-uni", nombre: "City Express Monterrey Universidad", ciudad: "Monterrey", estado: "Nuevo León", rfc: "HMU100408HX3", razonSocial: "Hotelera Monterrey Universidad, S.A. de C.V.", recepcion: "Andrea Garza Salinas", supervisor: "Rodrigo Cantú Elizondo" },
  { id: "ce-cjs", nombre: "City Express Ciudad Juárez", ciudad: "Ciudad Juárez", estado: "Chihuahua", rfc: "HCJ111130NC8", razonSocial: "Hotelera Juárez Norte, S.A. de C.V.", recepcion: "Brenda Holguín Vega", supervisor: "Arturo Chavira Loya" },
  { id: "ce-qro", nombre: "City Express Querétaro", ciudad: "Querétaro", estado: "Querétaro", rfc: "HQR090714GA6", razonSocial: "Hotelera Querétaro Centro Sur, S.A. de C.V.", recepcion: "Fernanda Olvera Ruiz", supervisor: "Miguel Ángel Reséndiz" },
  { id: "ce-mid", nombre: "City Express Mérida", ciudad: "Mérida", estado: "Yucatán", rfc: "HME100222PD1", razonSocial: "Hotelera Mérida Paseo, S.A. de C.V.", recepcion: "Wendy Canché Poot", supervisor: "José Manuel Cetina" },
  { id: "ce-pue", nombre: "City Express Puebla", ciudad: "Puebla", estado: "Puebla", rfc: "HPU081105VE4", razonSocial: "Hotelera Puebla Angelópolis, S.A. de C.V.", recepcion: "Itzel Ramírez Cortés", supervisor: "Eduardo Méndez Rojas" },
  { id: "ce-tlc", nombre: "City Express Toluca", ciudad: "Toluca", estado: "Estado de México", rfc: "HTO090317JB2", razonSocial: "Hotelera Toluca Aeropuerto, S.A. de C.V.", recepcion: "Gabriela Nava Díaz", supervisor: "Sergio Albarrán Peña" },
  { id: "ce-leo", nombre: "City Express León", ciudad: "León", estado: "Guanajuato", rfc: "HLE080929RK5", razonSocial: "Hotelera León Poliforum, S.A. de C.V.", recepcion: "Paola Muñoz Ortega", supervisor: "Alejandro Torres Lara" },
  { id: "ce-chi", nombre: "City Express Chihuahua", ciudad: "Chihuahua", estado: "Chihuahua", rfc: "HCH100611TW9", razonSocial: "Hotelera Chihuahua Norte, S.A. de C.V.", recepcion: "Mónica Terrazas Gil", supervisor: "Ramón Quintana Baeza" },
  { id: "ce-hmo", nombre: "City Express Hermosillo", ciudad: "Hermosillo", estado: "Sonora", rfc: "HHE091020CU3", razonSocial: "Hotelera Hermosillo Pitic, S.A. de C.V.", recepcion: "Alejandra Encinas Félix", supervisor: "Francisco Durazo Leyva" },
  { id: "ce-cul", nombre: "City Express Culiacán", ciudad: "Culiacán", estado: "Sinaloa", rfc: "HCU110525FP7", razonSocial: "Hotelera Culiacán Tres Ríos, S.A. de C.V.", recepcion: "Karen Zazueta Beltrán", supervisor: "Iván Gastélum Osuna" },
  { id: "ce-ver", nombre: "City Express Veracruz", ciudad: "Veracruz", estado: "Veracruz", rfc: "HVE100803SN2", razonSocial: "Hotelera Veracruz Boca, S.A. de C.V.", recepcion: "Lucía Hernández Aguirre", supervisor: "Rafael Domínguez Cruz" },
  { id: "ce-vsa", nombre: "City Express Villahermosa", ciudad: "Villahermosa", estado: "Tabasco", rfc: "HVI110119DM6", razonSocial: "Hotelera Villahermosa Tabasco 2000, S.A. de C.V.", recepcion: "Diana Priego Sastré", supervisor: "Gerardo Mayo Jiménez" },
  { id: "ce-tam", nombre: "City Express Tampico", ciudad: "Tampico", estado: "Tamaulipas", rfc: "HTA120312WA8", razonSocial: "Hotelera Tampico Madero, S.A. de C.V.", recepcion: "Silvia Castañeda Rocha", supervisor: "Jorge Olvera Zapata" },
  { id: "ce-slw", nombre: "City Express Saltillo", ciudad: "Saltillo", estado: "Coahuila", rfc: "HSA090928ZT1", razonSocial: "Hotelera Saltillo Sur, S.A. de C.V.", recepcion: "Claudia Aguirre Flores", supervisor: "Luis Fernando Dávila" },
  { id: "ce-ags", nombre: "City Express Aguascalientes", ciudad: "Aguascalientes", estado: "Aguascalientes", rfc: "HAG081217YB4", razonSocial: "Hotelera Aguascalientes Centro, S.A. de C.V.", recepcion: "Verónica Macías Esparza", supervisor: "Ernesto Romo Delgado" },
];

export const CUENTAS_FONDEADORAS: CuentaFondeadora[] = [
  { id: "cf-bbva-01", banco: "BBVA", alias: "Concentradora Norte 19 · Norte", clabeUltimosCuatro: "4412" },
  { id: "cf-bbva-02", banco: "BBVA", alias: "Concentradora Norte 19 · Sur", clabeUltimosCuatro: "7730" },
  { id: "cf-banorte-01", banco: "Banorte", alias: "Operación hoteles Bajío", clabeUltimosCuatro: "1908" },
];

// Usuario simulado por perfil (en producción viene de Active Directory).
export const USUARIOS_DEMO: Record<UsuarioDemo["perfil"], UsuarioDemo> = {
  hotel: { perfil: "hotel", nombre: "Mariana Cruz Pech", puesto: "Recepción", hotelId: HOTEL_DEMO_ID },
  supervisor: { perfil: "supervisor", nombre: "Ricardo Salas Uc", puesto: "Gerente de hotel", hotelId: HOTEL_DEMO_ID },
  tesoreria: { perfil: "tesoreria", nombre: "Viviana Torres", puesto: "Tesorería corporativa", hotelId: null },
};

export function hotelPorId(id: string) {
  return HOTELES.find((h) => h.id === id);
}
