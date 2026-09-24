"use client";

import { endOfDay, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { ComprobantesLinks, MovimientoDetalle } from "@/components/fund/MovimientoDetalle";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CENTROS_COSTOS, nombreCentroCostos } from "@/lib/fixtures/fund";
import { fecha, mxn } from "@/lib/format";
import { useFund } from "@/lib/store/fund";
import { ESTATUS_MOVIMIENTO, type EstatusMovimiento, type Movimiento } from "@/lib/types/fund";

const col = dataGridColumns<Movimiento>();

const columnas = col.columns([
  col.accessor((m) => new Date(m.fecha), {
    id: "fecha",
    header: "Fecha",
    sortFn: "datetime",
    enableGlobalFilter: false,
    cell: (c) => <span className="whitespace-nowrap">{fecha(c.getValue())}</span>,
    meta: { hideOnMobile: true },
  }),
  col.accessor("proveedor", {
    header: "Proveedor",
    // En móvil la celda también muestra fecha y estatus (sus columnas se ocultan).
    cell: (c) => (
      <span className="flex min-w-0 flex-col gap-1 md:min-w-40">
        <span className="line-clamp-2 whitespace-normal">{c.getValue()}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground md:hidden">
          {fecha(c.row.original.fecha)}
          <StatusBadge status={c.row.original.estatus} map={ESTATUS_MOVIMIENTO} />
        </span>
      </span>
    ),
  }),
  col.accessor((m) => m.conceptos[0]?.descripcion ?? "", {
    id: "concepto",
    header: "Concepto",
    cell: (c) => {
      const extra = c.row.original.conceptos.length - 1;
      return (
        <span className="line-clamp-2 min-w-48">
          {c.getValue()}
          {extra > 0 && <span className="text-muted-foreground"> +{extra}</span>}
        </span>
      );
    },
    meta: { hideBelow: "xl" },
  }),
  col.accessor("centroCostos", {
    header: "Centro de costos",
    filterFn: "equalsString",
    cell: (c) => nombreCentroCostos(c.getValue()),
    meta: {
      hideBelow: "xl",
      filter: { type: "select", options: CENTROS_COSTOS.map((c) => ({ value: c.id, label: c.nombre })) },
      exportValue: (v) => nombreCentroCostos(String(v)),
    },
  }),
  col.accessor("total", {
    header: "Monto",
    cell: (c) => mxn(c.getValue()),
    meta: { align: "end" },
  }),
  col.accessor("estatus", {
    header: "Estatus",
    filterFn: "equalsString",
    cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_MOVIMIENTO} />,
    meta: {
      hideOnMobile: true,
      filter: {
        type: "select",
        options: (Object.keys(ESTATUS_MOVIMIENTO) as EstatusMovimiento[]).map((e) => ({ value: e, label: ESTATUS_MOVIMIENTO[e].label })),
      },
      exportValue: (v) => ESTATUS_MOVIMIENTO[v as EstatusMovimiento]?.label ?? String(v),
    },
  }),
  col.display({
    id: "comprobantes",
    header: "Comprobantes",
    enableSorting: false,
    cell: (c) => <ComprobantesLinks comprobantes={c.row.original.comprobantes} />,
    meta: { hideBelow: "xl" },
  }),
]);

type Props = {
  movimientos: Movimiento[];
  exportFileName: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

// Grid de movimientos con rango de fechas, filtros de cabecera, exportación y detalle al hacer clic.
export function MovimientosGrid({ movimientos, exportFileName, emptyTitle, emptyDescription }: Props) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  // El detalle lee del store para reflejar cambios mientras está abierto.
  const seleccionado = useFund((s) => (seleccionadoId ? s.movimientos.find((m) => m.id === seleccionadoId) ?? null : null));

  const filtrados = useMemo(() => {
    const inicio = desde ? startOfDay(new Date(`${desde}T00:00:00`)).toISOString() : null;
    const fin = hasta ? endOfDay(new Date(`${hasta}T00:00:00`)).toISOString() : null;
    return movimientos.filter((m) => (!inicio || m.fecha >= inicio) && (!fin || m.fecha <= fin));
  }, [movimientos, desde, hasta]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mov-desde">Desde</Label>
          <Input id="mov-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mov-hasta">Hasta</Label>
          <Input id="mov-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </div>
        {(desde || hasta) && (
          <Button variant="ghost" size="sm" onClick={() => (setDesde(""), setHasta(""))}>
            Quitar fechas
          </Button>
        )}
      </div>

      <DataGrid
        columns={columnas}
        data={filtrados}
        getRowId={(m) => m.id}
        initialSorting={[{ id: "fecha", desc: true }]}
        onRowClick={(m) => setSeleccionadoId(m.id)}
        searchPlaceholder="Buscar proveedor o concepto"
        exportFileName={exportFileName}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <MovimientoDetalle movimiento={seleccionado} onOpenChange={(open) => !open && setSeleccionadoId(null)} />
    </div>
  );
}
