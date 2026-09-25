import type { Abogado, PerfilContratos, Solicitante, UsuarioContratos } from "@/lib/types/contratos";

// Orden = criterio de desempate en la asignación automática.
export const ABOGADOS: Abogado[] = [
  { id: "ab-robles", nombre: "Lic. Mariana Robles", especialidad: "Inmobiliario y arrendamiento" },
  { id: "ab-salgado", nombre: "Lic. Eduardo Salgado", especialidad: "Construcción y desarrollo" },
  { id: "ab-nieto", nombre: "Lic. Patricia Nieto", especialidad: "Corporativo y proveedores" },
];

export const SOLICITANTES: Solicitante[] = [
  { id: "desarrollo", area: "Desarrollo", nombre: "Ing. Alejandro Ríos Maldonado", puesto: "Gerente de Desarrollo Inmobiliario" },
  { id: "operaciones", area: "Operaciones", nombre: "Lic. Karina Treviño Salas", puesto: "Gerente de Operaciones Hoteleras" },
  { id: "compras", area: "Compras", nombre: "Lic. Omar Castañeda Ruiz", puesto: "Jefe de Compras Corporativas" },
  { id: "mantenimiento", area: "Mantenimiento", nombre: "Ing. Rubén Salcedo Ortiz", puesto: "Coordinador de Mantenimiento" },
];

// Usuario simulado por perfil (en producción viene de Active Directory).
export const USUARIOS_CONTRATOS: Record<PerfilContratos, UsuarioContratos> = {
  solicitante: { perfil: "solicitante", id: "desarrollo", nombre: "Ing. Alejandro Ríos Maldonado", puesto: "Desarrollo" },
  // La abogada de la demo es la de menor carga inicial: la solicitud que crea el Solicitante en el guion le llega a ella.
  abogado: { perfil: "abogado", id: "ab-nieto", nombre: "Lic. Patricia Nieto", puesto: "Legal" },
  directivo: { perfil: "directivo", id: "dir-villasenor", nombre: "Lic. Andrés Villaseñor", puesto: "Director Jurídico" },
  admin: { perfil: "admin", id: "adm-arriaga", nombre: "Lic. Sofía Arriaga", puesto: "Gerente Legal" },
};

export function abogadoPorId(id: string) {
  return ABOGADOS.find((a) => a.id === id);
}

export function solicitantePorId(id: string) {
  return SOLICITANTES.find((s) => s.id === id);
}
