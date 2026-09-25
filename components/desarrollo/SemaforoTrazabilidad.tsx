"use client";

import { GitBranch, Printer, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { etiquetaFuente, Fuentes } from "@/components/desarrollo/Fuentes";
import { IndicadorSemaforo } from "@/components/desarrollo/IndicadorSemaforo";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { demoNow } from "@/lib/demo";
import { esc, imprimirHtml } from "@/lib/imprimir";
import { calcularAvance, condicionEntrega, VALOR_SEMAFORO } from "@/lib/sim/desarrollo/semaforo";
import { sugerencias, trazabilidad, type NodoTraza } from "@/lib/sim/desarrollo/trazabilidad";
import { useDesarrollo } from "@/lib/store/desarrollo";
import type { Entregable, EntregableId, Proyecto, Semaforo } from "@/lib/types/desarrollo";

const OPCIONES: { value: Semaforo; label: string }[] = [
  { value: "verde", label: "Verde" },
  { value: "ambar", label: "Ámbar" },
  { value: "rojo", label: "Rojo" },
];
const pct = (v: number) => `${(v * 100).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`;

export function SemaforoTrazabilidad() {
  const p = useDesarrollo((s) => s.proyecto);
  const calificar = useDesarrollo((s) => s.calificarEntregable);
  const { perfil, actor } = useActorDesarrollo();
  const [abierto, setAbierto] = useState<Entregable | null>(null);
  const traza = useMemo(() => trazabilidad(p), [p]);
  const sug = useMemo(() => sugerencias(p), [p]);
  const avance = calcularAvance(p.semaforo);
  const entrega = condicionEntrega(p.semaforo);
  const revisor = perfil === "revisor";
  const distintas = p.semaforo.filter((e) => sug[e.id].semaforo !== e.semaforo);

  function aplicarSugerencias() {
    for (const e of distintas) calificar(e.id, sug[e.id].semaforo, actor);
    toast.success(`${distintas.length === 1 ? "1 calificación actualizada" : `${distintas.length} calificaciones actualizadas`}`, { description: `Avance: ${pct(calcularAvance(useDesarrollo.getState().proyecto.semaforo))}` });
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Semáforo y trazabilidad"
        description="Avance ponderado de los 13 entregables del estándar. Cada dato generado se puede rastrear hasta su hotel, documento y página, o hasta el input del proyecto."
        actions={
          <Button variant="outline" onClick={() => exportar(p, traza)}>
            <Printer data-icon="inline-start" />
            Exportar expediente de trazabilidad
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Avance total</span>
            <span className="text-3xl font-semibold tabular-nums">{pct(avance)}</span>
            <Progress value={avance * 100} aria-label="Avance total" />
            <span className="text-xs text-muted-foreground">Σ peso × calificación (verde 1, ámbar 0.5, rojo 0)</span>
          </CardContent>
        </Card>
        {entrega.cumple ? (
          <GateBanner variant="aprobado" title="Cumple la condición de entrega" description="Entregables de 10% o más en verde y avance de 95% o más." />
        ) : (
          <GateBanner
            variant="advertencia"
            title="Aún no cumple la condición de entrega"
            description={`Se requiere avance de 95% o más (hoy ${pct(avance)}) y todos los entregables de 10% o más en verde.`}
            items={entrega.pendientes.map((e) => `${e.nombre} (${e.peso}%) en ${e.semaforo === "ambar" ? "ámbar" : "rojo"}`)}
          />
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Entregables</CardTitle>
            <CardDescription>{revisor ? "Califica cada entregable; la sugerencia del sistema es una referencia." : "Los califica el revisor experto."}</CardDescription>
          </div>
          {revisor && distintas.length > 0 && (
            <Button variant="outline" size="sm" onClick={aplicarSugerencias}>
              <Wand2 data-icon="inline-start" />
              Aplicar sugerencias ({distintas.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">Entregable</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Peso</th>
                  <th scope="col" className="px-2 py-2 font-medium">Calificación</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Aporte</th>
                  <th scope="col" className="px-2 py-2 font-medium">Sugerencia del sistema</th>
                  <th scope="col" className="py-2 pl-2 font-medium"><span className="sr-only">Trazabilidad</span></th>
                </tr>
              </thead>
              <tbody>
                {p.semaforo.map((e) => (
                  <tr key={e.id} className="border-b align-middle last:border-0">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">{e.nombre}</th>
                    <td className="px-2 py-2 text-right tabular-nums">{e.peso}%</td>
                    <td className="px-2 py-2">
                      {revisor ? (
                        <Select items={OPCIONES} value={e.semaforo} onValueChange={(v) => v && calificar(e.id, v as Semaforo, actor)}>
                          <SelectTrigger size="sm" className="w-28" aria-label={`Calificación de ${e.nombre}`}>
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
                        <IndicadorSemaforo valor={e.semaforo} />
                      )}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{(e.peso * VALOR_SEMAFORO[e.semaforo]).toLocaleString("es-MX", { maximumFractionDigits: 1 })}</td>
                    <td className="px-2 py-2">
                      <span className="flex flex-col items-start gap-0.5">
                        <IndicadorSemaforo valor={sug[e.id].semaforo} />
                        <span className="text-xs text-muted-foreground">{sug[e.id].motivo}</span>
                      </span>
                    </td>
                    <td className="py-2 pl-2 text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => setAbierto(e)} aria-label={`Trazabilidad de ${e.nombre}`} title="Ver trazabilidad">
                        <GitBranch />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={abierto !== null} onOpenChange={(o) => !o && setAbierto(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {abierto && (
            <>
              <SheetHeader>
                <SheetTitle>{abierto.nombre}</SheetTitle>
                <SheetDescription>
                  Peso {abierto.peso}% · {traza[abierto.id].length} datos · de dónde sale cada uno
                </SheetDescription>
              </SheetHeader>
              <Arbol nodos={traza[abierto.id]} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Arbol({ nodos }: { nodos: NodoTraza[] }) {
  return (
    <ul className="flex flex-col gap-3 px-4 pb-6" aria-label="Datos y fuentes">
      {nodos.map((nd, i) => (
        <li key={i} className="flex flex-col gap-1 border-l-2 pl-3">
          <span className="text-sm font-medium">{nd.dato}</span>
          {nd.detalle && <span className="text-xs text-muted-foreground">{nd.detalle}</span>}
          {nd.fuentes.length ? (
            <div className="ml-1 border-l pl-3">
              <Fuentes fuentes={nd.fuentes} max={4} />
            </div>
          ) : (
            <span className="ml-1 border-l pl-3 text-xs text-muted-foreground">Sin fuente documental: supuesto o pendiente.</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function exportar(p: Proyecto, traza: Record<EntregableId, NodoTraza[]>) {
  const secciones = p.semaforo
    .map((e) => {
      const filas = traza[e.id]
        .map(
          (nd) =>
            `<tr><td><strong>${esc(nd.dato)}</strong>${nd.detalle ? `<br><span class="muted small">${esc(nd.detalle)}</span>` : ""}</td><td class="small">${nd.fuentes.length ? nd.fuentes.map((f) => esc(etiquetaFuente(f))).join("<br>") : "Supuesto o pendiente"}</td></tr>`,
        )
        .join("");
      return `<div class="bloque"><h2>${esc(e.nombre)} · ${e.peso}% · ${e.semaforo === "ambar" ? "ámbar" : e.semaforo}</h2><table><thead><tr><th>Dato</th><th>Fuente</th></tr></thead><tbody>${filas}</tbody></table></div>`;
    })
    .join("");
  imprimirHtml({
    titulo: `Expediente de trazabilidad · ${p.nombre}`,
    html: `<p class="muted">Avance ${pct(calcularAvance(p.semaforo))} · ${esc(demoNow().toLocaleDateString("es-MX", { dateStyle: "long" }))}</p>${secciones}`,
  });
  toast.success("Expediente listo para imprimir o guardar en PDF");
}
