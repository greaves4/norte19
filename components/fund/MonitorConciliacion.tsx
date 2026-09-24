"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Indicador } from "@/components/fund/Indicador";
import { MovimientoDetalle } from "@/components/fund/MovimientoDetalle";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressRunner, type RunnerStep } from "@/components/shared/ProgressRunner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TARJETA_DEMO_ID, hotelPorId } from "@/lib/fixtures/fund";
import { fechaHora, mxn } from "@/lib/format";
import { conciliar, contarPorEstatus, type FilaConciliacion } from "@/lib/sim/fund/conciliacion";
import { useFund } from "@/lib/store/fund";
import { ESTATUS_CONCILIACION, type EstatusConciliacion } from "@/lib/types/fund";

const col = dataGridColumns<FilaConciliacion>();

function registroSistema(f: FilaConciliacion) {
  if (!f.movimientoSistema) return "Sin registro en Fund";
  return f.movimientoSistema.tipo === "movimiento"
    ? f.movimientoSistema.movimiento.proveedor
    : `Fondeo ${f.movimientoSistema.fondeo.referencia}`;
}

const COLUMNAS = col.columns([
  col.accessor((f) => new Date(f.movimientoBanco.fecha), {
    id: "fecha",
    header: "Fecha",
    sortFn: "datetime",
    enableGlobalFilter: false,
    cell: (c) => <span className="whitespace-nowrap">{fechaHora(c.getValue())}</span>,
    meta: { hideBelow: "lg" },
  }),
  col.accessor((f) => f.movimientoBanco.referencia, { id: "referencia", header: "Referencia", cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>, meta: { hideBelow: "xl" } }),
  col.accessor((f) => f.movimientoBanco.concepto, {
    id: "banco",
    header: "Banco · Pay Connect",
    cell: (c) => (
      <span className="flex min-w-40 flex-col whitespace-normal">
        <span>{c.getValue()}</span>
        <span className="text-xs text-muted-foreground">{c.row.original.movimientoBanco.tipo === "cargo" ? "Cargo" : "Abono"}</span>
      </span>
    ),
  }),
  col.accessor((f) => f.movimientoBanco.monto, { id: "montoBanco", header: "Monto banco", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
  col.accessor((f) => registroSistema(f), {
    id: "sistema",
    header: "Registro en Fund",
    cell: (c) => <span className={c.row.original.movimientoSistema ? "line-clamp-2 min-w-40 whitespace-normal" : "text-muted-foreground"}>{c.getValue()}</span>,
  }),
  col.accessor((f) => f.montoSistema, {
    id: "montoSistema",
    header: "Monto sistema",
    cell: (c) => (c.getValue() === null ? "—" : mxn(c.getValue()!)),
    meta: { align: "end" },
  }),
  col.accessor((f) => f.diferencia, {
    id: "diferencia",
    header: "Diferencia",
    cell: (c) => {
      const d = c.getValue();
      return d === null || d === 0 ? <span className="text-muted-foreground">—</span> : <span className="font-medium">{`${d > 0 ? "+" : "−"}${mxn(Math.abs(d))}`}</span>;
    },
    meta: { align: "end", hideBelow: "lg" },
  }),
  col.accessor("estatus", {
    header: "Estatus",
    filterFn: "equalsString",
    cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_CONCILIACION} />,
    meta: {
      filter: {
        type: "select",
        options: (Object.keys(ESTATUS_CONCILIACION) as EstatusConciliacion[]).map((e) => ({ value: e, label: ESTATUS_CONCILIACION[e].label })),
      },
      exportValue: (v) => ESTATUS_CONCILIACION[v as EstatusConciliacion].label,
    },
  }),
]);

export function MonitorConciliacion() {
  const tarjetas = useFund((s) => s.tarjetas);
  const estadoCuenta = useFund((s) => s.estadoCuenta);
  const movimientos = useFund((s) => s.movimientos);
  const fondeos = useFund((s) => s.fondeos);
  const conciliacion = useFund((s) => s.conciliacion);
  const [tarjetaId, setTarjetaId] = useState(TARJETA_DEMO_ID);
  const [sincronizacion, setSincronizacion] = useState<{ id: number; pasos: RunnerStep[] } | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const detalle = useFund((s) => s.movimientos.find((m) => m.id === detalleId) ?? null);

  // Solo tarjetas con estado de cuenta en el periodo (Cancún y las que se fondearon en la demo).
  const opciones = useMemo(() => {
    const conMovimientos = new Set(estadoCuenta.map((b) => b.tarjetaId));
    return tarjetas
      .filter((t) => conMovimientos.has(t.id))
      .map((t) => ({ value: t.id, label: `${hotelPorId(t.hotelId)?.nombre} · •••• ${t.ultimosCuatro}` }));
  }, [tarjetas, estadoCuenta]);

  const filas = useMemo(() => conciliar(tarjetaId, estadoCuenta, movimientos, fondeos), [tarjetaId, estadoCuenta, movimientos, fondeos]);
  const conteo = contarPorEstatus(filas);
  const tarjeta = tarjetas.find((t) => t.id === tarjetaId);

  function sincronizar() {
    const problemas = filas.filter((f) => f.estatus !== "cuadrado");
    const token = tarjeta?.token.slice(0, 12) ?? "";
    const pasos: RunnerStep[] = [
      {
        id: "consulta",
        label: "Consultar estado de cuenta Pay Connect",
        durationMs: 1400,
        log: [`→ GET https://api.payconnect.mx/v2/cards/${token}…/statement?period=current`, `← 200 {"movements":${filas.length},"currency":"MXN"}`],
      },
      {
        id: "cruce",
        label: "Cruzar registros",
        durationMs: 1600,
        log: [`${filas.length} movimientos cruzados por referencia y monto contra Fund`, `${problemas.length} con diferencia antes de sincronizar`],
      },
      {
        id: "resultado",
        label: "Resultado",
        durationMs: 700,
        log: problemas.map((p) =>
          p.estatus === "sin_registro"
            ? `Vinculado: cargo ${p.movimientoBanco.referencia} de ${p.movimientoBanco.concepto} (Pay Connect confirmó la referencia)`
            : `Sigue sin cuadrar: ${p.movimientoBanco.concepto}, diferencia ${mxn(Math.abs(p.diferencia ?? 0))}`,
        ),
      },
    ];
    setCorriendo(true);
    setSincronizacion({ id: Date.now(), pasos });
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Monitor de conciliación"
        description="Estado de cuenta Pay Connect contra los registros de Fund. Sincronización automática diaria a las 06:00; esta es la ejecución manual de respaldo."
        actions={
          <Button onClick={sincronizar} disabled={corriendo}>
            <RefreshCw data-icon="inline-start" />
            Sincronizar ahora
          </Button>
        }
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="tarjeta-conciliacion">Tarjeta</Label>
        <Select items={opciones} value={tarjetaId} onValueChange={(v) => v && (setTarjetaId(v as string), setSincronizacion(null), setCorriendo(false))}>
          <SelectTrigger id="tarjeta-conciliacion" className="w-full sm:w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <Indicador etiqueta="Cuadrados" valor={conteo.cuadrado} />
        </li>
        <li>
          <Indicador etiqueta="No cuadrados" valor={conteo.no_cuadrado} nota="Monto distinto entre banco y Fund" />
        </li>
        <li>
          <Indicador etiqueta="Sin registro" valor={conteo.sin_registro} nota="Cargo sin movimiento vinculado" />
        </li>
        <li>
          <Indicador
            etiqueta="Última sincronización"
            valor={<span className="text-base">{conciliacion.ultimaSincronizacion ? fechaHora(conciliacion.ultimaSincronizacion) : "Hoy 06:00"}</span>}
            nota={conciliacion.ultimaSincronizacion ? "Manual" : "Automática"}
          />
        </li>
      </ul>

      {sincronizacion && (
        <ProgressRunner
          key={sincronizacion.id}
          title="Sincronización manual"
          autoStart
          steps={sincronizacion.pasos}
          onDone={() => {
            setCorriendo(false);
            useFund.getState().sincronizarConciliacion();
            toast.success("Conciliación actualizada", { description: "Se vincularon los cargos confirmados por Pay Connect." });
          }}
        />
      )}

      <DataGrid
        columns={COLUMNAS}
        data={filas}
        getRowId={(f) => f.id}
        // Discrepancias arriba (sin registro, no cuadrado), luego por fecha.
        initialSorting={[
          { id: "estatus", desc: true },
          { id: "fecha", desc: true },
        ]}
        onRowClick={(f) => f.movimientoSistema?.tipo === "movimiento" && setDetalleId(f.movimientoSistema.movimiento.id)}
        searchPlaceholder="Buscar concepto o referencia"
        exportFileName={`conciliacion-${tarjeta?.ultimosCuatro ?? ""}`}
        emptyTitle="Sin movimientos bancarios"
        emptyDescription="Esta tarjeta no tiene movimientos en el estado de cuenta del periodo."
      />

      <MovimientoDetalle movimiento={detalle} onOpenChange={(open) => !open && setDetalleId(null)} />
    </div>
  );
}
