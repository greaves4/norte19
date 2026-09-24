"use client";

import { differenceInCalendarDays } from "date-fns";
import { ArrowLeft, Lock, LockOpen, Search, Send } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DialogoDispersion } from "@/components/fund/DialogoDispersion";
import { MovimientosGrid } from "@/components/fund/MovimientosGrid";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNow } from "@/lib/demo";
import { CATEGORIAS, categoriaPorId, CUENTAS_FONDEADORAS, hotelPorId } from "@/lib/fixtures/fund";
import { fecha, fechaHora, mxn } from "@/lib/format";
import { dispersar, type DispersionEnCurso } from "@/lib/sim/fund/payconnect";
import { calcularRefondeo, movimientosDelCorte, NOTA_FORMULA, proximoCorte } from "@/lib/sim/fund/refondeo";
import { useFund } from "@/lib/store/fund";
import {
  ESTATUS_FONDEO,
  ESTATUS_TARJETA,
  NOMBRE_CORTE,
  NOMBRE_TIPO_FONDEO,
  type Corte,
  type EstatusFondeo,
  type Fondeo,
  type Tarjeta,
  type TipoFondeo,
} from "@/lib/types/fund";

const CORTES = (Object.keys(NOMBRE_CORTE) as Corte[]).map((c) => ({ value: c, label: NOMBRE_CORTE[c] }));

export function DetalleTarjeta({ tarjetaId }: { tarjetaId: string }) {
  const tarjeta = useFund((s) => s.tarjetas.find((t) => t.id === tarjetaId));
  const [dispersion, setDispersion] = useState<DispersionEnCurso | null>(null);

  if (!tarjeta) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          title="Tarjeta no encontrada"
          action={
            <Button variant="outline" nativeButton={false} render={<Link href="/fund/tesoreria/panel" />}>
              Ir al panel
            </Button>
          }
        />
      </div>
    );
  }

  const hotel = hotelPorId(tarjeta.hotelId);
  const bloqueada = tarjeta.estatus === "bloqueada";

  function iniciar(monto: number, tipo: TipoFondeo) {
    setDispersion(dispersar(tarjeta!.id, monto, tipo));
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" nativeButton={false} render={<Link href="/fund/tesoreria/panel" />}>
        <ArrowLeft data-icon="inline-start" />
        Panel de tarjetas
      </Button>

      <PageHeader
        title={hotel?.nombre ?? tarjeta.hotelId}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">Tarjeta •••• {tarjeta.ultimosCuatro}</span>
            <StatusBadge status={tarjeta.estatus} map={ESTATUS_TARJETA} />
          </span>
        }
        actions={
          <Button
            variant="outline"
            onClick={() => {
              useFund.getState().bloquearTarjeta(tarjeta.id, !bloqueada);
              toast.success(bloqueada ? "Tarjeta desbloqueada" : "Tarjeta bloqueada", { description: `${hotel?.nombre} · •••• ${tarjeta.ultimosCuatro}` });
            }}
          >
            {bloqueada ? <LockOpen data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
            {bloqueada ? "Desbloquear tarjeta" : "Bloquear tarjeta"}
          </Button>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <DatosTarjeta tarjeta={tarjeta} />
        <Excepciones tarjeta={tarjeta} />
        <RefondeoAutomatico tarjeta={tarjeta} bloqueada={bloqueada} onDispersar={(m) => iniciar(m, "automatico")} />
        <RefondeoManual tarjeta={tarjeta} bloqueada={bloqueada} onDispersar={(m) => iniciar(m, "manual")} />
      </div>

      <Categorias tarjeta={tarjeta} />
      <HistorialFondeos tarjeta={tarjeta} />
      <MovimientosCorte tarjeta={tarjeta} />

      <DialogoDispersion dispersion={dispersion} onClose={() => setDispersion(null)} />
    </div>
  );
}

