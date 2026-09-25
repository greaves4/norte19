"use client";

import { Check, FileSpreadsheet, GitCompare, Pencil, Printer, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IndicadorSemaforo } from "@/components/desarrollo/IndicadorSemaforo";
import { PlanoEsquematico } from "@/components/desarrollo/PlanoEsquematico";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { DialogoJustificacion } from "@/components/shared/DialogoJustificacion";
import { GateBanner } from "@/components/shared/GateBanner";
import { Indicador } from "@/components/shared/Indicador";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { demoNow } from "@/lib/demo";
import { esc, imprimirHtml } from "@/lib/imprimir";
import { calcularScore, NOMBRE_RUBRO, RUBROS, resumenEjecutivo, type Score } from "@/lib/sim/desarrollo/auditoria";
import { useDesarrollo } from "@/lib/store/desarrollo";
import {
  ESTATUS_HALLAZGO,
  ESTATUS_MARCA,
  NOMBRE_IMPACTO,
  NOMBRE_PRIORIDAD,
  RESOLUCION_HALLAZGO,
  SEVERIDAD_HALLAZGO,
  type EstatusHallazgo,
  type Hallazgo,
  type Proyecto,
} from "@/lib/types/desarrollo";

const n1 = (v: number) => v.toLocaleString("es-MX", { maximumFractionDigits: 1 });
const ORDEN_SEVERIDAD = { critico: 0, medio: 1, menor: 2 } as const;
const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 } as const;
const NIVELES = [1, 2, 3, 4, 5];
const RESOLUCIONES = Object.entries(RESOLUCION_HALLAZGO).map(([value, v]) => ({ value, label: v.label }));

export const ubicacion = (h: Hallazgo) => [h.nivel && `Nivel ${h.nivel}`, h.eje && `eje ${h.eje.x}-${h.eje.y}`, h.zona].filter(Boolean).join(" · ");
const vigentes = (hs: Hallazgo[]) => hs.filter((h) => h.estatus !== "descartado");
const planDeAccion = (hs: Hallazgo[]) =>
  hs
    .filter((h) => h.estatus === "confirmado" || h.estatus === "ajustado")
    .sort((a, b) => a.disciplina.localeCompare(b.disciplina, "es") || ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || a.id.localeCompare(b.id));

type AccionRevisor = { h: Hallazgo; estatus: Extract<EstatusHallazgo, "ajustado" | "descartado"> } | null;

