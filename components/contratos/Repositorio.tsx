"use client";

import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNow } from "@/lib/demo";
import { TIPOS_CONTRATO } from "@/lib/fixtures/contratos";
import { fecha, mxn } from "@/lib/format";
import { resumenCustodia } from "@/lib/sim/contratos/custodia";
import { diasParaVencer, estatusVigencia, proximosVencimientos } from "@/lib/sim/contratos/vencimientos";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_VIGENCIA, NOMBRE_TIPO_CONTRATO, type Contrato, type EstatusVigencia } from "@/lib/types/contratos";

type Fila = Contrato & { vigencia: EstatusVigencia; pendientes: number };

const col = dataGridColumns<Fila>();

const columnas = col.columns([
  col.accessor("folio", { header: "Folio", cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span>, meta: { hideOnMobile: true } }),
  col.accessor("contraparte", {
    header: "Contraparte",
    meta: { filter: { type: "text" } },
    cell: (c) => (
      <span className="flex min-w-0 flex-col gap-1 md:min-w-48">
        <span className="line-clamp-2 whitespace-normal">{c.getValue()}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground md:hidden">
          {NOMBRE_TIPO_CONTRATO[c.row.original.tipo]}
          <StatusBadge status={c.row.original.vigencia} map={ESTATUS_VIGENCIA} />
        </span>
      </span>
    ),
  }),
  col.accessor("tipo", {
    header: "Tipo",
    filterFn: "equalsString",
    cell: (c) => NOMBRE_TIPO_CONTRATO[c.getValue()],
    meta: {
      hideOnMobile: true,
      filter: { type: "select", options: TIPOS_CONTRATO.map((t) => ({ value: t, label: NOMBRE_TIPO_CONTRATO[t] })) },
      exportValue: (v) => NOMBRE_TIPO_CONTRATO[v as Contrato["tipo"]],
    },
  }),
  col.accessor("objeto", { header: "Inmueble u objeto", cell: (c) => <span className="line-clamp-2 min-w-48 whitespace-normal">{c.getValue()}</span>, meta: { hideBelow: "xl" } }),
  col.accessor((c) => new Date(`${c.vigenciaFin}T12:00:00`), {
    id: "vigenciaFin",
    header: "Vigencia",
    sortFn: "datetime",
    enableGlobalFilter: false,
    cell: (c) => (
      <span className="whitespace-nowrap">
        {fecha(`${c.row.original.vigenciaInicio}T12:00:00`, "MMM yyyy")} – {fecha(c.getValue())}
      </span>
    ),
    meta: { hideBelow: "lg", label: "Fin de vigencia" },
  }),
  col.accessor("monto", {
    header: "Renta o monto",
    cell: (c) =>
      c.getValue() ? (
        <span className="whitespace-nowrap tabular-nums">
          {mxn(c.getValue())}
          {c.row.original.periodicidadMonto === "mensual" && <span className="text-muted-foreground"> /mes</span>}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    meta: { align: "end", hideBelow: "lg" },
  }),
  col.accessor("vigencia", {
    header: "Estatus",
    filterFn: "equalsString",
    cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_VIGENCIA} />,
    meta: {
      hideOnMobile: true,
      filter: { type: "select", options: (Object.keys(ESTATUS_VIGENCIA) as EstatusVigencia[]).map((e) => ({ value: e, label: ESTATUS_VIGENCIA[e].label })) },
      exportValue: (v) => ESTATUS_VIGENCIA[v as EstatusVigencia].label,
    },
  }),
  col.accessor((c) => resumenCustodia(c), { id: "custodia", header: "Custodia", cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{c.getValue()}</span>, meta: { hideBelow: "xl" } }),
  col.accessor("pendientes", {
    header: "Por confirmar",
    enableGlobalFilter: false,
    cell: (c) => (c.getValue() ? <Badge variant="outline">{c.getValue() === 1 ? "1 campo" : `${c.getValue()} campos`}</Badge> : <span className="text-muted-foreground">—</span>),
    meta: { hideBelow: "xl", align: "end" },
  }),
]);

