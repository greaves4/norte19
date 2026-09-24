"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DetalleSolicitud } from "@/components/contratos/DetalleSolicitud";
import { RelojSla } from "@/components/contratos/RelojSla";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { abogadoPorId, contraparteDe, TIPOS_CONTRATO, USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos";
import { useNow } from "@/lib/demo";
import { fecha } from "@/lib/format";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, type EstatusSolicitud, type Solicitud } from "@/lib/types/contratos";

const USUARIO = USUARIOS_CONTRATOS.solicitante;

const col = dataGridColumns<Solicitud>();

function columnas(now: Date) {
  return col.columns([
    col.accessor("folio", {
      header: "Folio",
      cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span>,
      meta: { hideOnMobile: true },
    }),
    col.accessor((s) => contraparteDe(s.campos), {
      id: "contraparte",
      header: "Contraparte",
      cell: (c) => (
        <span className="flex min-w-0 flex-col gap-1 md:min-w-48">
          <span className="line-clamp-2 whitespace-normal">{c.getValue()}</span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground md:hidden">
            {c.row.original.folio}
            <StatusBadge status={c.row.original.estatus} map={ESTATUS_SOLICITUD} />
          </span>
        </span>
      ),
    }),
    col.accessor("tipoContrato", {
      header: "Tipo",
      filterFn: "equalsString",
      cell: (c) => NOMBRE_TIPO_CONTRATO[c.getValue()],
      meta: {
        hideOnMobile: true,
        filter: { type: "select", options: TIPOS_CONTRATO.map((t) => ({ value: t, label: NOMBRE_TIPO_CONTRATO[t] })) },
        exportValue: (v) => NOMBRE_TIPO_CONTRATO[v as Solicitud["tipoContrato"]],
      },
    }),
    col.accessor((s) => new Date(s.creadaEn), {
      id: "creada",
      header: "Creada",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap">{fecha(c.getValue())}</span>,
      meta: { hideBelow: "lg" },
    }),
    col.accessor((s) => abogadoPorId(s.abogadoId)?.nombre ?? "", {
      id: "abogado",
      header: "Abogado",
      meta: { hideBelow: "xl" },
    }),
    col.accessor("estatus", {
      header: "Estatus",
      filterFn: "equalsString",
      cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_SOLICITUD} />,
      meta: {
        hideOnMobile: true,
        filter: { type: "select", options: (Object.keys(ESTATUS_SOLICITUD) as EstatusSolicitud[]).map((e) => ({ value: e, label: ESTATUS_SOLICITUD[e].label })) },
        exportValue: (v) => ESTATUS_SOLICITUD[v as EstatusSolicitud]?.label ?? String(v),
      },
    }),
    col.display({
      id: "sla",
      header: "SLA",
      enableSorting: false,
      cell: (c) => <RelojSla solicitud={c.row.original} now={now} />,
      meta: { hideBelow: "lg" },
    }),
  ]);
}

const RESUMEN: { etiqueta: string; estatus: EstatusSolicitud[] }[] = [
  { etiqueta: "En Legal", estatus: ["nueva", "en_analisis"] },
  { etiqueta: "Requieren tus ajustes", estatus: ["en_ajustes"] },
  { etiqueta: "En aprobación y firma", estatus: ["en_aprobacion", "aprobada", "en_firma"] },
  { etiqueta: "Formalizadas", estatus: ["formalizada"] },
];

export function MisSolicitudes() {
  const hidratado = useContratosHydrated();
  const todas = useContratos((s) => s.solicitudes);
  const now = useNow(60_000);
  const mias = useMemo(() => todas.filter((s) => s.solicitanteId === USUARIO.id), [todas]);
  const cols = useMemo(() => columnas(now), [now]);
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  const seleccionada = useContratos((s) => (seleccionadaId ? s.solicitudes.find((x) => x.id === seleccionadaId) ?? null : null));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Mis solicitudes"
        description={`Solicitudes de ${USUARIO.nombre} (Desarrollo). Toca una para ver su historial.`}
        actions={
          <Button nativeButton={false} render={<Link href="/contratos/solicitudes/nueva" />}>
            <Plus data-icon="inline-start" />
            Nueva solicitud
          </Button>
        }
      />
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {RESUMEN.map((r) => (
          <li key={r.etiqueta}>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{r.etiqueta}</span>
                <span className="text-2xl font-semibold tabular-nums">{mias.filter((s) => r.estatus.includes(s.estatus)).length}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <DataGrid
        columns={cols}
        data={mias}
        loading={!hidratado}
        getRowId={(s) => s.id}
        onRowClick={(s) => setSeleccionadaId(s.id)}
        initialSorting={[{ id: "creada", desc: true }]}
        searchPlaceholder="Buscar por folio o contraparte"
        exportFileName="mis-solicitudes"
        emptyTitle="Aún no tienes solicitudes"
        emptyDescription="Crea una solicitud y Legal la recibirá con su SLA."
      />
      <DetalleSolicitud solicitud={seleccionada} onOpenChange={(o) => !o && setSeleccionadaId(null)} puedeCorregir />
    </div>
  );
}
