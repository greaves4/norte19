"use client";

import { Fuentes } from "@/components/desarrollo/Fuentes";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { ESTATUS_MARCA, type EstatusMarca } from "@/lib/types/desarrollo";

const OPCIONES = (Object.keys(ESTATUS_MARCA) as EstatusMarca[]).map((e) => ({ value: e, label: ESTATUS_MARCA[e].label }));

export function MarcaTab({ bloqueado }: { bloqueado: boolean }) {
  const marca = useDesarrollo((s) => s.proyecto.definicion.marca);
  const setEstatus = useDesarrollo((s) => s.setEstatusMarca);
  const { perfil, actor } = useActorDesarrollo();
  const editable = perfil === "revisor" && !bloqueado;
  const conteo = (e: EstatusMarca) => marca.filter((m) => m.estatus === e).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand standards · {Math.round((conteo("cumple") / marca.length) * 100)}% de cumplimiento</CardTitle>
        <CardDescription>
          {conteo("cumple")} cumplen, {conteo("desvia")} desvían y {conteo("sin_dato")} sin dato en el anteproyecto.{editable ? " Como revisor puedes corregir el estatus." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {marca.map((m) => (
            <li key={m.id} className="grid grid-cols-[minmax(0,1fr)] gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_11rem] md:items-start">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{m.id}</span>
                  <span className="text-xs text-muted-foreground">{m.categoria}</span>
                  <Badge variant="outline">{m.origen === "manual" ? "Extraído del manual de marca" : "Inferido del corpus"}</Badge>
                </div>
                <p className="font-medium">{m.requisito}</p>
                <p className="text-sm text-muted-foreground">Evidencia: {m.evidencia}</p>
                <Fuentes fuentes={m.fuentes} />
              </div>
              {editable ? (
                <Select items={OPCIONES} value={m.estatus} onValueChange={(v) => v && setEstatus(m.id, v as EstatusMarca, actor)}>
                  <SelectTrigger size="sm" className="w-full" aria-label={`Estatus de ${m.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge status={m.estatus} map={ESTATUS_MARCA} className="md:justify-self-end" />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
