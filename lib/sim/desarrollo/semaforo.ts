// Semáforo de los 13 entregables: avance = Σ(peso × valor), con verde 1, ámbar 0.5 y rojo 0. Condición de entrega:
// todos los entregables con peso ≥ 10% en verde y avance ≥ 95%.
import type { Entregable, Semaforo } from "@/lib/types/desarrollo";

export const VALOR_SEMAFORO: Record<Semaforo, number> = { verde: 1, ambar: 0.5, rojo: 0 };

export function calcularAvance(entregables: Pick<Entregable, "peso" | "semaforo">[]): number {
  const total = entregables.reduce((t, e) => t + e.peso, 0);
  return total ? entregables.reduce((t, e) => t + e.peso * VALOR_SEMAFORO[e.semaforo], 0) / total : 0;
}

export function condicionEntrega(entregables: Pick<Entregable, "peso" | "semaforo" | "nombre">[]) {
  const avance = calcularAvance(entregables);
  const pendientes = entregables.filter((e) => e.peso >= 10 && e.semaforo !== "verde");
  return { cumple: avance >= 0.95 && pendientes.length === 0, avance, pendientes };
}
