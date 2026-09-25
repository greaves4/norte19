"use client";

import { differenceInCalendarDays, subDays } from "date-fns";
import { CalendarCog, FileSpreadsheet, Lock, LockOpen, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DialogoCargaMasiva } from "@/components/fund/DialogoCargaMasiva";
import { DialogoCorteGlobal } from "@/components/fund/DialogoCorteGlobal";
import { DialogoDispersion } from "@/components/fund/DialogoDispersion";
import { DialogoRefondeo } from "@/components/fund/DialogoRefondeo";
import { Indicador } from "@/components/shared/Indicador";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNow } from "@/lib/demo";
import { CUENTAS_FONDEADORAS, hotelPorId } from "@/lib/fixtures/fund";
import { fecha, mxn } from "@/lib/format";
import { dispersarLote, type DispersionEnCurso } from "@/lib/sim/fund/payconnect";
import { aprobadosDelCorte, proximoCorte } from "@/lib/sim/fund/refondeo";
import { useFund } from "@/lib/store/fund";
import { ESTATUS_TARJETA, NOMBRE_CORTE, type Corte, type EstatusTarjeta, type Movimiento, type Tarjeta } from "@/lib/types/fund";

type Fila = Tarjeta & {
  hotel: string;
  ciudad: string;
  cuenta: string;
  aprobadosCorte: number;
  excepciones: number;
};

const col = dataGridColumns<Fila>();

