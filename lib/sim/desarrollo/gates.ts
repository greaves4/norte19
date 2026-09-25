// Gate de inputs del estándar: obligatorio ausente → nivel 1 (proceso detenido, con reporte de insuficiencia);
// complementario ausente → nivel 2 (supuesto documentado y entregables afectados en ámbar); si no, libre.
import type { EntregableId, InputProyecto } from "@/lib/types/desarrollo";

export type ResultadoGate = {
  nivel: 1 | 2 | "libre";
  faltantes: { input: InputProyecto; impacto: string }[];
  supuestos: { input: InputProyecto; impacto: string; entregables: EntregableId[] }[];
};

export function evaluarInputs(inputs: InputProyecto[]): ResultadoGate {
  const faltantes = inputs.filter((i) => i.obligatorio && !i.archivo).map((input) => ({ input, impacto: input.impacto }));
  const supuestos = inputs.filter((i) => !i.obligatorio && !i.archivo).map((input) => ({ input, impacto: input.impacto, entregables: input.afecta }));
  return { nivel: faltantes.length ? 1 : supuestos.length ? 2 : "libre", faltantes, supuestos };
}

// Entregables que quedan en ámbar por supuestos (se muestran así mientras falte el complementario).
export function entregablesConSupuesto(inputs: InputProyecto[]): Set<EntregableId> {
  return new Set(evaluarInputs(inputs).supuestos.flatMap((s) => s.entregables));
}
