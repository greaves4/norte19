"use client";

import { Fuentes } from "@/components/desarrollo/Fuentes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDesarrollo } from "@/lib/store/desarrollo";

export function DecisionesTab() {
  const decisiones = useDesarrollo((s) => s.proyecto.definicion.decisiones);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Cada decisión se respalda con un hotel del corpus o un input del sitio. Abre la fuente para ver el documento de origen.</p>
      <ul className="grid gap-3 lg:grid-cols-2">
        {decisiones.map((d) => (
          <li key={d.id}>
            <Card size="sm" className="h-full">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-mono">{d.id}</span>
                  {d.tema}
                </CardDescription>
                <CardTitle className="text-base leading-snug">{d.decision}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm">{d.justificacion}</p>
                <Fuentes fuentes={d.fuentes} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