export function ReporteAuditoria() {
  const p = useDesarrollo((s) => s.proyecto);
  const setEstatus = useDesarrollo((s) => s.setEstatusHallazgo);
  const { perfil, actor } = useActorDesarrollo();
  const [accion, setAccion] = useState<AccionRevisor>(null);
  const a = p.auditoria;
  const hallazgos = useMemo(() => a?.hallazgos ?? [], [a]);
  const score = useMemo(() => calcularScore(hallazgos), [hallazgos]);
  const revisor = perfil === "revisor";

  function cambiar(h: Hallazgo, estatus: EstatusHallazgo, motivo?: string) {
    const antes = calcularScore(useDesarrollo.getState().proyecto.auditoria!.hallazgos).global;
    setEstatus(h.id, estatus, actor, motivo);
    const despues = calcularScore(useDesarrollo.getState().proyecto.auditoria!.hallazgos).global;
    toast.success(`${h.id} ${ESTATUS_HALLAZGO[estatus].label.toLowerCase()}`, { description: antes === despues ? `Score ${n1(despues)}` : `Score ${n1(antes)} → ${n1(despues)}` });
  }

  const columnas = useMemo(() => columnasMatriz(revisor, (h) => cambiar(h, "confirmado"), (h, estatus) => setAccion({ h, estatus })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cambiar lee el store al momento
    [revisor, actor]);

  if (!a) {
    return (
      <div className="flex flex-col gap-5 p-4 md:p-6">
        <PageHeader title="Reporte de auditoría" description="Score, hallazgos y plan de acción del paquete ejecutivo." />
        <GateBanner
          variant="bloqueado"
          title="Aún no se ejecuta la auditoría"
          description="El reporte se genera al terminar la auditoría integral."
          action={
            perfil !== "proyectista" ? (
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/desarrollo/proyectos/juarez/auditoria" />}>
                Ir a Auditoría
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const fecha = new Date(a.ejecutadaEn).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Reporte de auditoría"
        description={`${p.nombre} · ejecutada el ${fecha} por ${a.ejecutadaPor} · Verificación geométrica 2D`}
        actions={
          <>
            <Button variant="outline" disabled aria-describedby="nota-comparar" title="Se habilita desde la segunda auditoría del proyecto">
              <GitCompare data-icon="inline-start" />
              Comparar con auditoría anterior
            </Button>
            <Button onClick={() => exportar(p, score)}>
              <Printer data-icon="inline-start" />
              Exportar reporte
            </Button>
          </>
        }
      />
      <p id="nota-comparar" className="-mt-3 text-xs text-muted-foreground">
        Comparar con la auditoría anterior se habilita desde la segunda auditoría del proyecto.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-xs text-muted-foreground">Score de la auditoría</span>
            <span className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums" data-score>
                {n1(score.global)}
              </span>
              <span className="text-muted-foreground">/ 100</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <IndicadorSemaforo valor={score.semaforo} />
              <span className="font-medium">Recomendación: {score.recomendacion}</span>
            </span>
            <p className="text-sm text-muted-foreground">{score.detalle}</p>
            <p className="text-xs text-muted-foreground">
              Verde desde 85, ámbar desde 65. Solo cuentan los hallazgos no descartados ({vigentes(hallazgos).length} de {hallazgos.length}).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Desglose por rubro</CardTitle>
            <CardDescription>Por rubro: 100 menos 25 por crítico, 10 por medio y 3 por menor; el global pondera por el peso.</CardDescription>
          </CardHeader>
          <CardContent>
            <DesgloseRubros score={score} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumen" className="min-w-0 gap-4">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="resumen">Resumen ejecutivo</TabsTrigger>
          <TabsTrigger value="matriz">Matriz de hallazgos</TabsTrigger>
          <TabsTrigger value="clash">Clash report</TabsTrigger>
          <TabsTrigger value="marca">Cumplimiento de marca</TabsTrigger>
          <TabsTrigger value="riesgos">Riesgos constructivos</TabsTrigger>
          <TabsTrigger value="plan">Plan de acción</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <Card>
            <CardContent className="flex max-w-3xl flex-col gap-3 text-sm leading-relaxed">
              {resumenEjecutivo(hallazgos, p.nombre).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="matriz" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {revisor ? "Confirma, ajusta o descarta cada hallazgo; el score se recalcula al instante." : "El revisor experto confirma, ajusta o descarta cada hallazgo."}
          </p>
          <DataGrid columns={columnas} data={hallazgos} getRowId={(h) => h.id} initialPageSize={50} searchPlaceholder="Buscar hallazgo, disciplina o eje" exportFileName="matriz-de-hallazgos-juarez" />
        </TabsContent>
        <TabsContent value="clash">
          <ClashReport hallazgos={hallazgos} />
        </TabsContent>
        <TabsContent value="marca">
          <CumplimientoMarca p={p} hallazgos={hallazgos} />
        </TabsContent>
        <TabsContent value="riesgos">
          <RiesgosConstructivos hallazgos={hallazgos} />
        </TabsContent>
        <TabsContent value="plan">
          <PlanAccion hallazgos={hallazgos} editable={perfil !== "direccion"} />
        </TabsContent>
      </Tabs>

      <DialogoJustificacion
        open={accion !== null}
        onOpenChange={(o) => !o && setAccion(null)}
        titulo={accion ? `${accion.estatus === "descartado" ? "Descartar" : "Ajustar"} ${accion.h.id}` : ""}
        descripcion={accion?.h.descripcion}
        etiqueta={accion?.estatus === "descartado" ? "Motivo del descarte" : "Ajuste al hallazgo"}
        accion={accion?.estatus === "descartado" ? "Descartar" : "Ajustar"}
        destructiva={accion?.estatus === "descartado"}
        ayuda={accion?.estatus === "descartado" ? "Obligatorio. El hallazgo deja de contar en el score y queda en la bitácora." : "Obligatorio. Describe el ajuste (alcance, acción o responsable); sigue contando en el score."}
        onConfirmar={(motivo) => {
          if (accion) cambiar(accion.h, accion.estatus, motivo);
          setAccion(null);
        }}
      />
    </div>
  );
}

function DesgloseRubros({ score }: { score: Score }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Rubro</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Peso</th>
            <th scope="col" className="px-2 py-2 font-medium">Score</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">C · M · N</th>
            <th scope="col" className="py-2 pl-2 text-right font-medium">Aporte</th>
          </tr>
        </thead>
        <tbody>
          {score.porRubro.map((r) => (
            <tr key={r.rubro} className="border-b last:border-0" data-rubro={r.rubro}>
              <th scope="row" className="py-1.5 pr-3 text-left font-normal">{r.nombre}</th>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.peso}%</td>
              <td className="px-2 py-1.5">
                <span className="flex items-center gap-2">
                  <Progress value={r.score} className="w-24" aria-label={`Score de ${r.nombre}`} />
                  <span className="w-7 text-right tabular-nums">{r.score}</span>
                </span>
              </td>
              <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                {r.criticos} · {r.medios} · {r.menores}
              </td>
              <td className="py-1.5 pl-2 text-right tabular-nums">{n1((r.score * r.peso) / 100)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function columnasMatriz(revisor: boolean, confirmar: (h: Hallazgo) => void, pedirMotivo: (h: Hallazgo, estatus: "ajustado" | "descartado") => void) {
  const col = dataGridColumns<Hallazgo>();
  return col.columns([
    col.accessor("id", { header: "ID", cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span> }),
    col.accessor("severidad", {
      header: "Severidad",
      filterFn: "equalsString",
      cell: (c) => <StatusBadge status={c.getValue()} map={SEVERIDAD_HALLAZGO} />,
      meta: { filter: { type: "select", options: Object.entries(SEVERIDAD_HALLAZGO).map(([value, v]) => ({ value, label: v.label })) }, exportValue: (v) => SEVERIDAD_HALLAZGO[v as Hallazgo["severidad"]].label },
    }),
    col.accessor("rubro", {
      header: "Rubro",
      filterFn: "equalsString",
      cell: (c) => <span className="whitespace-nowrap">{NOMBRE_RUBRO[c.getValue()]}</span>,
      meta: { filter: { type: "select", options: RUBROS.map((r) => ({ value: r.id, label: r.nombre })) }, exportValue: (v) => NOMBRE_RUBRO[v as Hallazgo["rubro"]] },
    }),
    col.accessor("descripcion", {
      header: "Hallazgo",
      cell: (c) => (
        <span className="flex min-w-56 flex-col gap-0.5 whitespace-normal">
          <span>{c.getValue()}</span>
          <span className="text-xs text-muted-foreground">{[c.row.original.disciplina, ubicacion(c.row.original)].filter(Boolean).join(" · ")}</span>
        </span>
      ),
    }),
    col.accessor((h) => h.impacto.map((i) => NOMBRE_IMPACTO[i]).join(", "), { id: "impacto", header: "Impacto", cell: (c) => <span className="text-xs">{c.getValue()}</span>, meta: { hideBelow: "xl" } }),
    col.accessor("accion", {
      header: "Acción correctiva",
      cell: (c) => (
        <span className="flex min-w-48 flex-col gap-0.5 text-xs whitespace-normal">
          <span>{c.getValue()}</span>
          <span className="text-muted-foreground">{c.row.original.responsable}</span>
        </span>
      ),
      meta: { hideBelow: "xl" },
    }),
    col.accessor("prioridad", { header: "Prioridad", cell: (c) => NOMBRE_PRIORIDAD[c.getValue()], meta: { exportValue: (v) => NOMBRE_PRIORIDAD[v as Hallazgo["prioridad"]] } }),
    col.accessor("estatus", {
      header: "Estatus",
      filterFn: "equalsString",
      cell: (c) => (
        <span className="flex min-w-28 flex-col items-start gap-0.5">
          <StatusBadge status={c.getValue()} map={ESTATUS_HALLAZGO} />
          {c.row.original.motivo && <span className="text-xs whitespace-normal text-muted-foreground">{c.row.original.motivo}</span>}
        </span>
      ),
      meta: { filter: { type: "select", options: Object.entries(ESTATUS_HALLAZGO).map(([value, v]) => ({ value, label: v.label })) }, exportValue: (v) => ESTATUS_HALLAZGO[v as EstatusHallazgo].label },
    }),
    ...(revisor
      ? [
          col.display({
            id: "acciones",
            header: () => <span className="sr-only">Acciones</span>,
            cell: (c) => {
              const h = c.row.original;
              return (
                <span className="flex justify-end gap-1" data-print-hide>
                  <Button variant="ghost" size="icon-sm" title="Confirmar" aria-label={`Confirmar ${h.id}`} disabled={h.estatus === "confirmado"} onClick={() => confirmar(h)}>
                    <Check />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Ajustar" aria-label={`Ajustar ${h.id}`} onClick={() => pedirMotivo(h, "ajustado")}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Descartar" aria-label={`Descartar ${h.id}`} disabled={h.estatus === "descartado"} onClick={() => pedirMotivo(h, "descartado")}>
                    <X />
                  </Button>
                </span>
              );
            },
          }),
        ]
      : []),
  ]);
}

function ListaHallazgos({ hallazgos, seleccionado, onSeleccionar }: { hallazgos: Hallazgo[]; seleccionado?: string | null; onSeleccionar?: (id: string) => void }) {
  return (
    <ul className="flex flex-col divide-y text-sm">
      {hallazgos.map((h) => (
        <li key={h.id} className="py-2 first:pt-0 last:pb-0" data-hallazgo={h.id}>
          <button
            type="button"
            className="flex w-full flex-col gap-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
            disabled={!onSeleccionar}
            aria-pressed={onSeleccionar ? seleccionado === h.id : undefined}
            onClick={() => onSeleccionar?.(h.id)}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className={`font-mono text-xs ${seleccionado === h.id ? "font-semibold underline" : ""}`}>{h.id}</span>
              <StatusBadge status={h.severidad} map={SEVERIDAD_HALLAZGO} />
              {h.estatus !== "pendiente" && <StatusBadge status={h.estatus} map={ESTATUS_HALLAZGO} />}
              <span className="text-xs text-muted-foreground">{[h.disciplina, ubicacion(h)].filter(Boolean).join(" · ")}</span>
            </span>
            <span className={h.estatus === "descartado" ? "text-muted-foreground line-through" : ""}>{h.descripcion}</span>
            <span className="text-xs text-muted-foreground">Acción: {h.accion}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ClashReport({ hallazgos }: { hallazgos: Hallazgo[] }) {
  const [nivel, setNivel] = useState(1);
  const [sel, setSel] = useState<string | null>(null);
  const coordinacion = hallazgos.filter((h) => h.rubro === "coordinacion");
  const delNivel = coordinacion.filter((h) => h.nivel === nivel).sort((a, b) => ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad]);
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex flex-wrap items-center gap-2">
            Clash report <Badge variant="outline">Verificación geométrica 2D</Badge>
          </CardTitle>
          <CardDescription>Interferencias entre disciplinas sobre las plantas del paquete; sin modelo BIM federado.</CardDescription>
        </div>
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[String(nivel)]}
          onValueChange={(v) => {
            if (!v[0]) return;
            setNivel(Number(v[0]));
            setSel(null);
          }}
          aria-label="Nivel"
        >
          {NIVELES.map((nv) => (
            <ToggleGroupItem key={nv} value={String(nv)}>
              N{nv} ({vigentes(coordinacion).filter((h) => h.nivel === nv).length})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <PlanoEsquematico hallazgos={coordinacion} nivel={nivel} seleccionado={sel} onSeleccionar={setSel} />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            Nivel {nivel} · {delNivel.length === 1 ? "1 interferencia" : `${delNivel.length} interferencias`}
          </span>
          {delNivel.length ? <ListaHallazgos hallazgos={delNivel} seleccionado={sel} onSeleccionar={setSel} /> : <p className="text-sm text-muted-foreground">Sin interferencias en este nivel.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CumplimientoMarca({ p, hallazgos }: { p: Proyecto; hallazgos: Hallazgo[] }) {
  const req = p.definicion.marca;
  const cumple = req.filter((m) => m.estatus === "cumple").length;
  const deMarca = hallazgos.filter((h) => h.rubro === "marca");
  const pendientes = [...req].filter((m) => m.estatus !== "cumple");
  const pct = Math.round((cumple / req.length) * 100);
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <Indicador etiqueta="Cumplimiento del brand standard" valor={`${pct}%`} nota={`${cumple} de ${req.length} requisitos`} />
        </li>
        <li>
          <Indicador etiqueta="Desvían o sin dato" valor={pendientes.length} nota="De la Fase de Definición" />
        </li>
        <li>
          <Indicador etiqueta="Hallazgos de marca vigentes" valor={vigentes(deMarca).length} nota={`De ${deMarca.length} detectados en el paquete`} />
        </li>
        <li>
          <Indicador etiqueta="Score del rubro" valor={calcularScore(hallazgos).porRubro.find((r) => r.rubro === "marca")!.score} nota="Peso 20%" />
        </li>
      </ul>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hallazgos de marca en el paquete</CardTitle>
          </CardHeader>
          <CardContent>
            <ListaHallazgos hallazgos={deMarca} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Requisitos del brand standard</CardTitle>
            <CardDescription>Estatus revisado en la Fase de Definición.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y text-sm">
              {[...pendientes, ...req.filter((m) => m.estatus === "cumple")].map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                  <span className="flex flex-col">
                    <span>{m.requisito}</span>
                    <span className="text-xs text-muted-foreground">{m.categoria}</span>
                  </span>
                  <StatusBadge status={m.estatus} map={ESTATUS_MARCA} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RiesgosConstructivos({ hallazgos }: { hallazgos: Hallazgo[] }) {
  const top = vigentes(hallazgos)
    .filter((h) => h.impacto.includes("construccion"))
    .sort((a, b) => ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad] || ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || b.impacto.length - a.impacto.length)
    .slice(0, 10);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 riesgos constructivos</CardTitle>
        <CardDescription>Hallazgos vigentes con impacto en construcción, por severidad, prioridad y número de impactos.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col divide-y text-sm">
          {top.map((h, i) => (
            <li key={h.id} className="flex gap-3 py-2 first:pt-0 last:pb-0">
              <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{h.id}</span>
                  <StatusBadge status={h.severidad} map={SEVERIDAD_HALLAZGO} />
                  <span className="text-xs text-muted-foreground">
                    {[NOMBRE_RUBRO[h.rubro], h.disciplina, ubicacion(h)].filter(Boolean).join(" · ")} · Impacto: {h.impacto.map((x) => NOMBRE_IMPACTO[x].toLowerCase()).join(", ")}
                  </span>
                </span>
                <span>{h.descripcion}</span>
                <span className="text-xs text-muted-foreground">Acción: {h.accion}</span>
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function PlanAccion({ hallazgos, editable }: { hallazgos: Hallazgo[]; editable: boolean }) {
  const setResolucion = useDesarrollo((s) => s.setResolucionHallazgo);
  const plan = planDeAccion(hallazgos);
  const disciplinas = [...new Set(plan.map((h) => h.disciplina))];
  const resueltos = plan.filter((h) => h.resolucion === "resuelto").length;

  async function exportar() {
    const XLSX = await import("xlsx");
    const filas = [
      ["Disciplina", "ID", "Severidad", "Prioridad", "Hallazgo", "Ubicación", "Acción correctiva", "Responsable", "Estatus", "Resolución"],
      ...plan.map((h) => [h.disciplina, h.id, SEVERIDAD_HALLAZGO[h.severidad].label, NOMBRE_PRIORIDAD[h.prioridad], h.descripcion, ubicacion(h), h.accion, h.responsable, ESTATUS_HALLAZGO[h.estatus].label, RESOLUCION_HALLAZGO[h.resolucion ?? "abierto"].label]),
    ];
    const hoja = XLSX.utils.aoa_to_sheet(filas);
    hoja["!cols"] = [{ wch: 24 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 60 }, { wch: 28 }, { wch: 60 }, { wch: 30 }, { wch: 12 }, { wch: 12 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Plan de acción");
    XLSX.writeFile(libro, "plan-de-accion-juarez.xlsx");
    toast.success("Plan de acción exportado a Excel", { description: `${plan.length} acciones por disciplina y prioridad.` });
  }

  if (!plan.length) {
    return (
      <GateBanner
        variant="advertencia"
        title="Sin acciones todavía"
        description="El plan de acción incluye solo hallazgos confirmados o ajustados por el revisor experto en la Matriz de hallazgos."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Plan de acción</CardTitle>
          <CardDescription>
            {plan.length === 1 ? "1 acción" : `${plan.length} acciones`} de hallazgos confirmados y ajustados · {resueltos} {resueltos === 1 ? "resuelta" : "resueltas"}{editable ? "" : " · lo actualizan el revisor y el proyectista"}
          </CardDescription>
        </div>
        <Button variant="outline" onClick={() => void exportar()}>
          <FileSpreadsheet data-icon="inline-start" />
          Exportar a Excel
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {disciplinas.map((d) => (
          <section key={d} className="flex flex-col gap-2" aria-label={d}>
            <h3 className="text-sm font-medium">{d}</h3>
            <ul className="flex flex-col divide-y border-y text-sm">
              {plan
                .filter((h) => h.disciplina === d)
                .map((h) => (
                  <li key={h.id} className="flex flex-wrap items-start gap-3 py-2">
                    <span className="flex min-w-0 flex-1 basis-80 flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{h.id}</span>
                        <Badge variant="outline">Prioridad {NOMBRE_PRIORIDAD[h.prioridad].toLowerCase()}</Badge>
                        <span className="text-xs text-muted-foreground">{h.responsable}</span>
                      </span>
                      <span>{h.accion}</span>
                      <span className="text-xs text-muted-foreground">{h.descripcion}</span>
                    </span>
                    {editable ? (
                      <Select
                        items={RESOLUCIONES}
                        value={h.resolucion ?? "abierto"}
                        onValueChange={(v) => {
                          if (!v) return;
                          setResolucion(h.id, v as NonNullable<Hallazgo["resolucion"]>);
                          toast.success(`${h.id}: ${RESOLUCION_HALLAZGO[v as NonNullable<Hallazgo["resolucion"]>].label.toLowerCase()}`);
                        }}
                      >
                        <SelectTrigger size="sm" className="w-32" aria-label={`Resolución de ${h.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOLUCIONES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <StatusBadge status={h.resolucion ?? "abierto"} map={RESOLUCION_HALLAZGO} />
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function exportar(p: Proyecto, score: Score) {
  const a = p.auditoria!;
  const hs = a.hallazgos;
  const semaforo = score.semaforo === "ambar" ? "Ámbar" : score.semaforo === "verde" ? "Verde" : "Rojo";
  const fila = (h: Hallazgo) =>
    `<tr><td>${esc(h.id)}</td><td>${esc(SEVERIDAD_HALLAZGO[h.severidad].label)}</td><td>${esc(NOMBRE_RUBRO[h.rubro])}</td><td>${esc(h.descripcion)}<br><span class="muted small">${esc([h.disciplina, ubicacion(h)].filter(Boolean).join(" · "))}</span></td><td class="small">${esc(h.accion)}<br><span class="muted">${esc(h.responsable)}</span></td><td>${esc(ESTATUS_HALLAZGO[h.estatus].label)}${h.motivo ? `<br><span class="muted small">${esc(h.motivo)}</span>` : ""}</td></tr>`;
  const plan = planDeAccion(hs);
  const html = `
    <section class="portada">
      <p class="muted">Norte 19 · Desarrollo hotelero</p>
      <p class="titulo">Reporte de auditoría integral</p>
      <p class="sub">${esc(p.nombre)} · ${esc(p.ciudad)} · ${p.llaves} llaves</p>
      <p class="score">${esc(n1(score.global))} / 100</p>
      <p><strong>Semáforo ${semaforo} · Recomendación: ${esc(score.recomendacion)}</strong></p>
      <p class="muted">Ejecutada el ${esc(new Date(a.ejecutadaEn).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" }))} por ${esc(a.ejecutadaPor)} · Verificación geométrica 2D</p>
      <p class="muted">Impreso el ${esc(demoNow().toLocaleDateString("es-MX", { dateStyle: "long" }))}</p>
    </section>
    <h1>Reporte de auditoría · ${esc(p.nombre)}</h1>
    <h2>Resumen ejecutivo</h2>
    ${resumenEjecutivo(hs, p.nombre).map((t) => `<p>${esc(t)}</p>`).join("")}
    <h2>Desglose por rubro</h2>
    <table><thead><tr><th>Rubro</th><th class="text-right">Peso</th><th class="text-right">Score</th><th class="text-right">Críticos</th><th class="text-right">Medios</th><th class="text-right">Menores</th></tr></thead><tbody>
    ${score.porRubro.map((r) => `<tr><td>${esc(r.nombre)}</td><td class="text-right">${r.peso}%</td><td class="text-right">${r.score}</td><td class="text-right">${r.criticos}</td><td class="text-right">${r.medios}</td><td class="text-right">${r.menores}</td></tr>`).join("")}
    </tbody></table>
    <h2>Matriz de hallazgos (${hs.length})</h2>
    <table><thead><tr><th>ID</th><th>Severidad</th><th>Rubro</th><th>Hallazgo</th><th>Acción correctiva</th><th>Estatus</th></tr></thead><tbody>${[...hs].sort((x, y) => ORDEN_SEVERIDAD[x.severidad] - ORDEN_SEVERIDAD[y.severidad] || x.id.localeCompare(y.id)).map(fila).join("")}</tbody></table>
    <h2>Plan de acción (${plan.length})</h2>
    ${plan.length ? `<table><thead><tr><th>Disciplina</th><th>ID</th><th>Prioridad</th><th>Acción</th><th>Responsable</th><th>Resolución</th></tr></thead><tbody>${plan.map((h) => `<tr><td>${esc(h.disciplina)}</td><td>${esc(h.id)}</td><td>${esc(NOMBRE_PRIORIDAD[h.prioridad])}</td><td>${esc(h.accion)}</td><td>${esc(h.responsable)}</td><td>${esc(RESOLUCION_HALLAZGO[h.resolucion ?? "abierto"].label)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">Sin hallazgos confirmados o ajustados todavía.</p>`}
  `;
  imprimirHtml({
    titulo: `Reporte de auditoría · ${p.nombre}`,
    html,
    css: `body > h1:first-child { display: none; } .portada .titulo { font-size: 22pt; font-weight: 600; margin: 8pt 0; } .portada .sub { font-size: 12pt; } .portada .score { font-size: 36pt; font-weight: 600; margin: 18pt 0 6pt; }`,
  });
  toast.success("Reporte listo para imprimir o guardar en PDF");
}