function columnas(onBloquear: (t: Fila) => void) {
  return col.columns([
    col.accessor("hotel", {
      header: "Hotel",
      cell: (c) => (
        <span className="flex min-w-36 flex-col whitespace-normal">
          <span>{c.getValue()}</span>
          <span className="text-xs text-muted-foreground">{c.row.original.ciudad}</span>
        </span>
      ),
    }),
    col.accessor("ultimosCuatro", {
      header: "Tarjeta",
      cell: (c) => <span className="whitespace-nowrap tabular-nums">•••• {c.getValue()}</span>,
      meta: { exportValue: (v) => `•••• ${v}` },
    }),
    col.accessor("cuenta", { header: "Cuenta fondeadora", meta: { hideBelow: "xl" } }),
    col.accessor("presupuesto", { header: "Presupuesto", cell: (c) => mxn(c.getValue()), meta: { align: "end", hideBelow: "xl" } }),
    col.accessor("saldo", { header: "Saldo", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
    col.accessor("aprobadosCorte", { header: "Aprobado del corte", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
    col.accessor((t) => (t.ultimoFondeo ? new Date(t.ultimoFondeo) : null), {
      id: "ultimoFondeo",
      header: "Último fondeo",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap">{c.getValue() ? fecha(c.getValue()!) : "—"}</span>,
      meta: { hideBelow: "xl" },
    }),
    col.accessor("corte", {
      header: "Corte",
      filterFn: "equalsString",
      cell: (c) => NOMBRE_CORTE[c.getValue()],
      meta: {
        hideBelow: "xl",
        filter: { type: "select", options: (Object.keys(NOMBRE_CORTE) as Corte[]).map((k) => ({ value: k, label: NOMBRE_CORTE[k] })) },
        exportValue: (v) => NOMBRE_CORTE[v as Corte],
      },
    }),
    col.accessor("estatus", {
      header: "Estatus",
      filterFn: "equalsString",
      cell: (c) => (
        <span className="flex flex-wrap items-center gap-1">
          <StatusBadge status={c.getValue()} map={ESTATUS_TARJETA} />
          {c.row.original.excepciones > 0 && (
            <Badge variant="outline" title="Excepciones de categoría por autorizar">
              {c.row.original.excepciones} excepción{c.row.original.excepciones > 1 ? "es" : ""}
            </Badge>
          )}
        </span>
      ),
      meta: {
        filter: { type: "select", options: (Object.keys(ESTATUS_TARJETA) as EstatusTarjeta[]).map((k) => ({ value: k, label: ESTATUS_TARJETA[k].label })) },
        exportValue: (v) => ESTATUS_TARJETA[v as EstatusTarjeta].label,
      },
    }),
    col.display({
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: (c) => {
        const bloqueada = c.row.original.estatus === "bloqueada";
        return (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${bloqueada ? "Desbloquear" : "Bloquear"} tarjeta de ${c.row.original.hotel}`}
            title={bloqueada ? "Desbloquear tarjeta" : "Bloquear tarjeta"}
            onClick={(e) => {
              e.stopPropagation();
              onBloquear(c.row.original);
            }}
          >
            {bloqueada ? <LockOpen /> : <Lock />}
            {/* En tablet solo el ícono para que la acción quede a la vista. */}
            <span className="hidden xl:inline">{bloqueada ? "Desbloquear" : "Bloquear"}</span>
          </Button>
        );
      },
    }),
  ]);
}

function aFila(t: Tarjeta, movimientos: Movimiento[]): Fila {
  const hotel = hotelPorId(t.hotelId);
  const cuenta = CUENTAS_FONDEADORAS.find((c) => c.id === t.cuentaFondeadoraId);
  return {
    ...t,
    hotel: hotel?.nombre ?? t.hotelId,
    ciudad: hotel?.ciudad ?? "",
    cuenta: cuenta ? `${cuenta.banco} · ${cuenta.alias}` : t.cuentaFondeadoraId,
    aprobadosCorte: aprobadosDelCorte(t, movimientos),
    excepciones: movimientos.filter((m) => m.tarjetaId === t.id && m.excepcionSolicitada?.estatus === "pendiente").length,
  };
}

export function PanelTesoreria() {
  const router = useRouter();
  const now = useNow(60_000);
  const tarjetas = useFund((s) => s.tarjetas);
  const movimientos = useFund((s) => s.movimientos);
  const fondeos = useFund((s) => s.fondeos);

  const [refondeo, setRefondeo] = useState<Tarjeta[] | null>(null);
  const [dispersion, setDispersion] = useState<DispersionEnCurso | null>(null);
  const [carga, setCarga] = useState(false);
  const [corteGlobal, setCorteGlobal] = useState(false);

  const filas = useMemo(() => tarjetas.map((t) => aFila(t, movimientos)), [tarjetas, movimientos]);
  const cols = useMemo(
    () =>
      columnas((t) => {
        const bloquear = t.estatus !== "bloqueada";
        useFund.getState().bloquearTarjeta(t.id, bloquear);
        toast.success(bloquear ? "Tarjeta bloqueada" : "Tarjeta desbloqueada", {
          description: `${t.hotel} · •••• ${t.ultimosCuatro}${bloquear ? ". El hotel no podrá registrar movimientos." : ""}`,
        });
      }),
    [],
  );

  const hace30 = subDays(now, 30).toISOString();
  const dispersado30 = fondeos.filter((f) => f.estatus === "depositado" && f.fecha >= hace30).reduce((s, f) => s + f.monto, 0);
  const activas = tarjetas.filter((t) => t.estatus === "activa").length;
  const proximos = tarjetas.filter((t) => {
    const p = proximoCorte(t, now);
    return p !== null && differenceInCalendarDays(p, now) <= 3;
  });
  const excepciones = filas.reduce((s, f) => s + f.excepciones, 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Panel de tarjetas" description="Tarjetas corporativas de caja chica, saldos, re-fondeos y excepciones." />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <Indicador etiqueta="Dispersado en 30 días" valor={mxn(dispersado30)} />
        </li>
        <li>
          <Indicador etiqueta="Hoteles" valor={tarjetas.length} nota={`${activas} tarjetas activas · ${tarjetas.length - activas} bloqueadas`} />
        </li>
        <li>
          <Indicador etiqueta="Cortes en los próximos 3 días" valor={proximos.length} nota={proximos.slice(0, 2).map((t) => hotelPorId(t.hotelId)?.ciudad).join(", ") || "Ninguno"} />
        </li>
        <li>
          <Indicador etiqueta="Excepciones por autorizar" valor={excepciones} nota="Abre la tarjeta para resolverlas" />
        </li>
      </ul>

      <DataGrid
        columns={cols}
        data={filas}
        getRowId={(t) => t.id}
        selectable
        initialPageSize={25}
        onRowClick={(t) => router.push(`/fund/tesoreria/panel/${t.id}`)}
        searchPlaceholder="Buscar hotel, ciudad o tarjeta"
        exportFileName="tarjetas-fund"
        actions={(seleccionadas) => (
          <>
            <Button size="sm" disabled={seleccionadas.length === 0} onClick={() => setRefondeo(seleccionadas)}>
              <RefreshCw data-icon="inline-start" />
              Re-fondeo automático{seleccionadas.length > 0 ? ` (${seleccionadas.length})` : ""}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCarga(true)}>
              <FileSpreadsheet data-icon="inline-start" />
              Carga masiva
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCorteGlobal(true)}>
              <CalendarCog data-icon="inline-start" />
              Corte global
            </Button>
          </>
        )}
      />

      <DialogoRefondeo
        tarjetas={refondeo}
        onOpenChange={(open) => !open && setRefondeo(null)}
        onConfirmar={(items) => setDispersion(dispersarLote(items, "automatico"))}
      />
      <DialogoDispersion dispersion={dispersion} onClose={() => setDispersion(null)} />
      <DialogoCargaMasiva open={carga} onOpenChange={setCarga} />
      <DialogoCorteGlobal open={corteGlobal} onOpenChange={setCorteGlobal} />
    </div>
  );
}
