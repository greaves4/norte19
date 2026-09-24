"use client";

import { ArrowLeft, Check, Gauge, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { DialogoJustificacion } from "@/components/fund/DialogoJustificacion";
import { TONO_EVENTO } from "@/components/fund/MovimientoDetalle";
import { ListaValidaciones } from "@/components/fund/Validaciones";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SplitViewer, type ViewerDocument } from "@/components/shared/SplitViewer";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoriaPorClave, nombreCentroCostos, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { fechaHora, mxn } from "@/lib/format";
import { enBandeja, validacionesMovimiento } from "@/lib/sim/fund/supervision";
import { esperaAutorizacion, useFund } from "@/lib/store/fund";
import { ESTATUS_MOVIMIENTO, type Movimiento } from "@/lib/types/fund";

const SUPERVISOR = USUARIOS_DEMO.supervisor;

export function RevisionMovimiento({ id }: { id: string }) {
  const router = useRouter();
  const m = useFund((s) => s.movimientos.find((x) => x.id === id));
  const tarjeta = useFund((s) => s.tarjetas.find((t) => t.id === m?.tarjetaId));
  const [confirmar, setConfirmar] = useState(false);
  const [rechazar, setRechazar] = useState(false);

  // RNF02 (visor ≤ 3 s): se mide desde que se monta la vista hasta que el documento se pinta.
  const inicio = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const [segundosCarga, setSegundosCarga] = useState<number | null>(null);

  if (!m || !tarjeta || m.hotelId !== SUPERVISOR.hotelId) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          title="Movimiento no encontrado"
          description="Puede que se haya reiniciado la demo o que no pertenezca a tu hotel."
          action={
            <Button variant="outline" nativeButton={false} render={<Link href="/fund/supervisor/bandeja" />}>
              Ir a la bandeja
            </Button>
          }
        />
      </div>
    );
  }

  const comprobante = m.comprobantes.find((c) => c.tipo !== "xml");
  const documento: ViewerDocument | null = comprobante
    ? { type: comprobante.tipo === "pdf" ? "pdf" : "image", src: comprobante.src, title: comprobante.nombre }
    : null;
  const accionable = enBandeja(m);
  const extemporaneo = esperaAutorizacion(m);

  function aprobar() {
    const store = useFund.getState();
    const ok = extemporaneo ? store.autorizarExtemporaneo(m!.id, SUPERVISOR.nombre) : store.aprobar(m!.id, SUPERVISOR.nombre);
    if (!ok) return toast.error("No se pudo aprobar", { description: "El movimiento ya no está pendiente." });
    toast.success(extemporaneo ? "Movimiento autorizado y aprobado" : "Movimiento aprobado", { description: `${m!.proveedor} · ${mxn(m!.total)}` });
    router.push("/fund/supervisor/bandeja");
  }

  function rechazarCon(motivo: string) {
    if (!useFund.getState().rechazar(m!.id, SUPERVISOR.nombre, motivo)) {
      return toast.error("No se pudo rechazar", { description: "El movimiento ya no está pendiente." });
    }
    toast.success("Movimiento rechazado", { description: `${m!.proveedor} · ${mxn(m!.total)}. Recepción verá el motivo.` });
    router.push("/fund/supervisor/bandeja");
  }

  const datos = <DatosRevision movimiento={m} validaciones={validacionesMovimiento(m, tarjeta)} />;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" nativeButton={false} render={<Link href="/fund/supervisor/bandeja" />}>
        <ArrowLeft data-icon="inline-start" />
        Bandeja
      </Button>

      <PageHeader
        title={m.proveedor}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground tabular-nums">{mxn(m.total)}</span>
            <StatusBadge status={m.estatus} map={ESTATUS_MOVIMIENTO} />
            {extemporaneo && <Badge variant="outline">Fuera de ventana</Badge>}
            <span>
              Registró {m.registradoPor} · {fechaHora(m.fecha)}
            </span>
          </span>
        }
        actions={
          accionable && (
            <>
              <Button variant="outline" onClick={() => setRechazar(true)}>
                <X data-icon="inline-start" />
                Rechazar
              </Button>
              <Button onClick={() => setConfirmar(true)}>
                <Check data-icon="inline-start" />
                {extemporaneo ? "Autorizar y aprobar" : "Aprobar"}
              </Button>
            </>
          )
        }
      />

      {segundosCarga !== null && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <Gauge className="size-3.5" aria-hidden />
          Documento cargado en{" "}
          {segundosCarga < 0.1 ? "menos de 0.1" : segundosCarga.toLocaleString("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s
        </p>
      )}

      {documento ? (
        <SplitViewer
          document={documento}
          className="h-[calc(100svh-15rem-var(--demo-bar-h,0px))]"
          onDocumentLoad={() => setSegundosCarga((actual) => actual ?? (performance.now() - inicio.current) / 1000)}
        >
          {datos}
        </SplitViewer>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Este movimiento no tiene comprobante en PDF o imagen.</p>
          {datos}
        </div>
      )}

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{extemporaneo ? "¿Autorizar y aprobar este movimiento?" : "¿Aprobar este movimiento?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.proveedor} · {mxn(m.total)}.
              {extemporaneo && " Se registró fuera de la ventana de 3 días; tu autorización queda en el historial."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={aprobar}>{extemporaneo ? "Autorizar y aprobar" : "Aprobar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogoJustificacion
        open={rechazar}
        onOpenChange={setRechazar}
        titulo="Rechazar movimiento"
        descripcion={`${m.proveedor} · ${mxn(m.total)}. Recepción verá el motivo.`}
        etiqueta="Motivo del rechazo"
        accion="Rechazar"
        destructiva
        onConfirmar={rechazarCon}
      />
    </div>
  );
}

function DatosRevision({ movimiento: m, validaciones }: { movimiento: Movimiento; validaciones: ReturnType<typeof validacionesMovimiento> }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Validaciones automáticas</CardTitle>
        </CardHeader>
        <CardContent>
          <ListaValidaciones validaciones={validaciones} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Datos del CFDI</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            <Dato etiqueta="Emisor" valor={m.proveedor} ancho />
            <Dato etiqueta="RFC emisor" valor={m.rfcEmisor} />
            <Dato etiqueta="RFC receptor" valor={m.rfcReceptor} />
            <Dato etiqueta="Fecha de emisión" valor={fechaHora(m.fechaEmisionCfdi)} />
            <Dato etiqueta="Centro de costos" valor={nombreCentroCostos(m.centroCostos)} />
            <Dato etiqueta="Folio fiscal (UUID)" valor={<span className="font-mono text-xs break-all">{m.uuid}</span>} ancho />
            {m.notas && <Dato etiqueta="Notas de Recepción" valor={m.notas} ancho />}
          </dl>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Conceptos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col divide-y">
            {m.conceptos.map((c, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2 text-sm first:pt-0">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{c.descripcion}</span>
                  <span className="text-xs text-muted-foreground">
                    Clave {c.claveProdServ} · {categoriaPorClave(c.claveProdServ)?.nombre ?? "Sin categoría"}
                  </span>
                </span>
                <span className="tabular-nums">{mxn(c.importe)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1 border-t pt-3 text-sm">
            <Total etiqueta="Subtotal" valor={m.subtotal} />
            <Total etiqueta="IVA" valor={m.iva} />
            <Total etiqueta="Total" valor={m.total} fuerte />
          </dl>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline
            events={m.timeline.map((e, i) => ({ id: String(i), fecha: e.fecha, titulo: e.titulo, actor: e.actor, descripcion: e.descripcion, tone: TONO_EVENTO[e.tipo] }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Dato({ etiqueta, valor, ancho }: { etiqueta: string; valor: React.ReactNode; ancho?: boolean }) {
  return (
    <div className={ancho ? "flex min-w-0 flex-col gap-0.5 sm:col-span-2" : "flex min-w-0 flex-col gap-0.5"}>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

function Total({ etiqueta, valor, fuerte }: { etiqueta: string; valor: number; fuerte?: boolean }) {
  return (
    <div className={fuerte ? "flex justify-between font-semibold" : "flex justify-between text-muted-foreground"}>
      <dt>{etiqueta}</dt>
      <dd className="tabular-nums">{mxn(valor)}</dd>
    </div>
  );
}
