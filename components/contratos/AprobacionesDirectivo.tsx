"use client";

import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Check, ExternalLink, Info, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AnalisisLectura } from "@/components/contratos/AnalisisJuridico";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { DialogoJustificacion } from "@/components/shared/DialogoJustificacion";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/lib/demo";
import { abogadoPorId, contraparteDe, solicitantePorId, TIPOS_CONTRATO } from "@/lib/fixtures/contratos";
import { fechaHora, mxn } from "@/lib/format";
import { resumenAnalisis } from "@/lib/sim/contratos/analisis";
import { montoPrincipal } from "@/lib/sim/contratos/formulario";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, type EventoSolicitud, type Solicitud } from "@/lib/types/contratos";

function Monto({ s }: { s: Solicitud }) {
  const m = montoPrincipal(s.campos);
  if (!m) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="whitespace-nowrap tabular-nums">
      {mxn(m.valor)}
      {m.periodicidad === "mensual" && <span className="text-muted-foreground"> /mes</span>}
    </span>
  );
}

const col = dataGridColumns<Solicitud>();

// Llegó a aprobación en las últimas 24 h del reloj de demo.
function recienLlegada(s: Solicitud, now: Date) {
  const llegada = s.etapas.en_aprobacion ? new Date(s.etapas.en_aprobacion).getTime() : 0;
  return now.getTime() - llegada < 86_400_000;
}

