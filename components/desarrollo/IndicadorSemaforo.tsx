import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Semaforo } from "@/lib/types/desarrollo";

// TODO tokens: verde, ámbar y rojo del semáforo; hoy la variante del Badge más un ícono distinto por estado.
const ICONO = { verde: CircleCheck, ambar: TriangleAlert, rojo: OctagonAlert } as const;
const VARIANTE = { verde: "secondary", ambar: "outline", rojo: "destructive" } as const;
const TEXTO = { verde: "Verde", ambar: "Ámbar", rojo: "Rojo" } as const;

export function IndicadorSemaforo({ valor, etiqueta }: { valor: Semaforo; etiqueta?: string }) {
  const Icono = ICONO[valor];
  return (
    <Badge variant={VARIANTE[valor]} data-semaforo={valor} className="whitespace-nowrap">
      <Icono data-icon="inline-start" aria-hidden />
      {etiqueta ?? TEXTO[valor]}
    </Badge>
  );
}
