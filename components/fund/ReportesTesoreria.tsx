"use client";

import { endOfDay, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { GraficaBarras } from "@/components/shared/GraficaBarras";
import { Indicador } from "@/components/shared/Indicador";
import { MovimientoDetalle } from "@/components/fund/MovimientoDetalle";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/lib/demo";
import { CENTROS_COSTOS, HOTELES, hotelPorId, nombreCentroCostos } from "@/lib/fixtures/fund";
import { fecha, mxn } from "@/lib/format";
import { fondeosPorMes, gastoPorCentro, matrizCentros, slaPorHotel, type FilaCentros, type FilaFondeos, type FilaSla } from "@/lib/sim/fund/reportes";
import { promedioHorasAprobacion } from "@/lib/sim/fund/supervision";
import { useFund } from "@/lib/store/fund";
import { ESTATUS_MOVIMIENTO, type EstatusMovimiento, type Movimiento } from "@/lib/types/fund";

const TODOS = "todos";
const HOTELES_ITEMS = [{ value: TODOS, label: "Todos los hoteles" }, ...HOTELES.map((h) => ({ value: h.id, label: h.nombre }))];

function corto(nombre: string) {
  return nombre.replace(/^City Express\s+/, "");
}

function horas(h: number | null) {
  return h === null ? "—" : `${h.toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`;
}

export function ReportesTesoreria() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Reportes" description="Se calculan con los datos actuales: lo que se registra o aprueba en la demo aparece aquí." />
      <Tabs defaultValue="general" className="flex flex-col gap-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Reporte general</TabsTrigger>
          <TabsTrigger value="sla">SLA de aprobación</TabsTrigger>
          <TabsTrigger value="centros">Gastos por centro de costos</TabsTrigger>
          <TabsTrigger value="fondeos">Historial de fondeos</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <ReporteGeneral />
        </TabsContent>
        <TabsContent value="sla">
          <ReporteSla />
        </TabsContent>
        <TabsContent value="centros">
          <ReporteCentros />
        </TabsContent>
        <TabsContent value="fondeos">
          <ReporteFondeos />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reporte general

const colMov = dataGridColumns<Movimiento>();
const COLUMNAS_GENERAL = colMov.columns([
  colMov.accessor((m) => new Date(m.fecha), {
    id: "fecha",
    header: "Fecha",
    sortFn: "datetime",
    enableGlobalFilter: false,
    cell: (c) => <span className="whitespace-nowrap">{fecha(c.getValue())}</span>,
  }),
  colMov.accessor((m) => hotelPorId(m.hotelId)?.nombre ?? m.hotelId, {
    id: "hotel",
    header: "Hotel",
    cell: (c) => <span className="line-clamp-2 min-w-36 whitespace-normal">{corto(c.getValue())}</span>,
  }),
  colMov.accessor("proveedor", {
    header: "Proveedor",
    cell: (c) => <span className="line-clamp-2 min-w-40 whitespace-normal">{c.getValue()}</span>,
    meta: { filter: { type: "text" } },
  }),
  colMov.accessor((m) => m.conceptos[0]?.descripcion ?? "", {
    id: "concepto",
    header: "Concepto",
    cell: (c) => <span className="line-clamp-2 min-w-44 whitespace-normal">{c.getValue()}</span>,
    meta: { hideBelow: "xl" },
  }),
  colMov.accessor("centroCostos", {
    header: "Centro de costos",
    filterFn: "equalsString",
    cell: (c) => nombreCentroCostos(c.getValue()),
    meta: {
      filter: { type: "select", options: CENTROS_COSTOS.map((c) => ({ value: c.id, label: c.nombre })) },
      exportValue: (v) => nombreCentroCostos(String(v)),
      hideBelow: "lg",
    },
  }),
  colMov.accessor("total", { header: "Monto", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
  colMov.accessor("estatus", {
    header: "Estatus",
    filterFn: "equalsString",
    cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_MOVIMIENTO} />,
    meta: {
      filter: { type: "select", options: (Object.keys(ESTATUS_MOVIMIENTO) as EstatusMovimiento[]).map((e) => ({ value: e, label: ESTATUS_MOVIMIENTO[e].label })) },
      exportValue: (v) => ESTATUS_MOVIMIENTO[v as EstatusMovimiento].label,
    },
  }),
]);

function ReporteGeneral() {
  const movimientos = useFund((s) => s.movimientos);
  const [hotel, setHotel] = useState(TODOS);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const detalle = useFund((s) => s.movimientos.find((m) => m.id === detalleId) ?? null);

  const filtrados = useMemo(() => {
    const inicio = desde ? startOfDay(new Date(`${desde}T00:00:00`)).toISOString() : null;
    const fin = hasta ? endOfDay(new Date(`${hasta}T00:00:00`)).toISOString() : null;
    return movimientos.filter((m) => (hotel === TODOS || m.hotelId === hotel) && (!inicio || m.fecha >= inicio) && (!fin || m.fecha <= fin));
  }, [movimientos, hotel, desde, hasta]);
  const total = filtrados.reduce((s, m) => s + m.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rg-hotel">Hotel</Label>
          <Select items={HOTELES_ITEMS} value={hotel} onValueChange={(v) => v && setHotel(v as string)}>
            <SelectTrigger id="rg-hotel" className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOTELES_ITEMS.map((h) => (
                <SelectItem key={h.value} value={h.value}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rg-desde">Desde</Label>
          <Input id="rg-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rg-hasta">Hasta</Label>
          <Input id="rg-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </div>
        {(hotel !== TODOS || desde || hasta) && (
          <Button variant="ghost" size="sm" onClick={() => (setHotel(TODOS), setDesde(""), setHasta(""))}>
            Quitar filtros
          </Button>
        )}
        <p className="ml-auto text-sm text-muted-foreground">
          {filtrados.length} movimientos · <span className="font-medium text-foreground tabular-nums">{mxn(total)}</span>
        </p>
      </div>
      <DataGrid
        columns={COLUMNAS_GENERAL}
        data={filtrados}
        getRowId={(m) => m.id}
        initialSorting={[{ id: "fecha", desc: true }]}
        initialPageSize={25}
        onRowClick={(m) => setDetalleId(m.id)}
        searchPlaceholder="Buscar hotel, proveedor o concepto"
        exportFileName="reporte-general-fund"
      />
      <MovimientoDetalle movimiento={detalle} onOpenChange={(open) => !open && setDetalleId(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SLA de aprobación

const colSla = dataGridColumns<FilaSla>();
const COLUMNAS_SLA = colSla.columns([
  colSla.accessor("hotel", { header: "Hotel", cell: (c) => corto(c.getValue()) }),
  colSla.accessor("supervisor", { header: "Supervisor" }),
  colSla.accessor("aprobados", { header: "Aprobados", meta: { align: "end" } }),
  colSla.accessor("promedioHoras", { header: "Promedio", cell: (c) => horas(c.getValue()), meta: { align: "end", label: "Promedio (h)" } }),
  colSla.accessor("maximoHoras", { header: "Máximo", cell: (c) => horas(c.getValue()), meta: { align: "end", label: "Máximo (h)", hideBelow: "lg" } }),
]);

function ReporteSla() {
  const movimientos = useFund((s) => s.movimientos);
  const filas = useMemo(() => slaPorHotel(movimientos), [movimientos]);
  const general = promedioHorasAprobacion(movimientos);
  const conDatos = filas.filter((f) => f.promedioHoras !== null);
  const masLento = conDatos[0];
  const masRapido = conDatos.at(-1);

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li>
          <Indicador etiqueta="Promedio general" valor={horas(general === null ? null : Math.round(general * 10) / 10)} nota="De la llegada a la bandeja a la aprobación" />
        </li>
        <li>
          <Indicador etiqueta="Más rápido" valor={horas(masRapido?.promedioHoras ?? null)} nota={masRapido ? `${corto(masRapido.hotel)} · ${masRapido.supervisor}` : undefined} />
        </li>
        <li>
          <Indicador etiqueta="Más lento" valor={horas(masLento?.promedioHoras ?? null)} nota={masLento ? `${corto(masLento.hotel)} · ${masLento.supervisor}` : undefined} />
        </li>
      </ul>
      <Card>
        <CardHeader>
          <CardTitle>Horas promedio de aprobación por hotel</CardTitle>
          <CardDescription>Desde que el movimiento llega a la bandeja hasta que el supervisor lo aprueba.</CardDescription>
        </CardHeader>
        <CardContent>
          <GraficaBarras
            datos={conDatos.map((f) => ({ etiqueta: corto(f.hotel), valor: f.promedioHoras! }))}
            formato={(v) => horas(v)}
            medida="Promedio"
            ariaLabel="Horas promedio de aprobación por hotel; el detalle está en la tabla"
          />
        </CardContent>
      </Card>
      <DataGrid columns={COLUMNAS_SLA} data={filas} getRowId={(f) => f.hotelId} initialPageSize={25} searchPlaceholder="Buscar hotel o supervisor" exportFileName="sla-aprobacion" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gastos por centro de costos

const colCentros = dataGridColumns<FilaCentros>();
const COLUMNAS_CENTROS = colCentros.columns([
  colCentros.accessor("hotel", { header: "Hotel", cell: (c) => <span className="min-w-36 whitespace-normal">{corto(c.getValue())}</span> }),
  ...CENTROS_COSTOS.map((centro) =>
    colCentros.accessor((f) => Number(f[centro.id] ?? 0), {
      id: centro.id,
      header: centro.nombre,
      cell: (c) => (c.getValue() ? mxn(c.getValue()) : <span className="text-muted-foreground">—</span>),
      meta: { align: "end", label: centro.nombre },
    }),
  ),
  colCentros.accessor("total", { header: "Total", cell: (c) => <span className="font-medium">{mxn(c.getValue())}</span>, meta: { align: "end" } }),
]);

function ReporteCentros() {
  const movimientos = useFund((s) => s.movimientos);
  const [hotel, setHotel] = useState(TODOS);
  const datos = useMemo(() => gastoPorCentro(movimientos, hotel === TODOS ? null : hotel), [movimientos, hotel]);
  const matriz = useMemo(() => matrizCentros(movimientos), [movimientos]);
  const total = datos.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Gasto aprobado por centro de costos</CardTitle>
          <CardDescription>Movimientos aprobados y autorizados. Total {mxn(total)}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rc-hotel">Hotel</Label>
            <Select items={HOTELES_ITEMS} value={hotel} onValueChange={(v) => v && setHotel(v as string)}>
              <SelectTrigger id="rc-hotel" className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOTELES_ITEMS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <GraficaBarras
            datos={datos.map((d) => ({ etiqueta: d.nombre, valor: d.total }))}
            formato={(v) => mxn(v)}
            formatoEje={(v) => `$${v.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
            medida="Gasto"
            anchoEtiquetas={150}
            ariaLabel="Gasto aprobado por centro de costos; el detalle por hotel está en la tabla"
          />
        </CardContent>
      </Card>
      <DataGrid
        columns={COLUMNAS_CENTROS}
        data={matriz}
        getRowId={(f) => f.hotelId}
        initialSorting={[{ id: "total", desc: true }]}
        initialPageSize={25}
        searchPlaceholder="Buscar hotel"
        exportFileName="gasto-por-centro-de-costos"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Historial de fondeos

function ReporteFondeos() {
  const fondeos = useFund((s) => s.fondeos);
  const now = useNow(60_000);
  const { meses, filas } = useMemo(() => fondeosPorMes(fondeos, now), [fondeos, now]);
  const columnas = useMemo(() => {
    const col = dataGridColumns<FilaFondeos>();
    return col.columns([
      col.accessor("hotel", { header: "Hotel", cell: (c) => <span className="min-w-36 whitespace-normal">{corto(c.getValue())}</span> }),
      ...meses.map((m) =>
        col.accessor((f) => f.porMes[m.clave] ?? 0, {
          id: m.clave,
          header: m.etiqueta,
          cell: (c) => (c.getValue() ? mxn(c.getValue()) : <span className="text-muted-foreground">—</span>),
          meta: { align: "end", label: m.etiqueta },
        }),
      ),
      col.accessor("cantidad", { header: "Fondeos", meta: { align: "end", hideBelow: "lg" } }),
      col.accessor("total", { header: "Total", cell: (c) => <span className="font-medium">{mxn(c.getValue())}</span>, meta: { align: "end" } }),
    ]);
  }, [meses]);
  const totales = meses.map((m) => filas.reduce((s, f) => s + (f.porMes[m.clave] ?? 0), 0));

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {meses.map((m, i) => (
          <li key={m.clave}>
            <Indicador etiqueta={`Dispersado en ${m.etiqueta}`} valor={mxn(totales[i])} nota={i === meses.length - 1 ? "Mes en curso" : undefined} />
          </li>
        ))}
      </ul>
      <DataGrid
        columns={columnas}
        data={filas}
        getRowId={(f) => f.hotelId}
        initialSorting={[{ id: "total", desc: true }]}
        initialPageSize={25}
        searchPlaceholder="Buscar hotel"
        exportFileName="historial-de-fondeos"
      />
    </div>
  );
}