function DatosTarjeta({ tarjeta: t }: { tarjeta: Tarjeta }) {
  const now = useNow(60_000);
  const cuenta = CUENTAS_FONDEADORAS.find((c) => c.id === t.cuentaFondeadoraId);
  const proximo = proximoCorte(t, now);
  const dias = proximo ? differenceInCalendarDays(proximo, now) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la tarjeta</CardTitle>
        <CardDescription>El número completo nunca se almacena: solo token y últimos cuatro dígitos.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Dato etiqueta="Saldo disponible" valor={<span className="text-lg font-semibold tabular-nums">{mxn(t.saldo)}</span>} />
          <Dato etiqueta="Presupuesto del corte" valor={mxn(t.presupuesto)} />
          <Dato etiqueta="Token" valor={<span className="font-mono text-xs">{t.token.slice(0, 12)}…</span>} />
          <Dato etiqueta="Cuenta fondeadora" valor={cuenta ? `${cuenta.banco} · ${cuenta.alias} (CLABE …${cuenta.clabeUltimosCuatro})` : "—"} />
          <Dato etiqueta="Último fondeo" valor={t.ultimoFondeo ? fechaHora(t.ultimoFondeo) : "—"} />
          <Dato etiqueta="Próximo corte" valor={proximo ? `${fecha(proximo, "EEE d MMM")}${dias !== null ? ` · ${dias <= 0 ? "hoy" : `en ${dias} d`}` : ""}` : "—"} />
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="corte-tarjeta" className="text-xs font-normal text-muted-foreground">
              Periodicidad de corte
            </Label>
            <Select
              items={CORTES}
              value={t.corte}
              onValueChange={(v) => {
                if (!v || v === t.corte) return;
                useFund.getState().configurarCorte(t.id, v as Corte);
                toast.success("Corte actualizado", { description: `Corte ${NOMBRE_CORTE[v as Corte].toLowerCase()} para •••• ${t.ultimosCuatro}.` });
              }}
            >
              <SelectTrigger id="corte-tarjeta" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CORTES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function Excepciones({ tarjeta }: { tarjeta: Tarjeta }) {
  const todos = useFund((s) => s.movimientos);
  const pendientes = useMemo(() => todos.filter((m) => m.tarjetaId === tarjeta.id && m.excepcionSolicitada?.estatus === "pendiente"), [todos, tarjeta.id]);

  function resolver(id: string, aprobada: boolean) {
    const m = pendientes.find((x) => x.id === id)!;
    if (!useFund.getState().resolverExcepcion(id, aprobada)) return;
    toast.success(aprobada ? "Excepción aprobada" : "Excepción rechazada", {
      description: aprobada ? `${m.proveedor} pasa a supervisión del hotel.` : `${m.proveedor} queda rechazado.`,
    });
  }

  return (
    <Card id="excepciones">
      <CardHeader>
        <CardTitle>Excepciones de categoría</CardTitle>
        <CardDescription>Gastos que el hotel necesita registrar aunque su categoría esté bloqueada.</CardDescription>
      </CardHeader>
      <CardContent>
        {pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin excepciones pendientes.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {pendientes.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium">{m.proveedor}</span>
                    <span className="text-muted-foreground">{m.conceptos[0]?.descripcion}</span>
                    <span className="text-xs text-muted-foreground">
                      Categoría {categoriaPorId(m.excepcionSolicitada!.categoriaId)?.nombre} · solicitó {m.registradoPor} · {fechaHora(m.excepcionSolicitada!.fecha)}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{mxn(m.total)}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolver(m.id, true)}>
                    Aprobar excepción
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolver(m.id, false)}>
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RefondeoAutomatico({ tarjeta, bloqueada, onDispersar }: { tarjeta: Tarjeta; bloqueada: boolean; onDispersar: (monto: number) => void }) {
  const movimientos = useFund((s) => s.movimientos);
  const calculo = calcularRefondeo(tarjeta, movimientos);
  const [texto, setTexto] = useState<string | null>(null);
  const monto = texto === null ? calculo.propuesto : Number(texto.replace(/[$,\s]/g, ""));
  const valido = Number.isFinite(monto) && monto > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Re-fondeo automático</CardTitle>
        <CardDescription>{NOTA_FORMULA}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-1.5 text-sm">
          <Linea etiqueta="Presupuesto del corte" valor={mxn(calculo.presupuesto)} />
          <Linea etiqueta="− Saldo actual" valor={mxn(calculo.saldo)} />
          <Linea etiqueta="+ Aprobados y autorizados desde el último fondeo" valor={mxn(calculo.aprobados)} />
          <Linea etiqueta="= Monto propuesto" valor={mxn(calculo.propuesto)} fuerte />
        </dl>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monto-auto">Monto a dispersar</Label>
            <Input
              id="monto-auto"
              inputMode="decimal"
              value={texto ?? calculo.propuesto.toFixed(2)}
              onChange={(e) => setTexto(e.target.value)}
              aria-invalid={!valido ? true : undefined}
              className="w-40 text-right tabular-nums"
            />
          </div>
          <Button disabled={!valido || bloqueada} onClick={() => (onDispersar(monto), setTexto(null))}>
            <Send data-icon="inline-start" />
            Dispersar
          </Button>
        </div>
        {bloqueada && <p className="text-sm text-muted-foreground">Desbloquea la tarjeta para dispersar.</p>}
      </CardContent>
    </Card>
  );
}

function RefondeoManual({ tarjeta, bloqueada, onDispersar }: { tarjeta: Tarjeta; bloqueada: boolean; onDispersar: (monto: number) => void }) {
  const [texto, setTexto] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const monto = Number(texto.replace(/[$,\s]/g, ""));
  const valido = texto.trim() !== "" && Number.isFinite(monto) && monto > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Re-fondeo manual</CardTitle>
        <CardDescription>Dispersión puntual fuera del corte.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monto-manual">Monto</Label>
          <Input id="monto-manual" inputMode="decimal" placeholder="0.00" value={texto} onChange={(e) => setTexto(e.target.value)} className="w-40 text-right tabular-nums" />
        </div>
        <Button variant="outline" disabled={!valido || bloqueada} onClick={() => setConfirmar(true)}>
          <Send data-icon="inline-start" />
          Dispersar
        </Button>
        <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Dispersar {valido ? mxn(monto) : ""}?</AlertDialogTitle>
              <AlertDialogDescription>
                Re-fondeo manual a la tarjeta •••• {tarjeta.ultimosCuatro} de {hotelPorId(tarjeta.hotelId)?.nombre} vía Pay Connect.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmar(false);
                  onDispersar(monto);
                  setTexto("");
                }}
              >
                Dispersar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function Categorias({ tarjeta }: { tarjeta: Tarjeta }) {
  const [busqueda, setBusqueda] = useState("");
  const visibles = CATEGORIAS.filter((c) => normalizar(`${c.nombre} ${c.mcc}`).includes(normalizar(busqueda)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorías bloqueadas</CardTitle>
        <CardDescription>
          {tarjeta.categoriasBloqueadas.length} de {CATEGORIAS.length} bloqueadas. Un gasto en una categoría bloqueada requiere excepción de Tesorería.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar categoría o MCC" aria-label="Buscar categoría" className="pl-8" />
        </div>
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((c) => {
            const bloqueada = tarjeta.categoriasBloqueadas.includes(c.id);
            const id = `cat-${c.id}`;
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-1.5">
                <Label htmlFor={id} className="flex min-w-0 flex-col items-start gap-0 font-normal">
                  <span>{c.nombre}</span>
                  <span className="text-xs text-muted-foreground">MCC {c.mcc}</span>
                </Label>
                <Switch
                  id={id}
                  checked={bloqueada}
                  onCheckedChange={(checked) => {
                    useFund.getState().bloquearCategoria(tarjeta.id, c.id, checked);
                    toast.success(checked ? `${c.nombre} bloqueada` : `${c.nombre} permitida`, { description: `Tarjeta •••• ${tarjeta.ultimosCuatro}` });
                  }}
                  aria-label={`Bloquear ${c.nombre}`}
                />
              </li>
            );
          })}
        </ul>
        {visibles.length === 0 && <p className="text-sm text-muted-foreground">Ninguna categoría coincide.</p>}
      </CardContent>
    </Card>
  );
}

