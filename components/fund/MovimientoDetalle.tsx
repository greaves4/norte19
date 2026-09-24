"use client";

import { FileCode, FileImage, FileText } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { categoriaPorClave, categoriaPorId, nombreCentroCostos } from "@/lib/fixtures/fund";
import { fechaHora, mxn } from "@/lib/format";
import { ESTATUS_MOVIMIENTO, type Comprobante, type Movimiento, type TipoEvento } from "@/lib/types/fund";

const TONO_EVENTO: Record<TipoEvento, StatusTone> = {
  registrado: "neutral",
  enviado: "info",
  aprobado: "success",
  rechazado: "danger",
  autorizado: "warning",
  autorizacion_solicitada: "warning",
  excepcion_solicitada: "warning",
  excepcion_aprobada: "success",
  excepcion_rechazada: "danger",
};

type Props = {
  movimiento: Movimiento | null;
  onOpenChange: (open: boolean) => void;
};

export function MovimientoDetalle({ movimiento: m, onOpenChange }: Props) {
  return (
    <Sheet open={m !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {m && (
          <>
            <SheetHeader>
              <SheetTitle>{m.proveedor}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-foreground tabular-nums">{mxn(m.total)}</span>
                <StatusBadge status={m.estatus} map={ESTATUS_MOVIMIENTO} />
                {m.extemporaneo && <Badge variant="outline">Extemporáneo</Badge>}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6">
              {(m.motivoRechazo || m.motivoAutorizacion || m.excepcionSolicitada) && (
                <dl className="flex flex-col gap-2 text-sm">
                  {m.excepcionSolicitada && (
                    <Dato
                      etiqueta="Excepción de categoría"
                      valor={`${categoriaPorId(m.excepcionSolicitada.categoriaId)?.nombre ?? m.excepcionSolicitada.categoriaId} · ${m.excepcionSolicitada.estatus}`}
                    />
                  )}
                  {m.motivoRechazo && <Dato etiqueta="Motivo de rechazo" valor={m.motivoRechazo} />}
                  {m.motivoAutorizacion && <Dato etiqueta="Motivo de autorización" valor={m.motivoAutorizacion} />}
                </dl>
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Dato etiqueta="Registrado" valor={fechaHora(m.fecha)} />
                <Dato etiqueta="Emisión del CFDI" valor={fechaHora(m.fechaEmisionCfdi)} />
                <Dato etiqueta="RFC emisor" valor={m.rfcEmisor} />
                <Dato etiqueta="Centro de costos" valor={nombreCentroCostos(m.centroCostos)} />
                <Dato etiqueta="Registró" valor={m.registradoPor} />
                <Dato etiqueta="Subtotal · IVA" valor={`${mxn(m.subtotal)} · ${mxn(m.iva)}`} />
                <div className="col-span-2">
                  <Dato etiqueta="Folio fiscal (UUID)" valor={<span className="font-mono text-xs break-all">{m.uuid}</span>} />
                </div>
                {m.notas && (
                  <div className="col-span-2">
                    <Dato etiqueta="Notas" valor={m.notas} />
                  </div>
                )}
              </dl>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Conceptos</h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {m.conceptos.map((c, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <span className="flex flex-col">
                        <span>{c.descripcion}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.claveProdServ} · {categoriaPorClave(c.claveProdServ)?.nombre ?? "Sin categoría"}
                        </span>
                      </span>
                      <span className="tabular-nums">{mxn(c.importe)}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Comprobantes</h3>
                <ComprobantesLinks comprobantes={m.comprobantes} conTexto />
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Historial</h3>
                <Timeline
                  events={m.timeline.map((e, i) => ({
                    id: String(i),
                    fecha: e.fecha,
                    titulo: e.titulo,
                    actor: e.actor,
                    descripcion: e.descripcion,
                    tone: TONO_EVENTO[e.tipo],
                  }))}
                />
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
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

const ICONO = { xml: FileCode, pdf: FileText, imagen: FileImage } as const;
const ETIQUETA = { xml: "XML", pdf: "PDF", imagen: "Imagen" } as const;

// Iconos descargables de XML / PDF / imagen.
export function ComprobantesLinks({ comprobantes, conTexto = false }: { comprobantes: Comprobante[]; conTexto?: boolean }) {
  if (comprobantes.length === 0) return <span className="text-sm text-muted-foreground">Sin comprobantes</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {comprobantes.map((c) => {
        const Icono = ICONO[c.tipo];
        return (
          <a
            key={`${c.tipo}-${c.nombre}`}
            href={c.src}
            download={c.nombre}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Descargar ${ETIQUETA[c.tipo]}: ${c.nombre}`}
            aria-label={`Descargar ${ETIQUETA[c.tipo]} ${c.nombre}`}
            className="inline-flex items-center gap-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icono className="size-4" aria-hidden />
            {conTexto && <span className="text-sm">{ETIQUETA[c.tipo]}</span>}
          </a>
        );
      })}
    </span>
  );
}
