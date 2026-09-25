// Cuadro de áreas del anteproyecto de Juárez, expresado contra el promedio del corpus para que las desviaciones del
// guion sean estables: áreas públicas −20% (la mayor), BOH +10% y estacionamiento +12% (ámbar).
// Sin alias: lo usa el script que dibuja el anteproyecto de ejemplo.
import type { ZonaId } from "../../types/desarrollo.ts";
import { CORPUS } from "./corpus/index.ts";

export const LLAVES_JUAREZ = 128;
export const NIVELES_JUAREZ = 5;
export const ZONAS_ANTEPROYECTO: ZonaId[] = ["habitaciones", "areas_publicas", "boh", "circulaciones", "estacionamiento"];

const FACTOR_ANTEPROYECTO: Record<ZonaId, number> = {
  habitaciones: 1.03,
  areas_publicas: 0.8,
  boh: 1.1,
  circulaciones: 0.97,
  estacionamiento: 1.12,
};

export function promedioCorpus(zona: ZonaId) {
  return CORPUS.reduce((t, h) => t + h.cuadroAreas.find((z) => z.zona === zona)!.m2PorLlave, 0) / CORPUS.length;
}

export function cuadroAnteproyecto(): { zona: ZonaId; m2: number }[] {
  return ZONAS_ANTEPROYECTO.map((zona) => ({ zona, m2: Math.round(promedioCorpus(zona) * FACTOR_ANTEPROYECTO[zona] * LLAVES_JUAREZ) }));
}

// CAPEX objetivo aprobado por el comité (lo trae el PDF de ejemplo del input complementario).
export const CAPEX_OBJETIVO_USD_POR_LLAVE = 46_000;
