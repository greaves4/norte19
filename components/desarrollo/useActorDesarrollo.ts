"use client";

import { useDemo } from "@/lib/demo";
import { USUARIOS_DESARROLLO } from "@/lib/fixtures/desarrollo";
import type { PerfilDesarrollo } from "@/lib/types/desarrollo";

// Perfil y usuario simulado en sesión (el nombre queda como actor en la bitácora).
export function useActorDesarrollo() {
  const { profile } = useDemo();
  const perfil: PerfilDesarrollo = profile === "revisor" || profile === "proyectista" ? profile : "direccion";
  const usuario = USUARIOS_DESARROLLO[perfil];
  return { perfil, usuario, actor: usuario.nombre };
}
