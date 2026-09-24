"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DialogoPrestamo, type Prestando } from "@/components/contratos/DialogoPrestamo";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNow } from "@/lib/demo";
import { fecha } from "@/lib/format";
import { filasCustodia, prestamoVencido, type FilaCustodia } from "@/lib/sim/contratos/custodia";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_TANTO, type EstatusTanto } from "@/lib/types/contratos";

const col = dataGridColumns<FilaCustodia>();

type Acciones = { prestar: (f: FilaCustodia) => void; devolver: (f: FilaCustodia) => void; now: Date };

function columnas({ prestar, devolver, now }: Acciones) {
  return col.columns([
    col.accessor((f) => f.contrato.contraparte, {
      id: "contrato",
      header: "Contrato",
      cell: (c) => (
        <span className="flex min-w-0 flex-col gap-0.5 md:min-w-48">
          <Link href={`/contratos/repositorio/${c.row.original.contrato.id}`} className="line-clamp-2 whitespace-normal underline-offset-4 hover:underline" onClick={(e) => e.stopPropagation()}>
            {c.getValue()}
          </Link>
          <span className="font-mono text-xs text-muted-foreground">{c.row.original.contrato.folio}</span>
        </span>
      ),
    }),
    col.accessor((f) => `${f.tanto.numero}/3`, { id: "tanto", header: "Tanto", cell: (c) => <span className="tabular-nums">{c.getValue()}</span> }),
    col.accessor((f) => f.tanto.ubicacion, { id: "ubicacion", header: "Ubicación", cell: (c) => <span className="line-clamp-2 min-w-40 whitespace-normal">{c.getValue()}</span>, meta: { hideBelow: "xl" } }),
    col.accessor((f) => f.tanto.responsable, { id: "responsable", header: "Responsable", meta: { hideBelow: "xl" } }),
    col.accessor((f) => f.tanto.estatus, {
      id: "estatus",
      header: "Estatus",
      filterFn: "equalsString",
      cell: (c) => (
        <span className="flex flex-col items-start gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={c.getValue()} map={ESTATUS_TANTO} />
            {prestamoVencido(c.row.original.tanto, now) && <Badge variant="destructive">Vencido</Badge>}
          </span>
          {c.row.original.tanto.prestamo && <span className="text-xs text-muted-foreground xl:hidden">Hasta {fecha(c.row.original.tanto.prestamo.hasta)}</span>}
        </span>
      ),
      meta: {
        filter: { type: "select", options: (Object.keys(ESTATUS_TANTO) as EstatusTanto[]).map((e) => ({ value: e, label: ESTATUS_TANTO[e].label })) },
        exportValue: (v) => ESTATUS_TANTO[v as EstatusTanto].label,
      },
    }),
    col.accessor((f) => f.tanto.prestamo?.aQuien ?? "", {
      id: "prestamo",
      header: "Préstamo",
      cell: (c) => {
        const p = c.row.original.tanto.prestamo;
        return p ? (
          <span className="flex min-w-40 flex-col text-xs">
            <span className="text-sm whitespace-normal">{p.aQuien}</span>
            <span className="text-muted-foreground">
              {fecha(p.desde)} → {fecha(p.hasta)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      meta: { hideBelow: "xl" },
    }),
    col.display({
      id: "accion",
      header: "",
      enableSorting: false,
      cell: (c) => {
        const f = c.row.original;
        if (f.tanto.responsable === "Contraparte") return <span className="text-xs text-muted-foreground">Con la contraparte</span>;
        return f.tanto.estatus === "prestado" ? (
          <Button size="sm" variant="outline" onClick={() => devolver(f)}>
            Registrar devolución
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => prestar(f)}>
            Registrar préstamo
          </Button>
        );
      },
      meta: { align: "end" },
    }),
  ]);
}

export function CustodiaOriginales() {
  const hidratado = useContratosHydrated();
  const { actor } = useActorContratos();
  const contratos = useContratos((s) => s.contratos);
  const registrarDevolucion = useContratos((s) => s.registrarDevolucion);
  const now = useNow(60_000);
  const minuto = Math.floor(now.getTime() / 60_000);
  const [prestando, setPrestando] = useState<Prestando | null>(null);

  const filas = useMemo(() => filasCustodia(contratos), [contratos]);
  const vencidos = filas.filter((f) => prestamoVencido(f.tanto, now));
  const prestados = filas.filter((f) => f.tanto.estatus === "prestado").length;
  const cols = useMemo(
    () =>
      columnas({
        now: new Date(minuto * 60_000),
        prestar: (f) => setPrestando({ contrato: f.contrato, numero: f.tanto.numero }),
        devolver: (f) => {
          if (registrarDevolucion(f.contrato.id, f.tanto.numero, actor)) toast.success(`Original ${f.tanto.numero}/3 devuelto`, { description: `${f.contrato.folio} de vuelta en resguardo.` });
        },
      }),
    [minuto, registrarDevolucion, actor],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader title="Custodia de originales" description={`Tres tantos por contrato. ${prestados} prestados hoy.`} />
      {vencidos.length > 0 && (
        <GateBanner
          variant="bloqueado"
          title={vencidos.length === 1 ? "1 préstamo vencido" : `${vencidos.length} préstamos vencidos`}
          items={vencidos.map((f) => `${f.contrato.contraparte} · original ${f.tanto.numero}/3 · ${f.tanto.prestamo!.aQuien}, debía volver el ${fecha(f.tanto.prestamo!.hasta)}`)}
        />
      )}
      <DataGrid
        columns={cols}
        data={filas}
        loading={!hidratado}
        getRowId={(f) => `${f.contrato.id}-${f.tanto.numero}`}
        searchPlaceholder="Buscar por contrato, ubicación o persona"
        exportFileName="custodia-originales"
        emptyTitle="Sin originales"
        emptyDescription="Los contratos formalizados registran aquí sus tres tantos."
        initialPageSize={25}
      />
      <DialogoPrestamo prestando={prestando} actor={actor} onOpenChange={(o) => !o && setPrestando(null)} />
    </div>
  );
}
