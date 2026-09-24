"use client";

import { useDemo } from "@/lib/demo";
import { USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos";
import type { PerfilContratos } from "@/lib/types/contratos";

// Perfil y usuario simulado en sesión (el nombre queda como actor en los eventos).
export function useActorContratos() {
  const { profile } = useDemo();
  const perfil = (profile ?? "abogado") as PerfilContratos;
  const usuario = USUARIOS_CONTRATOS[perfil] ?? USUARIOS_CONTRATOS.abogado;
  return { perfil, usuario, actor: usuario.nombre };
}
