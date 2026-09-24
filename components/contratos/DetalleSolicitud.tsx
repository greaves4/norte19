"use client";

import { FileText, PencilLine } from "lucide-react";
import Link from "next/link";
import { RelojSla } from "@/components/contratos/RelojSla";
import { GateBanner } from "@/components/shared/GateBanner";
import { StatusBadge, type StatusTone } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { abogadoPorId, contraparteDe, solicitantePorId, venceSla } from "@/lib/fixtures/contratos";
import { useNow } from "@/lib/demo";
import { fecha, fechaHora } from "@/lib/format";
import { definicionPara, formatearValor } from "@/lib/sim/contratos/formulario";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, NOMBRE_TIPO_PERSONA, type Solicitud, type TipoEventoSolicitud } from "@/lib/types/contratos";

export const TONO_EVENTO_SOLICITUD: Record<TipoEventoSolicitud, StatusTone> = {
  creada: "neutral",
  asignada: "info",
  reasignada: "info",
  en_analisis: "info",
  analisis_guardado: "neutral",
  regresada: "warning",
  reenviada: "info",
  enviada_aprobacion: "info",
  aprobada: "success",
  rechazada_ajustes: "danger",
  enviada_firma: "info",
  firma: "info",
  formalizada: "success",
};

type Props = {
  solicitud: Solicitud | null;
  onOpenChange: (open: boolean) => void;
  // Solo el solicitante corrige y reenvía.
  puedeCorregir?: boolean;
};

export function DetalleSolicitud({ solicitud: s, onOpenChange, puedeCorregir = false }: Props) {
  const now = useNow(30_000);
  const def = s ? definicionPara(s.tipoPersona, s.tipoContrato) : null;

  return (
    <Sheet open={s !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {s && def && (
          <>
            <SheetHeader>
              <SheetTitle>{contraparteDe(s.campos)}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{s.folio}</span>
                <StatusBadge status={s.estatus} map={ESTATUS_SOLICITUD} />
                <RelojSla solicitud={s} now={now} />
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-6">
              {s.estatus === "en_ajustes" && (
                <GateBanner
                  variant="advertencia"
                  title="Legal pidió ajustes"
                  description={s.motivoRechazo ?? "Revisa los datos y el expediente."}
                  action={
                    puedeCorregir ? (
                      <Button size="sm" nativeButton={false} render={<Link href={`/contratos/solicitudes/nueva?corregir=${s.id}`} />}>
                        <PencilLine data-icon="inline-start" />
                        Corregir y reenviar
                      </Button>
                    ) : undefined
                  }
                />
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Dato etiqueta="Tipo" valor={`${NOMBRE_TIPO_CONTRATO[s.tipoContrato]} · ${NOMBRE_TIPO_PERSONA[s.tipoPersona]}`} />
                <Dato etiqueta="Creada" valor={fechaHora(s.creadaEn)} />
                <Dato etiqueta="Solicitante" valor={solicitantePorId(s.solicitanteId)?.nombre ?? s.solicitanteId} />
                <Dato etiqueta="Abogado asignado" valor={abogadoPorId(s.abogadoId)?.nombre ?? "Sin asignar"} />
                <Dato etiqueta="SLA de análisis" valor={`${s.slaDiasHabiles} días hábiles`} />
                <Dato etiqueta="Vence" valor={fecha(venceSla(s), "d MMM yyyy, HH:mm")} />
              </dl>

              <Separator />

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Datos capturados</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                  {def.campos.map((c) => (
                    <Dato key={c.clave} etiqueta={c.etiqueta} valor={formatearValor(c, s.campos[c.clave])} />
                  ))}
                </dl>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Expediente</h3>
                {s.expediente.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin documentos.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {s.expediente.map((d) => (
                      <li key={d.clave}>
                        <a href={d.src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                          <FileText className="size-4 text-muted-foreground" aria-hidden />
                          {d.etiqueta}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Historial</h3>
                <Timeline
                  events={[...s.timeline].reverse().map((e, i) => ({
                    id: String(i),
                    fecha: e.fecha,
                    titulo: e.titulo,
                    actor: e.actor,
                    descripcion: e.descripcion,
                    tone: TONO_EVENTO_SOLICITUD[e.tipo],
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
      <dd className="break-words">{valor}</dd>
    </div>
  );
}
