"use client";

import { INICIO_CONTRATOS, PERFILES_CONTRATOS } from "@/components/contratos/ContratosShell";
import { GuiaPrototipo } from "@/components/shared/GuiaPrototipo";
import { GUIA_CONTRATOS } from "@/lib/fixtures/contratos/ayuda";

export function AyudaContratos() {
  return <GuiaPrototipo nombre="Contratos" subtitulo="Gestión de contratos con IA" guia={GUIA_CONTRATOS} perfiles={PERFILES_CONTRATOS} inicio={INICIO_CONTRATOS} selector="/contratos" />;
}
