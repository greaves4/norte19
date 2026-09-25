"use client";

import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Fuentes } from "@/components/desarrollo/Fuentes";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { ESTATUS_RIESGO, SEVERIDAD_RIESGO, type Riesgo } from "@/lib/types/desarrollo";

const TIPO: Record<Riesgo["tipo"], string> = { constructivo: "Constructivo", operativo: "Operativo", coordinacion: "Coordinación" };

export function RiesgosTab({ bloqueado }: { bloqueado: boolean }) {
  const riesgos = useDesarrollo((s) => s.proyecto.definicion.riesgos);
  const setEstatus = useDesarrollo((s) => s.setEstatusRiesgo);
  const { perfil, actor } = useActorDesarrollo();
  const revisor = perfil === "revisor" && !bloqueado;
  const pendientes = riesgos.filter((r) => r.estatus === "pendiente").length;

  function cambiar(r: Riesgo, estatus: Riesgo["estatus"]) {
    setEstatus(r.id, estatus, actor);
    toast.success(`${r.id} ${estatus === "confirmado" ? "confirmado" : estatus === "descartado" ? "descartado" : "regresó a pendiente"}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de riesgos · {pendientes === 0 ? "revisado" : `${pendientes} pendientes de revisión experta`}</CardTitle>
        <CardDescription>
          Riesgos constructivos, operativos y de coordinación detectados en los inputs del sitio y en patrones del corpus.
          {revisor ? " Confirma los que apliquen y descarta los que no." : " Los confirma o descarta el revisor experto."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {riesgos.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)] gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                  <Badge variant="outline">{TIPO[r.tipo]}</Badge>
                  <StatusBadge status={r.severidad} map={SEVERIDAD_RIESGO} />
                  <span className="text-xs text-muted-foreground">Origen: {r.origen === "sitio" ? "input del sitio" : "patrón del corpus"}</span>
                </div>
                <p className={r.estatus === "descartado" ? "text-muted-foreground line-through" : "font-medium"}>{r.descripcion}</p>
                <p className="text-sm text-muted-foreground">Mitigación: {r.mitigacion}</p>
                <Fuentes fuentes={r.fuentes} />
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <StatusBadge status={r.estatus} map={ESTATUS_RIESGO} />
                {revisor && (
                  <div className="flex gap-1">
                    {r.estatus !== "confirmado" && (
                      <Button size="sm" variant="outline" onClick={() => cambiar(r, "confirmado")} aria-label={`Confirmar ${r.id}`}>
                        <Check data-icon="inline-start" />
                        Confirmar
                      </Button>
                    )}
                    {r.estatus !== "descartado" && (
                      <Button size="sm" variant="ghost" onClick={() => cambiar(r, "descartado")} aria-label={`Descartar ${r.id}`}>
                        <X data-icon="inline-start" />
                        Descartar
                      </Button>
                    )}
                    {r.estatus !== "pendiente" && (
                      <Button size="sm" variant="ghost" onClick={() => cambiar(r, "pendiente")}>
                        Deshacer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