const colFondeo = dataGridColumns<Fondeo>();
const COLUMNAS_FONDEO = colFondeo.columns([
  colFondeo.accessor((f) => new Date(f.fecha), {
    id: "fecha",
    header: "Fecha",
    sortFn: "datetime",
    enableGlobalFilter: false,
    cell: (c) => <span className="whitespace-nowrap">{fechaHora(c.getValue())}</span>,
  }),
  colFondeo.accessor("monto", { header: "Monto", cell: (c) => mxn(c.getValue()), meta: { align: "end" } }),
  colFondeo.accessor("tipo", {
    header: "Tipo",
    cell: (c) => NOMBRE_TIPO_FONDEO[c.getValue()],
    meta: { exportValue: (v) => NOMBRE_TIPO_FONDEO[v as TipoFondeo] },
  }),
  colFondeo.accessor("estatus", {
    header: "Estatus",
    cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_FONDEO} />,
    meta: { exportValue: (v) => ESTATUS_FONDEO[v as EstatusFondeo].label },
  }),
  colFondeo.accessor("referencia", { header: "Referencia", meta: { hideBelow: "lg" } }),
  colFondeo.accessor("actor", { header: "Registró", meta: { hideBelow: "xl" } }),
]);

function HistorialFondeos({ tarjeta }: { tarjeta: Tarjeta }) {
  const todos = useFund((s) => s.fondeos);
  const fondeos = useMemo(() => todos.filter((f) => f.tarjetaId === tarjeta.id), [todos, tarjeta.id]);
  const recientes = [...fondeos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de fondeos</CardTitle>
        <CardDescription>{fondeos.length} fondeos en los últimos 3 meses.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Timeline
          events={recientes.map((f) => ({
            id: f.id,
            fecha: f.fecha,
            titulo: `${mxn(f.monto)} · ${NOMBRE_TIPO_FONDEO[f.tipo]}`,
            actor: f.actor,
            descripcion: `${ESTATUS_FONDEO[f.estatus].label} · ${f.referencia}`,
            tone: ESTATUS_FONDEO[f.estatus].tone,
          }))}
        />
        <DataGrid
          columns={COLUMNAS_FONDEO}
          data={fondeos}
          getRowId={(f) => f.id}
          initialSorting={[{ id: "fecha", desc: true }]}
          exportFileName={`fondeos-${tarjeta.ultimosCuatro}`}
          searchPlaceholder="Buscar referencia"
        />
      </CardContent>
    </Card>
  );
}

function MovimientosCorte({ tarjeta }: { tarjeta: Tarjeta }) {
  const todos = useFund((s) => s.movimientos);
  const movimientos = useMemo(() => movimientosDelCorte(tarjeta, todos), [tarjeta, todos]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos del corte</CardTitle>
        <CardDescription>Registrados desde el último fondeo{tarjeta.ultimoFondeo ? ` (${fechaHora(tarjeta.ultimoFondeo)})` : ""}.</CardDescription>
      </CardHeader>
      <CardContent>
        <MovimientosGrid
          movimientos={movimientos}
          exportFileName={`movimientos-corte-${tarjeta.ultimosCuatro}`}
          emptyTitle="Sin movimientos en el corte"
          emptyDescription="Los gastos que registre el hotel después del último fondeo aparecerán aquí."
        />
      </CardContent>
    </Card>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

function Linea({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={fuerte ? "flex justify-between gap-4 border-t pt-1.5 font-semibold" : "flex justify-between gap-4"}>
      <dt className={fuerte ? undefined : "text-muted-foreground"}>{etiqueta}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
