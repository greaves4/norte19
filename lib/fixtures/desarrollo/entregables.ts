// Los 13 entregables del estándar con sus pesos (suman 100) y la calificación inicial del semáforo.
import type { Entregable } from "@/lib/types/desarrollo";

export function crearEntregables(): Entregable[] {
  return [
    { id: "cuadro_areas", nombre: "Cuadro de áreas", peso: 15, semaforo: "ambar" },
    { id: "marca", nombre: "Validación de marca", peso: 10, semaforo: "ambar" },
    { id: "decisiones", nombre: "Decisiones de diseño", peso: 10, semaforo: "rojo" },
    { id: "riesgos", nombre: "Mapa de riesgos", peso: 5, semaforo: "rojo" },
    { id: "capex", nombre: "CAPEX", peso: 10, semaforo: "rojo" },
    { id: "arquitectura", nombre: "Arquitectura", peso: 10, semaforo: "rojo" },
    { id: "coordinacion", nombre: "Coordinación", peso: 10, semaforo: "rojo" },
    { id: "estructura", nombre: "Estructura", peso: 5, semaforo: "rojo" },
    { id: "electrico", nombre: "Eléctrico", peso: 5, semaforo: "rojo" },
    { id: "hidrosanitario", nombre: "Hidrosanitario", peso: 5, semaforo: "rojo" },
    { id: "pci_hvac", nombre: "PCI y HVAC", peso: 5, semaforo: "rojo" },
    { id: "interiores", nombre: "Interiores", peso: 5, semaforo: "rojo" },
    { id: "catalogos", nombre: "Catálogos", peso: 5, semaforo: "rojo" },
  ];
}
