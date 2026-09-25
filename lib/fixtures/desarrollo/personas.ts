// Usuario simulado por perfil (en producción viene del usuario de red).
import type { PerfilDesarrollo } from "@/lib/types/desarrollo";

export const USUARIOS_DESARROLLO: Record<PerfilDesarrollo, { perfil: PerfilDesarrollo; nombre: string; puesto: string }> = {
  direccion: { perfil: "direccion", nombre: "Arq. Lorena Esquivel", puesto: "Directora de Desarrollo" },
  revisor: { perfil: "revisor", nombre: "Ing. Héctor Garza Villarreal", puesto: "Revisor experto · Estructuras e instalaciones" },
  proyectista: { perfil: "proyectista", nombre: "Arq. Daniel Ortiz", puesto: "Despacho Ortiz Arquitectos" },
};
