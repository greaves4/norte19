import type { CentroCostos } from "@/lib/types/fund";

export const CENTROS_COSTOS: CentroCostos[] = [
  { id: "mantenimiento", nombre: "Mantenimiento" },
  { id: "limpieza", nombre: "Limpieza" },
  { id: "alimentos", nombre: "Alimentos y bebidas" },
  { id: "papeleria", nombre: "Papelería" },
  { id: "transporte", nombre: "Transporte" },
  { id: "servicios", nombre: "Servicios" },
  { id: "amenidades", nombre: "Amenidades" },
];

export function nombreCentroCostos(id: string) {
  return CENTROS_COSTOS.find((c) => c.id === id)?.nombre ?? id;
}
