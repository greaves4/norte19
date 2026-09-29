"use client";

import { INICIO_PERFIL, PERFILES_FUND } from "@/components/fund/FundShell";
import { GuiaPrototipo } from "@/components/shared/GuiaPrototipo";
import { GUIA_FUND } from "@/lib/fixtures/fund/ayuda";

export function AyudaFund() {
  return <GuiaPrototipo nombre="Fund" subtitulo="Caja chica hotelera" guia={GUIA_FUND} perfiles={PERFILES_FUND} inicio={INICIO_PERFIL} selector="/fund" />;
}
