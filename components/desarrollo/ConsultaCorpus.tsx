"use client";

import { FileText, Search, Sparkles, TextSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { VisorDocumentoCorpus, type DocumentoAbierto } from "@/components/desarrollo/VisorDocumentoCorpus";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Resaltado } from "@/components/shared/Resaltado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CORPUS, hotelPorId, PREGUNTAS_SUGERIDAS_CORPUS } from "@/lib/fixtures/desarrollo";
import { consultar, documentoCorpus, type RespuestaConsulta } from "@/lib/sim/desarrollo/consulta";
import type { Fuente } from "@/lib/types/desarrollo";

const corto = (hotelId?: string) => hotelPorId(hotelId)?.nombre.replace("City Express ", "") ?? "";

export function ConsultaCorpus() {
  const [texto, setTexto] = useState("");
  const [pregunta, setPregunta] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<RespuestaConsulta | null>(null);
  const [abierto, setAbierto] = useState<DocumentoAbierto | null>(null);

  function lanzar(p: string) {
    const q = p.trim();
    if (!q) return;
    setTexto(q);
    setPregunta(q);
    setRespuesta(consultar(q));
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Consulta del corpus"
        description={`Pregunta sobre los ${CORPUS.length} hoteles de referencia. Cada respuesta cita hotel, documento y página.`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/desarrollo/corpus" />}>
            Ver corpus
          </Button>
        }
      />

      <form
        role="search"
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          lanzar(texto);
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Label htmlFor="pregunta-corpus" className="sr-only">
            Pregunta
          </Label>
          <Input id="pregunta-corpus" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="¿Cuál es el m² por llave promedio de BOH?" className="sm:flex-1" />
          <Button type="submit" disabled={!texto.trim()}>
            <Search data-icon="inline-start" />
            Consultar
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Preguntas sugeridas">
          {PREGUNTAS_SUGERIDAS_CORPUS.map((p) => (
            <li key={p}>
              <Button type="button" variant="secondary" size="sm" className="h-auto py-1.5 text-left whitespace-normal" onClick={() => lanzar(p)}>
                {p}
              </Button>
            </li>
          ))}
        </ul>
      </form>

      <section aria-live="polite" aria-label="Respuesta" className="flex min-w-0 flex-col gap-4">
        {!respuesta ? (
          <EmptyState icon={Sparkles} title="Haz una pregunta" description="Las respuestas se arman con los documentos procesados del corpus; cada dato trae su fuente." />
        ) : respuesta.origen === "consulta" ? (
          <RespuestaConsultaCard consulta={respuesta.consulta} onAbrir={setAbierto} />
        ) : (
          <ResultadosTexto pregunta={pregunta ?? ""} respuesta={respuesta} onAbrir={setAbierto} />
        )}
      </section>

      <VisorDocumentoCorpus abierto={abierto} onOpenChange={(o) => !o && setAbierto(null)} />
    </div>
  );
}

function RespuestaConsultaCard({ consulta, onAbrir }: { consulta: Extract<RespuestaConsulta, { origen: "consulta" }>["consulta"]; onAbrir: (d: DocumentoAbierto) => void }) {
  const hoteles = new Set(consulta.fuentes.map((f) => f.hotelId).filter(Boolean));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Respuesta
          <Badge variant="secondary">
            <Sparkles data-icon="inline-start" />
            Consulta del corpus
          </Badge>
        </CardTitle>
        <CardDescription>
          {consulta.pregunta} · {consulta.fuentes.length === 1 ? "1 fuente" : `${consulta.fuentes.length} fuentes`} de {hoteles.size === 1 ? "1 hotel" : `${hoteles.size} hoteles`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-pretty">{consulta.respuesta}</p>
        {consulta.tabla && (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {consulta.tabla.columnas.map((c, i) => (
                    <TableHead key={c} className={i > 0 ? "text-right" : undefined}>
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.tabla.filas.map((fila, i) => (
                  <TableRow key={i}>
                    {fila.map((celda, j) => (
                      <TableCell key={j} className={j > 0 ? "text-right tabular-nums" : i === consulta.tabla!.filas.length - 1 && fila[0] === "Promedio" ? "font-medium" : undefined}>
                        {celda}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Fuentes</h3>
          <ul className="flex flex-col divide-y rounded-md border">
            {consulta.fuentes.map((f, i) => (
              <FuenteFila key={i} fuente={f} onAbrir={onAbrir} />
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

export function etiquetaFuente(f: Fuente) {
  const doc = documentoCorpus(f.documento);
  return [corto(f.hotelId), doc?.titulo.split(" · ")[0] ?? f.documento, f.pagina ? `pág. ${f.pagina}` : null, f.clavePlano ?? null].filter(Boolean).join(" · ");
}

function FuenteFila({ fuente: f, onAbrir }: { fuente: Fuente; onAbrir: (d: DocumentoAbierto) => void }) {
  const disponible = !!documentoCorpus(f.documento);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0">
          {etiquetaFuente(f)}
          {f.nota && <span className="block text-xs text-muted-foreground">{f.nota}</span>}
        </span>
      </span>
      {disponible ? (
        <Button variant="outline" size="sm" onClick={() => onAbrir({ documento: f.documento, pagina: f.pagina })}>
          Ver documento
        </Button>
      ) : (
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/desarrollo/corpus" />}>
          Ver en el corpus
        </Button>
      )}
    </li>
  );
}

function ResultadosTexto({ pregunta, respuesta, onAbrir }: { pregunta: string; respuesta: Extract<RespuestaConsulta, { origen: "texto" }>; onAbrir: (d: DocumentoAbierto) => void }) {
  if (respuesta.resultados.length === 0) {
    return <EmptyState icon={TextSearch} title="Sin coincidencias" description={`No encontramos "${pregunta}" en las memorias ni en los catálogos del corpus.`} />;
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">
          <TextSearch data-icon="inline-start" />
          Resultado por texto
        </Badge>
        No hay una consulta precomputada para esta pregunta; estos son los párrafos del corpus que más se parecen.
      </p>
      <ul className="flex flex-col gap-3">
        {respuesta.resultados.map((r) => (
          <li key={r.id}>
            <Card size="sm">
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{etiquetaFuente({ tipo: "corpus", hotelId: r.hotelId, documento: r.documento, pagina: r.pagina })}</span>
                  <Button variant="outline" size="sm" onClick={() => onAbrir({ documento: r.documento, pagina: r.pagina })}>
                    Ver documento
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">
                  <Resaltado segmentos={r.segmentos} />
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
