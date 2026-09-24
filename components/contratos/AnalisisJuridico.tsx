"use client";

import { History, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fechaHora } from "@/lib/format";
import { analisisVacio, PLANTILLA_ANALISIS, SECCIONES_ANALISIS, seccionesAnalisis } from "@/lib/sim/contratos/analisis";
import type { Solicitud } from "@/lib/types/contratos";

type Props = {
  solicitud: Solicitud;
  editable: boolean;
  borrador: string;
  onBorrador: (texto: string) => void;
  onGuardar: () => void;
};

// Editor con plantilla (Objeto, Riesgos, Cláusulas, Recomendación) e historial simple de versiones.
export function AnalisisJuridico({ solicitud: s, editable, borrador, onBorrador, onGuardar }: Props) {
  const [verVersion, setVerVersion] = useState<number | null>(null);
  const guardado = s.analisis ?? "";
  const sucio = borrador !== (guardado || PLANTILLA_ANALISIS);
  const versiones = [...s.versionesAnalisis].reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="flex min-w-0 flex-col gap-3">
        {editable ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="analisis">Análisis jurídico</Label>
              {sucio ? <Badge variant="outline">Sin guardar</Badge> : guardado && <span className="text-xs text-muted-foreground">Guardado</span>}
            </div>
            <Textarea
              id="analisis"
              rows={16}
              value={borrador}
              onChange={(e) => onBorrador(e.target.value)}
              className="font-mono text-sm leading-relaxed"
              aria-describedby="analisis-ayuda"
            />
            <p id="analisis-ayuda" className="text-xs text-muted-foreground">
              Escribe debajo de cada encabezado. Es lo que lee el directivo para aprobar.
            </p>
            <Button className="self-start" onClick={onGuardar} disabled={!sucio || analisisVacio(borrador)}>
              <Save data-icon="inline-start" />
              Guardar versión
            </Button>
          </>
        ) : analisisVacio(guardado) ? (
          <p className="text-sm text-muted-foreground">Aún no hay análisis jurídico.</p>
        ) : (
          <AnalisisLectura texto={guardado} />
        )}
      </div>

      <aside className="flex flex-col gap-3" aria-labelledby="versiones-titulo">
        <h3 id="versiones-titulo" className="flex items-center gap-2 text-sm font-medium">
          <History className="size-4 text-muted-foreground" aria-hidden />
          Versiones
        </h3>
        {versiones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin versiones guardadas.</p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm">
            {versiones.map((v, i) => {
              const numero = versiones.length - i;
              return (
                <li key={v.fecha + i} className="flex flex-col gap-1 border-l-2 pl-3">
                  <span className="font-medium">Versión {numero}{i === 0 && <span className="font-normal text-muted-foreground"> · actual</span>}</span>
                  <span className="text-xs text-muted-foreground">{fechaHora(v.fecha)} · {v.autor}</span>
                  <div className="flex gap-1">
                    <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setVerVersion(verVersion === numero ? null : numero)} aria-expanded={verVersion === numero}>
                      {verVersion === numero ? "Ocultar" : "Ver"}
                    </Button>
                    {editable && i > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-2"
                        onClick={() => {
                          onBorrador(v.texto);
                          toast.info(`Versión ${numero} cargada en el editor`, { description: "Guárdala para que sea la actual." });
                        }}
                      >
                        Restaurar
                      </Button>
                    )}
                  </div>
                  {verVersion === numero && <p className="text-xs whitespace-pre-line text-muted-foreground">{v.texto}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </aside>
    </div>
  );
}

export function AnalisisLectura({ texto }: { texto: string }) {
  const s = seccionesAnalisis(texto);
  return (
    <dl className="flex flex-col gap-4 text-sm">
      {SECCIONES_ANALISIS.map((k) => (
        <div key={k} className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
          <dd className="whitespace-pre-line">{s[k] || "—"}</dd>
        </div>
      ))}
      {s.libre && (
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">Notas</dt>
          <dd className="whitespace-pre-line">{s.libre}</dd>
        </div>
      )}
    </dl>
  );
}
