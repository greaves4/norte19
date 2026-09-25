// Cuadro de áreas contra el benchmark del corpus: promedio y rango de m² por llave por zona de los 5 hoteles,
// desviación % y semáforo (±8% verde, ±15% ámbar, más: rojo).
import { CORPUS } from "@/lib/fixtures/desarrollo";
import type { Fuente, HotelCorpus, Semaforo, ZonaId, ZonaProyecto } from "@/lib/types/desarrollo";

export const UMBRAL_VERDE = 0.08;
export const UMBRAL_AMBAR = 0.15;

export type FilaBenchmark = {
  zona: ZonaId;
  m2: number;
  m2Original: number;
  m2PorLlave: number;
  porcentaje: number | null; // % del construido (el estacionamiento es exterior: null)
  promedio: number;
  minimo: number;
  maximo: number;
  desviacion: number; // fracción: 0.1 = +10%
  semaforo: Semaforo;
  fuentes: Fuente[];
  fuentesBenchmark: Fuente[];
};

export function semaforoDesviacion(d: number): Semaforo {
  const a = Math.abs(d);
  return a <= UMBRAL_VERDE ? "verde" : a <= UMBRAL_AMBAR ? "ambar" : "rojo";
}

export function benchmarkZona(zona: ZonaId, corpus: HotelCorpus[] = CORPUS) {
  const vals = corpus.map((h) => h.cuadroAreas.find((z) => z.zona === zona)!);
  const xs = vals.map((z) => z.m2PorLlave);
  return {
    promedio: xs.reduce((a, b) => a + b, 0) / xs.length,
    minimo: Math.min(...xs),
    maximo: Math.max(...xs),
    fuentes: vals.flatMap((z) => z.fuentes),
  };
}

export function compararCuadro(cuadro: ZonaProyecto[], llaves: number, corpus: HotelCorpus[] = CORPUS): FilaBenchmark[] {
  const construido = cuadro.filter((z) => z.zona !== "estacionamiento").reduce((t, z) => t + z.m2, 0);
  return cuadro.map((z) => {
    const b = benchmarkZona(z.zona, corpus);
    const m2PorLlave = z.m2 / llaves;
    const desviacion = m2PorLlave / b.promedio - 1;
    return {
      zona: z.zona,
      m2: z.m2,
      m2Original: z.m2Original,
      m2PorLlave,
      porcentaje: z.zona === "estacionamiento" ? null : z.m2 / construido,
      promedio: b.promedio,
      minimo: b.minimo,
      maximo: b.maximo,
      desviacion,
      semaforo: semaforoDesviacion(desviacion),
      fuentes: z.fuentes,
      fuentesBenchmark: b.fuentes,
    };
  });
}

export function m2Construidos(cuadro: Pick<ZonaProyecto, "zona" | "m2">[]) {
  return cuadro.filter((z) => z.zona !== "estacionamiento").reduce((t, z) => t + z.m2, 0);
}
