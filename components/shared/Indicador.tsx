import { Card, CardContent } from "@/components/ui/card";

// Tarjeta de indicador: etiqueta, valor grande y nota opcional.
export function Indicador({ etiqueta, valor, nota }: { etiqueta: string; valor: React.ReactNode; nota?: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{etiqueta}</span>
        <span className="text-2xl font-semibold tabular-nums">{valor}</span>
        {nota && <span className="text-xs text-muted-foreground">{nota}</span>}
      </CardContent>
    </Card>
  );
}
