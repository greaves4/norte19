// Custodia física de los tres tantos originales: resumen y préstamos vencidos respecto del reloj de demo.
import type { Contrato, Tanto } from "@/lib/types/contratos";

export function prestamoVencido(t: Pick<Tanto, "estatus" | "prestamo">, now: Date): boolean {
  return t.estatus === "prestado" && !!t.prestamo && new Date(t.prestamo.hasta) < now;
}

export function resumenCustodia(c: Pick<Contrato, "custodia">): string {
  const prestados = c.custodia.filter((t) => t.estatus === "prestado").length;
  return prestados ? `${3 - prestados} de 3 en resguardo · ${prestados} prestado` : "3 de 3 en resguardo";
}

export type FilaCustodia = { contrato: Contrato; tanto: Tanto };

export function filasCustodia(contratos: Contrato[]): FilaCustodia[] {
  return contratos.flatMap((contrato) => contrato.custodia.map((tanto) => ({ contrato, tanto })));
}

export function prestamosVencidos(contratos: Contrato[], now: Date): FilaCustodia[] {
  return filasCustodia(contratos).filter((f) => prestamoVencido(f.tanto, now));
}