export function Repositorio() {
  const router = useRouter();
  const hidratado = useContratosHydrated();
  const { actor } = useActorContratos();
  const contratos = useContratos((s) => s.contratos);
  const solicitudes = useContratos((s) => s.solicitudes);
  const iniciarRenovacion = useContratos((s) => s.iniciarRenovacion);
  const now = useNow(60_000);
  const dia = format(now, "yyyy-MM-dd");

  // El estatus de vigencia se recalcula con el reloj de demo (cambia por día).
  const filas = useMemo<Fila[]>(() => {
    const hoy = new Date(`${dia}T12:00:00`);
    return contratos.map((c) => ({ ...c, vigencia: estatusVigencia(c.vigenciaFin, hoy), pendientes: c.extraccion.filter((x) => !x.confirmado).length }));
  }, [contratos, dia]);
  const conteo = useMemo(() => {
    const r = { vigente: 0, por_vencer: 0, vencido: 0, pendientes: 0 };
    for (const f of filas) {
      r[f.vigencia] += 1;
      r.pendientes += f.pendientes;
    }
    return r;
  }, [filas]);
  const proximos = useMemo(() => proximosVencimientos(contratos, now), [contratos, now]);
  const renovaciones = useMemo(
    () => new Map(solicitudes.filter((s) => s.renovacionDe && s.estatus !== "formalizada").map((s) => [s.renovacionDe!, s])),
    [solicitudes],
  );

  function renovar(c: Contrato) {
    const id = iniciarRenovacion(c.id, actor);
    if (!id) return;
    const folio = useContratos.getState().solicitudes.find((s) => s.id === id)?.folio;
    toast.success(`Renovación iniciada: ${folio}`, { description: "Solicitud precargada con los datos del contrato; completa el expediente." });
    router.push(`/contratos/legal/solicitudes/${id}`);
  }

  const indicadores = [
    { etiqueta: "Vigentes", valor: conteo.vigente },
    { etiqueta: "Por vencer (90 días)", valor: conteo.por_vencer },
    { etiqueta: "Vencidos", valor: conteo.vencido },
    { etiqueta: "Campos por confirmar", valor: conteo.pendientes },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader title="Repositorio" description="Contratos formalizados con los datos que extrajo la IA. Toca uno para ver el documento." />
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {indicadores.map((i) => (
          <li key={i.etiqueta}>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{i.etiqueta}</span>
                <span className="text-2xl font-semibold tabular-nums">{hidratado ? i.valor : "–"}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <DataGrid
          columns={columnas}
          data={filas}
          loading={!hidratado}
          getRowId={(c) => c.id}
          onRowClick={(c) => router.push(`/contratos/repositorio/${c.id}`)}
          initialSorting={[{ id: "vigenciaFin", desc: false }]}
          searchPlaceholder="Buscar por folio, contraparte u objeto"
          exportFileName="repositorio-contratos"
          emptyTitle="Sin contratos"
          emptyDescription="Los contratos formalizados aparecen aquí."
        />
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Por vencer</CardTitle>
            <CardDescription>Próximos 5 vencimientos. La renovación crea una solicitud precargada.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col divide-y">
              {proximos.map((c) => {
                const dias = diasParaVencer(c.vigenciaFin, now);
                const enCurso = renovaciones.get(c.id);
                return (
                  <li key={c.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                    <Link href={`/contratos/repositorio/${c.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                      {c.contraparte}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {NOMBRE_TIPO_CONTRATO[c.tipo]} · vence el {fecha(`${c.vigenciaFin}T12:00:00`)} ·{" "}
                      <span className="tabular-nums">{dias === 0 ? "hoy" : dias === 1 ? "en 1 día" : `en ${dias} días`}</span>
                    </span>
                    {enCurso ? (
                      <Button variant="link" size="sm" className="h-auto self-start px-0" nativeButton={false} render={<Link href={`/contratos/legal/solicitudes/${enCurso.id}`} />}>
                        Renovación en curso · {enCurso.folio}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="self-start" onClick={() => renovar(c)}>
                        <RefreshCw data-icon="inline-start" />
                        Iniciar renovación
                      </Button>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
