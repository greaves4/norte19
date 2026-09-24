"use client";

import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DialogoJustificacion } from "@/components/shared/DialogoJustificacion";
import { MovimientoDetalle } from "@/components/fund/MovimientoDetalle";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { fechaHora, mxn } from "@/lib/format";
import { useFund } from "@/lib/store/fund";
import type { Movimiento } from "@/lib/types/fund";

const SUPERVISOR = USUARIOS_DEMO.supervisor;
const col = dataGridColumns<Movimiento>();

function fechaRechazo(m: Movimiento) {
  const ev = [...m.timeline].reverse().find((e) => e.tipo === "rechazado");
  return new Date(ev?.fecha ?? m.fecha);
}

function actorRechazo(m: Movimiento) {
  return [...m.timeline].reverse().find((e) => e.tipo === "rechazado")?.actor ?? "";
}

export function RechazadosSupervisor() {
  const todos = useFund((s) => s.movimientos);
  const [autorizarId, setAutorizarId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const porAutorizar = useFund((s) => s.movimientos.find((m) => m.id === autorizarId) ?? null);
  const detalle = useFund((s) => s.movimientos.find((m) => m.id === detalleId) ?? null);

  // Los rechazos de excepción de categoría los decide Tesorería; no se autorizan aquí.
  const rechazados = useMemo(
    () => todos.filter((m) => m.hotelId === SUPERVISOR.hotelId && m.estatus === "rechazado" && m.excepcionSolicitada?.estatus !== "rechazada"),
    [todos],
  );

  const columnas = useMemo(
    () =>
      col.columns([
        col.accessor((m) => fechaRechazo(m), {
          id: "rechazo",
          header: "Rechazado",
          sortFn: "datetime",
          enableGlobalFilter: false,
          cell: (c) => <span className="whitespace-nowrap">{fechaHora(c.getValue())}</span>,
          meta: { hideOnMobile: true },
        }),
        col.accessor("proveedor", { header: "Proveedor", cell: (c) => <span className="line-clamp-2 min-w-36 whitespace-normal">{c.getValue()}</span> }),
        col.accessor("total", { header: "Monto", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
        col.accessor((m) => m.motivoRechazo ?? "", {
          id: "motivo",
          header: "Justificación del rechazo",
          cell: (c) => <span className="line-clamp-3 min-w-56 whitespace-normal">{c.getValue()}</span>,
          meta: { hideBelow: "lg" },
        }),
        col.accessor((m) => actorRechazo(m), { id: "actor", header: "Rechazó", meta: { hideBelow: "xl" } }),
        col.display({
          id: "accion",
          header: "",
          enableSorting: false,
          cell: (c) => (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setAutorizarId(c.row.original.id);
              }}
            >
              <ShieldCheck data-icon="inline-start" />
              Autorizar
            </Button>
          ),
        }),
      ]),
    [],
  );

  function autorizar(motivo: string) {
    if (!porAutorizar) return;
    if (useFund.getState().autorizarRechazado(porAutorizar.id, SUPERVISOR.nombre, motivo)) {
      toast.success("Movimiento autorizado", { description: `${porAutorizar.proveedor} · ${mxn(porAutorizar.total)}. Cuenta para el re-fondeo.` });
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Rechazados"
        description="Un movimiento rechazado se puede autorizar con una segunda justificación; así cuenta para el re-fondeo."
      />
      <DataGrid
        columns={columnas}
        data={rechazados}
        getRowId={(m) => m.id}
        initialSorting={[{ id: "rechazo", desc: true }]}
        onRowClick={(m) => setDetalleId(m.id)}
        searchPlaceholder="Buscar proveedor o justificación"
        exportFileName="rechazados"
        emptyTitle="Sin rechazados por autorizar"
        emptyDescription="Los movimientos que rechaces aparecerán aquí."
      />
      <DialogoJustificacion
        open={porAutorizar !== null}
        onOpenChange={(open) => !open && setAutorizarId(null)}
        titulo="Autorizar movimiento rechazado"
        descripcion={
          porAutorizar ? (
            <>
              {porAutorizar.proveedor} · {mxn(porAutorizar.total)}. Motivo del rechazo: {porAutorizar.motivoRechazo}
            </>
          ) : null
        }
        etiqueta="Justificación de la autorización"
        accion="Autorizar"
        onConfirmar={autorizar}
      />
      <MovimientoDetalle movimiento={detalle} onOpenChange={(open) => !open && setDetalleId(null)} />
    </div>
  );
}
