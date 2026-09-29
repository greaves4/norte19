"use client";

import { INICIO_DESARROLLO, PERFILES_DESARROLLO } from "@/components/desarrollo/DesarrolloShell";
import { GuiaPrototipo } from "@/components/shared/GuiaPrototipo";
import { GUIA_DESARROLLO } from "@/lib/fixtures/desarrollo/ayuda";

export function AyudaDesarrollo() {
  return <GuiaPrototipo nombre="Desarrollo hotelero" subtitulo="Proyecto ejecutivo y auditoría" guia={GUIA_DESARROLLO} perfiles={PERFILES_DESARROLLO} inicio={INICIO_DESARROLLO} selector="/desarrollo" />;
}
