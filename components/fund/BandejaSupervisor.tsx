"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Indicador } from "@/components/fund/Indicador";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNow } from "@/lib/demo";
import { CENTROS_COSTOS, hotelPorId, nombreCentroCostos, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { duracionCorta, fechaHora, mxn } from "@/lib/format";
import { aprobadosEnDia, enBandeja, llegadaABandeja, promedioHorasAprobacion } from "@/lib/sim/fund/supervision";
import { esperaAutorizacion, useFund } from "@/lib/store/fund";
import type { Movimiento } from "@/lib/types/fund";

const SUPERVISOR = USUARIOS_DEMO.supervisor;
const HOTEL_ID = SUPERVISOR.hotelId!;
const col = dataGridColumns<Movimiento>();

function columnas(now: Date) {
  return col.columns([
    col.accessor((m) => llegadaABandeja(m), {
      id: "llegada",
      header: "Fecha",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap">{fechaHora(c.getValue())}</span>,
      meta: { hideOnMobile: true },
    }),
    col.accessor("registradoPor", { header: "Registró", meta: { hideBelow: "xl" } }),
    col.accessor("proveedor", {
      header: "Proveedor",
      cell: (c) => (
        <span className="flex min-w-0 flex-col gap-1 md:min-w-40">
          <span className="line-clamp-2 whitespace-normal">{c.getValue()}</span>
          {esperaAutorizacion(c.row.original) && (
            <Badge variant="outline" className="w-fit">
              Fuera de ventana · autorización
            </Badge>
          )}
          {c.row.original.excepcionSolicitada?.estatus === "aprobada" && (
            <Badge variant="outline" className="w-fit">
              Excepción aprobada
            </Badge>
          )}
        </span>
      ),
    }),
    col.accessor((m) => m.conceptos[0]?.descripcion ?? "", {
      id: "concepto",
      header: "Concepto",
      cell: (c) => <span className="line-clamp-2 min-w-44 whitespace-normal">{c.getValue()}</span>,
      meta: { hideBelow: "xl" },
    }),
    col.accessor("centroCostos", {
      header: "Centro de costos",
      filterFn: "equalsString",
      cell: (c) => nombreCentroCostos(c.getValue()),
      meta: {
        hideBelow: "lg",
        filter: { type: "select", options: CENTROS_COSTOS.map((c) => ({ value: c.id, label: c.nombre })) },
        exportValue: (v) => nombreCentroCostos(String(v)),
      },
    }),
    col.accessor("total", { header: "Monto", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
    // Se recalcula con el reloj de demo: con x60 o x1440 se ve crecer.
    col.accessor((m) => now.getTime() - llegadaABandeja(m).getTime(), {
      id: "espera",
      header: "En bandeja",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap tabular-nums">{duracionCorta(c.getValue())}</span>,
      meta: { align: "end", label: "Horas en bandeja", exportValue: (v) => Math.round((Number(v) / 3_600_000) * 10) / 10 },
    }),
  ]);
}

export function BandejaSupervisor() {
  const router = useRouter();
  const now = useNow(30_000);
  const todos = useFund((s) => s.movimientos);
  const [porAprobar, setPorAprobar] = useState<Movimiento[] | null>(null);

  const delHotel = useMemo(() => todos.filter((m) => m.hotelId === HOTEL_ID), [todos]);
  const bandeja = useMemo(() => delHotel.filter(enBandeja), [delHotel]);
  const cols = useMemo(() => columnas(now), [now]);
  const promedio = promedioHorasAprobacion(delHotel);

  // Precarga el visor y las revisiones: el RFP pide que el documento se vea en 3 s o menos.
  useEffect(() => {
    void import("@/components/shared/DocumentViewer");
    void fetch("/pdf.worker.min.mjs");
    bandeja.forEach((m) => router.prefetch(`/fund/supervisor/bandeja/${m.id}`));
  }, [bandeja, router]);

  function aprobarLote(movimientos: Movimiento[]) {
    const store = useFund.getState();
    const aprobados = movimientos.filter((m) =>
      esperaAutorizacion(m) ? store.autorizarExtemporaneo(m.id, SUPERVISOR.nombre) : store.aprobar(m.id, SUPERVISOR.nombre),
    );
    const total = aprobados.reduce((s, m) => s + m.total, 0);
    toast.success(`${aprobados.length} ${aprobados.length === 1 ? "movimiento aprobado" : "movimientos aprobados"}`, {
      description: `Total ${mxn(total)}`,
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Bandeja de supervisión" description={`${hotelPorId(HOTEL_ID)?.nombre} · ${SUPERVISOR.nombre}`} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <Indicador etiqueta="Pendientes" valor={bandeja.length} />
        </li>
        <li>
          <Indicador etiqueta="Aprobados hoy" valor={aprobadosEnDia(delHotel, now)} />
        </li>
        <li>
          <Indicador etiqueta="Rechazados" valor={delHotel.filter((m) => m.estatus === "rechazado").length} nota="Sin autorizar" />
        </li>
        <li>
          <Indicador
            etiqueta="Tiempo promedio de aprobación"
            valor={promedio === null ? "–" : `${promedio.toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`}
            nota="Desde que llega a la bandeja"
          />
        </li>
      </ul>

      <DataGrid
        columns={cols}
        data={bandeja}
        getRowId={(m) => m.id}
        initialSorting={[{ id: "espera", desc: true }]}
        selectable
        onRowClick={(m) => router.push(`/fund/supervisor/bandeja/${m.id}`)}
        searchPlaceholder="Buscar proveedor, concepto o quién registró"
        exportFileName="bandeja-supervision"
        emptyTitle="Sin pendientes"
        emptyDescription="Los movimientos que envíe Recepción aparecerán aquí."
        actions={(seleccionados) => (
          <Button size="sm" disabled={seleccionados.length === 0} onClick={() => setPorAprobar(seleccionados)}>
            <CheckCheck data-icon="inline-start" />
            Aprobar seleccionados{seleccionados.length > 0 ? ` (${seleccionados.length})` : ""}
          </Button>
        )}
      />

      <AlertDialog open={porAprobar !== null} onOpenChange={(open) => !open && setPorAprobar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Aprobar {porAprobar?.length} {porAprobar?.length === 1 ? "movimiento" : "movimientos"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Total {mxn((porAprobar ?? []).reduce((s, m) => s + m.total, 0))}. Cada aprobación queda en el historial del movimiento con tu nombre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (porAprobar) aprobarLote(porAprobar);
                setPorAprobar(null);
              }}
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