function columnasPendientes(now: Date) {
  return col.columns([
    col.accessor("folio", { header: "Folio", cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span>, meta: { hideOnMobile: true } }),
    col.accessor((s) => contraparteDe(s.campos), {
      id: "contraparte",
      header: "Contraparte",
      cell: (c) => (
        <span className="flex min-w-0 flex-col gap-1 md:min-w-48">
          <span className="line-clamp-2 whitespace-normal">{c.getValue()}</span>
          {recienLlegada(c.row.original, now) && (
            <Badge variant="secondary" className="self-start">
              Recién llegada
            </Badge>
          )}
          <span className="text-xs text-muted-foreground md:hidden">
            {c.row.original.folio} · {NOMBRE_TIPO_CONTRATO[c.row.original.tipoContrato]}
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
    col.accessor((s) => montoPrincipal(s.campos)?.valor ?? 0, { id: "monto", header: "Monto", cell: (c) => <Monto s={c.row.original} />, meta: { align: "end", hideBelow: "lg" } }),
    col.accessor((s) => abogadoPorId(s.abogadoId)?.nombre ?? "", { id: "abogado", header: "Abogado", meta: { hideBelow: "xl" } }),
    col.accessor((s) => new Date(s.etapas.en_aprobacion ?? s.creadaEn), {
      id: "espera",
      header: "Esperando",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap">{formatDistanceStrict(c.getValue(), now, { locale: es })}</span>,
      meta: { hideOnMobile: true, exportValue: (v) => v as Date },
    }),
    col.accessor((s) => resumenAnalisis(s.analisis, 110), {
      id: "recomendacion",
      header: "Recomendación del abogado",
      cell: (c) => <span className="line-clamp-2 min-w-56 whitespace-normal text-muted-foreground">{c.getValue()}</span>,
      meta: { hideBelow: "xl" },
    }),
  ]);
}

type Resuelta = { solicitud: Solicitud; evento: EventoSolicitud };
const colR = dataGridColumns<Resuelta>();
const columnasResueltas = colR.columns([
  colR.accessor((r) => new Date(r.evento.fecha), { id: "fecha", header: "Fecha", sortFn: "datetime", enableGlobalFilter: false, cell: (c) => <span className="whitespace-nowrap">{fechaHora(c.getValue())}</span> }),
  colR.accessor((r) => r.solicitud.folio, { id: "folio", header: "Folio", cell: (c) => <span className="font-mono text-xs">{c.getValue()}</span>, meta: { hideOnMobile: true } }),
  colR.accessor((r) => contraparteDe(r.solicitud.campos), { id: "contraparte", header: "Contraparte", cell: (c) => <span className="line-clamp-2 min-w-40 whitespace-normal">{c.getValue()}</span> }),
  colR.accessor((r) => (r.evento.tipo === "aprobada" ? "Aprobada" : "Rechazada a ajustes"), {
    id: "decision",
    header: "Decisión",
    cell: (c) => <Badge variant={c.getValue() === "Aprobada" ? "secondary" : "outline"}>{c.getValue()}</Badge>,
  }),
  colR.accessor((r) => r.evento.descripcion ?? "", { id: "motivo", header: "Motivo", cell: (c) => <span className="line-clamp-2 min-w-48 whitespace-normal text-muted-foreground">{c.getValue() || "—"}</span>, meta: { hideBelow: "lg" } }),
  colR.accessor((r) => r.solicitud.estatus, { id: "estatus", header: "Estatus actual", cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_SOLICITUD} />, meta: { hideOnMobile: true } }),
]);

export function AprobacionesDirectivo() {
  const hidratado = useContratosHydrated();
  const { actor } = useActorContratos();
  const solicitudes = useContratos((s) => s.solicitudes);
  const aprobar = useContratos((s) => s.aprobar);
  const rechazar = useContratos((s) => s.rechazarAAjustes);
  const now = useNow(60_000);
  const minuto = Math.floor(now.getTime() / 60_000);
  const columnas = useMemo(() => columnasPendientes(new Date(minuto * 60_000)), [minuto]);
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState(false);

  const pendientes = useMemo(() => solicitudes.filter((s) => s.estatus === "en_aprobacion"), [solicitudes]);
  const resueltas = useMemo(
    () => solicitudes.flatMap((s) => s.timeline.filter((e) => (e.tipo === "aprobada" || e.tipo === "rechazada_ajustes") && e.actor === actor).map((evento) => ({ solicitud: s, evento }))),
    [solicitudes, actor],
  );
  const abierta = abiertaId ? solicitudes.find((s) => s.id === abiertaId) ?? null : null;
  const enPanel = abierta?.estatus === "en_aprobacion" ? abierta : null;

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader title="Aprobaciones" description="Solicitudes con análisis jurídico listas para tu decisión." />
      <Alert>
        <Info />
        <AlertDescription>Niveles de aprobación configurables por monto, tipo de contrato o área. En el prototipo hay un nivel: Dirección Jurídica.</AlertDescription>
      </Alert>

      <Tabs defaultValue="pendientes" className="gap-4">
        <TabsList>
          <TabsTrigger value="pendientes">Pendientes ({pendientes.length})</TabsTrigger>
          <TabsTrigger value="resueltas">Resueltas por ti ({resueltas.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes">
          <DataGrid
            columns={columnas}
            data={pendientes}
            loading={!hidratado}
            getRowId={(s) => s.id}
            onRowClick={(s) => setAbiertaId(s.id)}
            initialSorting={[{ id: "espera", desc: true }]}
            searchPlaceholder="Buscar por folio, contraparte o abogado"
            exportFileName="aprobaciones-pendientes"
            emptyTitle="Nada pendiente de aprobar"
            emptyDescription="Cuando Legal envíe una solicitud a aprobación aparecerá aquí."
          />
        </TabsContent>
        <TabsContent value="resueltas">
          <DataGrid
            columns={columnasResueltas}
            data={resueltas}
            loading={!hidratado}
            getRowId={(r) => `${r.solicitud.id}-${r.evento.fecha}`}
            initialSorting={[{ id: "fecha", desc: true }]}
            exportFileName="aprobaciones-resueltas"
            emptyTitle="Aún no resuelves solicitudes"
            emptyDescription="Tus aprobaciones y rechazos quedarán aquí."
          />
        </TabsContent>
      </Tabs>

      <Sheet open={enPanel !== null} onOpenChange={(o) => !o && setAbiertaId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {enPanel && (
            <>
              <SheetHeader>
                <SheetTitle>{contraparteDe(enPanel.campos)}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{enPanel.folio}</span>
                  <StatusBadge status={enPanel.estatus} map={ESTATUS_SOLICITUD} />
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Dato etiqueta="Tipo" valor={NOMBRE_TIPO_CONTRATO[enPanel.tipoContrato]} />
                  <Dato etiqueta="Monto" valor={<Monto s={enPanel} />} />
                  <Dato etiqueta="Área solicitante" valor={solicitantePorId(enPanel.solicitanteId)?.area} />
                  <Dato etiqueta="Enviada a aprobación" valor={fechaHora(enPanel.etapas.en_aprobacion ?? enPanel.creadaEn)} />
                </dl>
                <Separator />
                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium">Análisis de {abogadoPorId(enPanel.abogadoId)?.nombre}</h3>
                  <AnalisisLectura texto={enPanel.analisis ?? ""} />
                </section>
                <Button variant="link" className="self-start px-0" nativeButton={false} render={<Link href={`/contratos/legal/solicitudes/${enPanel.id}`} />}>
                  Ver expediente y timeline
                  <ExternalLink data-icon="inline-end" />
                </Button>
              </div>
              <SheetFooter className="flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setRechazando(true)}>
                  <X data-icon="inline-start" />
                  Rechazar a ajustes
                </Button>
                <Button
                  onClick={() => {
                    if (aprobar(enPanel.id, actor)) {
                      toast.success(`${enPanel.folio} aprobada`, { description: `Se notificó a ${abogadoPorId(enPanel.abogadoId)?.nombre} para enviarla a firma.` });
                      setAbiertaId(null);
                    }
                  }}
                >
                  <Check data-icon="inline-start" />
                  Aprobar
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <DialogoJustificacion
        open={rechazando}
        onOpenChange={setRechazando}
        titulo={`Rechazar ${abierta?.folio ?? ""} a ajustes`}
        descripcion={`Regresa a En análisis con ${abogadoPorId(abierta?.abogadoId ?? "")?.nombre}.`}
        etiqueta="Motivo"
        accion="Rechazar a ajustes"
        destructiva
        ayuda="Obligatorio. El abogado lo verá en la solicitud."
        onConfirmar={(motivo) => {
          if (abierta && rechazar(abierta.id, motivo, actor)) {
            toast.success(`Regresada a ${abogadoPorId(abierta.abogadoId)?.nombre}`, { description: "Vuelve a En análisis con tu motivo." });
            setAbiertaId(null);
          }
        }}
      />
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="break-words">{valor}</dd>
    </div>
  );
}
