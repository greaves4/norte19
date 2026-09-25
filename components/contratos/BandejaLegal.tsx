"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Columns3, EllipsisVertical, List, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DialogoReasignar } from "@/components/contratos/DialogoReasignar";
import { RelojSla } from "@/components/contratos/RelojSla";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNow } from "@/lib/demo";
import { ABOGADOS, abogadoPorId, contraparteDe, solicitantePorId, TIPOS_CONTRATO, USUARIOS_CONTRATOS, venceSla } from "@/lib/fixtures/contratos";
import { fecha } from "@/lib/format";
import { cargaPorAbogado } from "@/lib/sim/contratos/asignacion";
import { COLUMNAS_KANBAN, columnaDe, NOMBRE_PASO, planMovimiento, type ColumnaKanban, type PasoKanban } from "@/lib/sim/contratos/kanban";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, PASOS_FIRMA, type EstatusSolicitud, type Solicitud } from "@/lib/types/contratos";
import { cn } from "@/lib/utils";

const YO = USUARIOS_CONTRATOS.abogado;

type Filtro = "mias" | "todas";
type Vista = "tablero" | "lista";

export const rutaDetalle = (id: string) => `/contratos/legal/solicitudes/${id}`;

// Ejecuta en orden los pasos de un movimiento del Kanban; se detiene en el primero que falle.
export function ejecutarPasos(id: string, pasos: PasoKanban[], actor: string): boolean {
  const st = useContratos.getState();
  for (const paso of pasos) {
    const ok = paso === "iniciarAnalisis" ? st.iniciarAnalisis(id, actor) : paso === "enviarAAprobacion" ? st.enviarAAprobacion(id, actor) : st.enviarAFirma(id, actor);
    if (!ok) return false;
  }
  return true;
}

const apellido = (id: string) => abogadoPorId(id)?.nombre.split(" ").slice(-1)[0] ?? id;

