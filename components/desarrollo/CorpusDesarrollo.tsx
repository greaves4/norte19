"use client";

import { Check, Info, MessageSquareText, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CORPUS, ESTADO_CORPUS } from "@/lib/fixtures/desarrollo";
import { COBERTURA, DISCIPLINAS, type Cobertura, NOMBRE_DISCIPLINA, NOMBRE_TIPO_DOC, TIPOS_DOC, type HotelCorpus } from "@/lib/types/desarrollo";

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function CorpusDesarrollo() {
  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Corpus de referencia"
        description="Proyectos ejecutivos de 5 hoteles City Express select-service, procesados e indexados por disciplina."
        actions={
          <Button nativeButton={false} render={<Link href="/desarrollo/corpus/consulta" />}>
            <MessageSquareText data-icon="inline-start" />
            Consultar el corpus
          </Button>
        }
      />
      <Alert>
        <Info />
        <AlertDescription>Lista de hoteles según el estándar; se confirma con Norte 19. Los datos son de ejemplo hasta tener acceso al Drive.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 2xl:grid-cols-2">
          {CORPUS.map((h) => (
            <li key={h.id}>
              <TarjetaHotel h={h} />
            </li>
          ))}
        </ul>
        <EstadoCorpusPanel />
      </div>
    </div>
  );
}

function TarjetaHotel({ h }: { h: HotelCorpus }) {
  const huecos = DISCIPLINAS.filter((d) => TIPOS_DOC.every((t) => h.cobertura[d][t] === "ausente"));
  const parciales = DISCIPLINAS.filter((d) => !huecos.includes(d) && TIPOS_DOC.some((t) => h.cobertura[d][t] !== "completo"));
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{h.nombre}</CardTitle>
        <CardDescription>
          {h.ciudad}, {h.estado}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Dato etiqueta="Llaves" valor={n(h.llaves)} />
          <Dato etiqueta="m² construidos" valor={n(h.m2Total)} />
          <Dato etiqueta="m² por llave" valor={n(h.m2Total / h.llaves, 1)} />
          <Dato etiqueta="Año de proyecto" valor={String(h.anio)} />
        </dl>

        {(huecos.length > 0 || parciales.length > 0) && (
          <p className="flex items-start gap-2 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              {huecos.length > 0 && <>Sin información de {huecos.map((d) => NOMBRE_DISCIPLINA[d]).join(", ")}. </>}
              {parciales.length > 0 && <>Parcial en {parciales.map((d) => NOMBRE_DISCIPLINA[d]).join(", ")}.</>}
            </span>
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-sm">
            <caption className="sr-only">Cobertura de {h.nombre} por disciplina y tipo de documento</caption>
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-1.5 pr-2 font-medium">
                  Disciplina
                </th>
                {TIPOS_DOC.map((t) => (
                  <th key={t} scope="col" className="px-1 py-1.5 font-medium">
                    {NOMBRE_TIPO_DOC[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISCIPLINAS.map((d) => (
                <tr key={d} className="border-b last:border-0">
                  <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                    {NOMBRE_DISCIPLINA[d]}
                  </th>
                  {TIPOS_DOC.map((t) => (
                    <td key={t} className="px-1 py-1.5">
                      <CeldaCobertura valor={h.cobertura[d][t]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Lo completo se ve discreto; parcial y ausente resaltan (el hueco es lo que importa en la matriz).
function CeldaCobertura({ valor }: { valor: Cobertura }) {
  if (valor === "completo") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="size-3.5" aria-hidden />
        {COBERTURA.completo.label}
      </span>
    );
  }
  return <StatusBadge status={valor} map={COBERTURA} />;
}

function EstadoCorpusPanel() {
  const e = ESTADO_CORPUS;
  const totalCampos = e.campos.alta + e.campos.media + e.campos.baja;
  const pct = (v: number) => `${n((v / totalCampos) * 100, 1)}%`;
  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>Estado del corpus</CardTitle>
        <CardDescription>Resultado del procesamiento de los 5 proyectos.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3 text-sm">
          <Fila etiqueta="Documentos procesados" valor={n(e.documentosProcesados)} />
          <Fila etiqueta="Páginas con OCR" valor={n(e.paginasOcr)} />
          <Fila etiqueta="Planos DWG con XREF resueltos" valor={`${n(e.xrefResueltos)} de ${n(e.planosDwg)}`} />
          <Fila etiqueta="Duplicados detectados" valor={n(e.duplicadosDetectados)} />
          <Fila etiqueta="Duplicados descartados" valor={n(e.duplicadosDescartados)} />
        </dl>
        <h3 className="mt-5 mb-2 text-sm font-medium">Campos extraídos por confianza</h3>
        <dl className="flex flex-col gap-2 text-sm">
          <Fila etiqueta="Alta" valor={`${n(e.campos.alta)} · ${pct(e.campos.alta)}`} />
          <Fila etiqueta="Media (revisión sugerida)" valor={`${n(e.campos.media)} · ${pct(e.campos.media)}`} />
          <Fila etiqueta="Baja (revisión obligatoria)" valor={`${n(e.campos.baja)} · ${pct(e.campos.baja)}`} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="text-lg font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="text-right font-medium tabular-nums">{valor}</dd>
    </div>
  );
}