export function BandejaLegal() {
  const router = useRouter();
  const hidratado = useContratosHydrated();
  const { actor } = useActorContratos();
  const solicitudes = useContratos((s) => s.solicitudes);
  const now = useNow(1000);
  const [filtro, setFiltro] = useState<Filtro>("mias");
  const [vista, setVista] = useState<Vista>("tablero");
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [salto, setSalto] = useState<{ solicitud: Solicitud; pasos: PasoKanban[]; destino: ColumnaKanban } | null>(null);
  const [aReasignar, setAReasignar] = useState<Solicitud | null>(null);

  const visibles = useMemo(() => (filtro === "mias" ? solicitudes.filter((s) => s.abogadoId === YO.id) : solicitudes), [solicitudes, filtro]);
  const carga = useMemo(() => cargaPorAbogado(solicitudes), [solicitudes]);
  const porColumna = useMemo(() => {
    const m = Object.fromEntries(COLUMNAS_KANBAN.map((c) => [c.id, [] as Solicitud[]])) as Record<ColumnaKanban, Solicitud[]>;
    for (const s of visibles) m[columnaDe(s.estatus)].push(s);
    // Lo más urgente arriba: el SLA que vence antes (cada tipo tiene su propio SLA).
    const vence = (s: Solicitud) => venceSla(s).getTime();
    for (const lista of Object.values(m)) lista.sort((a, b) => vence(a) - vence(b));
    return m;
  }, [visibles]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  function aplicar(s: Solicitud, pasos: PasoKanban[]) {
    if (!ejecutarPasos(s.id, pasos, actor)) {
      toast.error("No se pudo mover la solicitud", { description: "Su estatus cambió; vuelve a intentarlo." });
      return;
    }
    const ultimo = pasos[pasos.length - 1];
    if (ultimo === "enviarAFirma") {
      toast.success(`${s.folio} enviada a firma electrónica`, { action: { label: "Ver seguimiento", onClick: () => router.push(`/contratos/firma/${s.id}`) } });
    } else if (ultimo === "enviarAAprobacion") {
      toast.success(`${s.folio} enviada a aprobación`, { description: `La revisa ${USUARIOS_CONTRATOS.directivo.nombre}.` });
    } else {
      toast.success(`${s.folio} en análisis`);
    }
  }

  function alSoltar(e: DragEndEvent) {
    setArrastrando(null);
    const s = solicitudes.find((x) => x.id === e.active.id);
    const destino = e.over?.id as ColumnaKanban | undefined;
    if (!s || !destino) return;
    const plan = planMovimiento(s, destino);
    if (plan.tipo === "nada") return;
    if (plan.tipo === "bloqueado") {
      toast.warning(`No se movió ${s.folio}`, {
        description: plan.motivo,
        action:
          plan.accion === "detalle"
            ? { label: "Abrir detalle", onClick: () => router.push(rutaDetalle(s.id)) }
            : plan.accion === "firma"
              ? { label: "Ver firma", onClick: () => router.push(`/contratos/firma/${s.id}`) }
              : undefined,
      });
      return;
    }
    if (plan.tipo === "salto") {
      setSalto({ solicitud: s, pasos: plan.pasos, destino });
      return;
    }
    aplicar(s, plan.pasos);
  }

  const titulo = (id: string | number | undefined) => {
    const s = solicitudes.find((x) => x.id === id);
    return s ? `${s.folio}, ${contraparteDe(s.campos)}` : "la solicitud";
  };
  const columna = (id: string | number | undefined) => COLUMNAS_KANBAN.find((c) => c.id === id)?.titulo ?? "fuera del tablero";
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${titulo(active.id)}.`,
    onDragOver: ({ active, over }) => `${titulo(active.id)} sobre la columna ${columna(over?.id)}.`,
    onDragEnd: ({ active, over }) => `Soltaste ${titulo(active.id)} en ${columna(over?.id)}.`,
    onDragCancel: ({ active }) => `Se canceló el movimiento de ${titulo(active.id)}.`,
  };

  const activa = arrastrando ? solicitudes.find((s) => s.id === arrastrando) : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Bandeja de Legal"
        description="Arrastra una tarjeta para avanzarla de etapa. El reloj de SLA corre en días hábiles con la hora de la demo."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup variant="outline" size="sm" spacing={0} value={[filtro]} onValueChange={(v) => v[0] && setFiltro(v[0] as Filtro)} aria-label="Qué solicitudes ver">
            <ToggleGroupItem value="mias">Mis solicitudes</ToggleGroupItem>
            <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup variant="outline" size="sm" spacing={0} value={[vista]} onValueChange={(v) => v[0] && setVista(v[0] as Vista)} aria-label="Vista">
            <ToggleGroupItem value="tablero">
              <Columns3 data-icon="inline-start" />
              Tablero
            </ToggleGroupItem>
            <ToggleGroupItem value="lista">
              <List data-icon="inline-start" />
              Lista
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <section aria-label="Carga activa por abogado" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Carga activa</span>
          {ABOGADOS.map((a) => (
            <Badge key={a.id} variant={a.id === YO.id ? "secondary" : "outline"} className="tabular-nums">
              {apellido(a.id)} {carga[a.id]}
              {a.id === YO.id && <span className="text-muted-foreground">(tú)</span>}
            </Badge>
          ))}
        </section>
      </div>

      {vista === "tablero" ? (
        <DndContext
          sensors={sensors}
          accessibility={{
            announcements: anuncios,
            screenReaderInstructions: { draggable: "Para mover una tarjeta, presiona espacio, usa las flechas para elegir la columna y presiona espacio para soltarla. Escape cancela." },
          }}
          onDragStart={(e) => setArrastrando(String(e.active.id))}
          onDragCancel={() => setArrastrando(null)}
          onDragEnd={alSoltar}
        >
          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
            <div className="grid min-w-[1180px] grid-cols-5 gap-3">
              {COLUMNAS_KANBAN.map((c) => (
                <ColumnaTablero key={c.id} id={c.id} titulo={c.titulo} total={porColumna[c.id].length} activa={activa} cargando={!hidratado}>
                  {porColumna[c.id].map((s) => (
                    <TarjetaArrastrable key={s.id} solicitud={s} now={now} onReasignar={() => setAReasignar(s)} />
                  ))}
                </ColumnaTablero>
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>{activa ? <TarjetaSolicitud solicitud={activa} now={now} flotando /> : null}</DragOverlay>
        </DndContext>
      ) : (
        <ListaBandeja solicitudes={visibles} now={now} cargando={!hidratado} onAbrir={(s) => router.push(rutaDetalle(s.id))} />
      )}

      <AlertDialog open={salto !== null} onOpenChange={(o) => !o && setSalto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Saltar a {COLUMNAS_KANBAN.find((c) => c.id === salto?.destino)?.titulo}?</AlertDialogTitle>
            <AlertDialogDescription>
              {salto?.solicitud.folio} no pasa por la etapa intermedia. Se registrarán en el historial: {salto?.pasos.map((p) => NOMBRE_PASO[p]).join(" → ")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (salto) aplicar(salto.solicitud, salto.pasos);
                setSalto(null);
              }}
            >
              Mover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogoReasignar solicitud={aReasignar} actor={actor} onOpenChange={(o) => !o && setAReasignar(null)} />
    </div>
  );
}

function ColumnaTablero({
  id,
  titulo,
  total,
  activa,
  cargando,
  children,
}: {
  id: ColumnaKanban;
  titulo: string;
  total: number;
  activa?: Solicitud;
  cargando: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const esOrigen = activa && columnaDe(activa.estatus) === id;
  return (
    <section
      ref={setNodeRef}
      aria-label={`${titulo}, ${total === 1 ? "1 solicitud" : `${total} solicitudes`}`}
      data-over={isOver || undefined}
      className={cn(
        "flex min-h-96 flex-col gap-2 rounded-lg bg-muted/50 p-2 transition-colors",
        activa && !esOrigen && "outline-1 outline-border outline-dashed",
        isOver && !esOrigen && "bg-muted outline-primary",
      )}
    >
      <header className="flex items-center justify-between px-1 pt-1">
        <h2 className="text-sm font-medium">{titulo}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{total}</span>
      </header>
      {cargando ? null : total === 0 ? <p className="px-1 py-6 text-center text-xs text-muted-foreground">Sin solicitudes</p> : children}
    </section>
  );
}

function TarjetaArrastrable({ solicitud, now, onReasignar }: { solicitud: Solicitud; now: Date; onReasignar: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: solicitud.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} aria-roledescription="tarjeta arrastrable" className={cn("touch-manipulation rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", isDragging && "opacity-40")}>
      <TarjetaSolicitud solicitud={solicitud} now={now} onReasignar={onReasignar} />
    </div>
  );
}

// Subetiqueta dentro de la columna: en_ajustes (en análisis) y aprobada (en aprobación).
const ETIQUETA: Partial<Record<EstatusSolicitud, string>> = { en_ajustes: "En ajustes", aprobada: "Aprobada" };

function TarjetaSolicitud({ solicitud: s, now, onReasignar, flotando = false }: { solicitud: Solicitud; now: Date; onReasignar?: () => void; flotando?: boolean }) {
  const pasosFirma = s.firma ? PASOS_FIRMA.filter((p) => s.firma?.pasos[p.id]).length : 0;
  const rechazada = s.estatus === "en_analisis" && s.motivoRechazo;
  return (
    <Card size="sm" className={cn("cursor-grab gap-2 active:cursor-grabbing", flotando && "rotate-1 shadow-lg")}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">{s.folio}</span>
            {ETIQUETA[s.estatus] && <StatusBadge status={s.estatus} map={ESTATUS_SOLICITUD} />}
            {rechazada && <Badge variant="outline">Rechazada a ajustes</Badge>}
          </div>
          {onReasignar && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-xs" className="-mt-1 -mr-1 shrink-0" aria-label={`Acciones de ${s.folio}`} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} />}
              >
                <EllipsisVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={rutaDetalle(s.id)} />}>Abrir detalle</DropdownMenuItem>
                {s.estatus !== "formalizada" && (
                  <DropdownMenuItem onClick={onReasignar}>
                    <UserRoundPen />
                    Reasignar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Link
          href={rutaDetalle(s.id)}
          className="line-clamp-2 text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
          onPointerDown={(e) => e.stopPropagation()}
          draggable={false}
        >
          {contraparteDe(s.campos)}
        </Link>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <p>
            {NOMBRE_TIPO_CONTRATO[s.tipoContrato]} · {solicitantePorId(s.solicitanteId)?.area}
          </p>
          <p>Abogado: {abogadoPorId(s.abogadoId)?.nombre.replace("Lic. ", "")}</p>
        </div>
        {s.estatus === "en_firma" ? (
          <span className="text-xs text-muted-foreground">Firma: {pasosFirma} de {PASOS_FIRMA.length} pasos</span>
        ) : s.estatus === "formalizada" ? (
          <span className="text-xs text-muted-foreground">Formalizada el {fecha(s.etapas.formalizada ?? s.creadaEn)}</span>
        ) : (
          <RelojSla solicitud={s} now={now} />
        )}
      </CardContent>
    </Card>
  );
}

const col = dataGridColumns<Solicitud>();

function columnasLista(now: Date) {
  return col.columns([
    col.accessor("folio", { header: "Folio", cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span>, meta: { hideOnMobile: true } }),
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
        hideBelow: "lg",
        filter: { type: "select", options: TIPOS_CONTRATO.map((t) => ({ value: t, label: NOMBRE_TIPO_CONTRATO[t] })) },
        exportValue: (v) => NOMBRE_TIPO_CONTRATO[v as Solicitud["tipoContrato"]],
      },
    }),
    col.accessor((s) => solicitantePorId(s.solicitanteId)?.area ?? "", { id: "area", header: "Área", meta: { hideBelow: "xl" } }),
    col.accessor((s) => abogadoPorId(s.abogadoId)?.nombre ?? "", {
      id: "abogado",
      header: "Abogado",
      filterFn: "equalsString",
      meta: { hideOnMobile: true, filter: { type: "select", options: ABOGADOS.map((a) => ({ value: a.nombre, label: a.nombre })) } },
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
    col.accessor((s) => new Date(s.creadaEn), {
      id: "creada",
      header: "Creada",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap">{fecha(c.getValue())}</span>,
      meta: { hideBelow: "xl" },
    }),
    col.display({ id: "sla", header: "SLA", enableSorting: false, cell: (c) => <RelojSla solicitud={c.row.original} now={now} />, meta: { hideBelow: "lg" } }),
  ]);
}

function ListaBandeja({ solicitudes, now, cargando, onAbrir }: { solicitudes: Solicitud[]; now: Date; cargando: boolean; onAbrir: (s: Solicitud) => void }) {
  // El reloj de la lista se refresca por minuto para no re-crear columnas cada segundo.
  const minuto = Math.floor(now.getTime() / 60_000);
  const columnas = useMemo(() => columnasLista(new Date(minuto * 60_000)), [minuto]);
  return (
    <DataGrid
      columns={columnas}
      data={solicitudes}
      loading={cargando}
      getRowId={(s) => s.id}
      onRowClick={onAbrir}
      initialSorting={[{ id: "creada", desc: false }]}
      searchPlaceholder="Buscar por folio, contraparte o abogado"
      exportFileName="bandeja-legal"
      emptyTitle="Sin solicitudes"
      emptyDescription="Cuando un área envíe una solicitud aparecerá aquí."
    />
  );
}
