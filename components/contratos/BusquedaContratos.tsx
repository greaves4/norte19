"use client";

import { BookOpen, Search, Sparkles, TextSearch } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNow } from "@/lib/demo";
import { PREGUNTAS_SUGERIDAS } from "@/lib/fixtures/contratos/consultas";
import { buscar, totalFragmentos, type ModoBusqueda, type RespuestaBusqueda, type Resultado, type Segmento } from "@/lib/sim/contratos/busqueda";
import { estatusVigencia } from "@/lib/sim/contratos/vencimientos";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_VIGENCIA, NOMBRE_TIPO_CONTRATO, type Contrato, type EstatusVigencia, type TipoContrato } from "@/lib/types/contratos";

const TODOS = "todos";
type Filtros = { tipo: string; vigencia: string; contraparte: string };

export function BusquedaContratos() {
  const hidratado = useContratosHydrated();
  const contratos = useContratos((s) => s.contratos);
  const now = useNow(60_000);
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<ModoBusqueda>("inteligente");
  const [consulta, setConsulta] = useState<{ pregunta: string; modo: ModoBusqueda } | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ tipo: TODOS, vigencia: TODOS, contraparte: TODOS });

  const porId = useMemo(() => new Map(contratos.map((c) => [c.id, c])), [contratos]);
  const conTexto = useMemo(() => contratos.filter((c) => !c.solicitudId), [contratos]);
  const respuesta = useMemo<RespuestaBusqueda | null>(
    () => (consulta && hidratado ? buscar(consulta.pregunta, consulta.modo, { contratos, now }) : null),
    // El reloj solo importa para la consulta de vencimientos; se recalcula al buscar o cambiar de modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consulta, hidratado, contratos],
  );

  function lanzar(pregunta: string, m: ModoBusqueda = modo) {
    const p = pregunta.trim();
    if (!p) return;
    setTexto(p);
    setConsulta({ pregunta: p, modo: m });
  }

  const pasaFiltros = (c: Contrato | undefined) =>
    !!c &&
    (filtros.tipo === TODOS || c.tipo === filtros.tipo) &&
    (filtros.vigencia === TODOS || estatusVigencia(c.vigenciaFin, now) === filtros.vigencia) &&
    (filtros.contraparte === TODOS || c.id === filtros.contraparte);

  const grupos = useMemo(() => {
    if (!respuesta) return [];
    const m = new Map<string, Resultado[]>();
    for (const r of respuesta.resultados) m.set(r.contratoId, [...(m.get(r.contratoId) ?? []), r]);
    return [...m.entries()].map(([id, rs]) => ({ contrato: porId.get(id), resultados: rs }));
  }, [respuesta, porId]);
  const visibles = grupos.filter((g) => pasaFiltros(g.contrato));
  const ocultos = grupos.length - visibles.length;
  const filtrosActivos = Object.values(filtros).some((v) => v !== TODOS);

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Búsqueda inteligente"
        description={`Pregunta en lenguaje natural sobre ${conTexto.length} contratos (${totalFragmentos()} cláusulas indexadas, incluidos 2 digitalizados por OCR).`}
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
          <Label htmlFor="pregunta" className="sr-only">
            Pregunta
          </Label>
          <Input
            id="pregunta"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="¿Qué contratos tienen penalización por terminación anticipada?"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={!texto.trim()}>
            <Search data-icon="inline-start" />
            Buscar
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[modo]}
            onValueChange={(v) => {
              const m = v[0] as ModoBusqueda | undefined;
              if (!m) return;
              setModo(m);
              if (consulta) setConsulta({ pregunta: consulta.pregunta, modo: m });
            }}
            aria-label="Modo de búsqueda"
          >
            <ToggleGroupItem value="exacto">
              <TextSearch data-icon="inline-start" />
              Texto exacto
            </ToggleGroupItem>
            <ToggleGroupItem value="inteligente">
              <Sparkles data-icon="inline-start" />
              Inteligente
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-xs text-muted-foreground">
            {modo === "exacto" ? "Busca las palabras tal cual; no reconoce sinónimos ni otra redacción." : "Entiende la pregunta aunque el contrato lo diga con otras palabras."}
          </span>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Preguntas sugeridas">
          {PREGUNTAS_SUGERIDAS.map((p) => (
            <li key={p}>
              <Button type="button" variant="secondary" size="sm" className="h-auto py-1.5 text-left whitespace-normal" onClick={() => lanzar(p)}>
                {p}
              </Button>
            </li>
          ))}
        </ul>
      </form>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Filtros" className="flex flex-col gap-4 lg:border-r lg:pr-5">
          <h2 className="text-sm font-medium">Filtros</h2>
          <Filtro
            id="f-tipo"
            etiqueta="Tipo"
            valor={filtros.tipo}
            opciones={[{ value: TODOS, label: "Todos" }, ...(Object.keys(NOMBRE_TIPO_CONTRATO) as TipoContrato[]).map((t) => ({ value: t, label: NOMBRE_TIPO_CONTRATO[t] }))]}
            onChange={(tipo) => setFiltros((f) => ({ ...f, tipo }))}
          />
          <Filtro
            id="f-vigencia"
            etiqueta="Vigencia"
            valor={filtros.vigencia}
            opciones={[{ value: TODOS, label: "Todas" }, ...(Object.keys(ESTATUS_VIGENCIA) as EstatusVigencia[]).map((e) => ({ value: e, label: ESTATUS_VIGENCIA[e].label }))]}
            onChange={(vigencia) => setFiltros((f) => ({ ...f, vigencia }))}
          />
          <Filtro
            id="f-contraparte"
            etiqueta="Contraparte"
            valor={filtros.contraparte}
            opciones={[{ value: TODOS, label: "Todas" }, ...conTexto.map((c) => ({ value: c.id, label: c.contraparte }))]}
            onChange={(contraparte) => setFiltros((f) => ({ ...f, contraparte }))}
          />
          {filtrosActivos && (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setFiltros({ tipo: TODOS, vigencia: TODOS, contraparte: TODOS })}>
              Quitar filtros
            </Button>
          )}
        </aside>

        <section aria-live="polite" aria-label="Resultados" className="flex min-w-0 flex-col gap-4">
          {!respuesta ? (
            <EmptyState icon={Search} title="Haz una pregunta" description="Escribe tu pregunta o elige una sugerida. Cada resultado liga a la cláusula y la página del contrato." />
          ) : (
            <>
              {respuesta.origen === "consulta" && respuesta.respuesta ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      Respuesta
                      <Badge variant="secondary">
                        <Sparkles data-icon="inline-start" />
                        Inteligente
                      </Badge>
                    </CardTitle>
                    <CardDescription>Con base en {respuesta.resultados.length === 1 ? "1 cláusula" : `${respuesta.resultados.length} cláusulas`} de los contratos.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-pretty">{respuesta.respuesta}</p>
                    <ul className="flex flex-wrap gap-2" aria-label="Fuentes">
                      {respuesta.resultados.map((r) => (
                        <li key={`${r.contratoId}-${r.clausula}`}>
                          <a href={`#${anclaDe(r)}`} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs underline-offset-4 hover:bg-muted hover:underline">
                            {ciudadDe(porId.get(r.contratoId))} · {r.clausula} · pág. {r.pagina}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {consulta?.modo === "exacto" ? (
                    <>
                      Coincidencias exactas de <span className="font-medium text-foreground">{respuesta.terminos.join(" + ")}</span>: {respuesta.resultados.length === 1 ? "1 cláusula" : `${respuesta.resultados.length} cláusulas`}.
                    </>
                  ) : (
                    <>Resultado por texto: no hay una consulta conocida para esta pregunta; se muestran las cláusulas que más se parecen.</>
                  )}
                </p>
              )}

              {ocultos > 0 && (
                <p className="text-sm text-muted-foreground">
                  {ocultos === 1 ? "1 contrato oculto" : `${ocultos} contratos ocultos`} por los filtros.
                </p>
              )}

              {visibles.length === 0 ? (
                <EmptyState
                  icon={TextSearch}
                  title="Sin coincidencias"
                  description={
                    consulta?.modo === "exacto"
                      ? "Ninguna cláusula contiene todas esas palabras. El modo Inteligente reconoce otras formas de decirlo."
                      : "Prueba con otras palabras o quita los filtros."
                  }
                  action={
                    consulta?.modo === "exacto" ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setModo("inteligente");
                          lanzar(consulta.pregunta, "inteligente");
                        }}
                      >
                        <Sparkles data-icon="inline-start" />
                        Buscar en modo Inteligente
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="flex flex-col gap-4">
                  {visibles.map(({ contrato, resultados }) => (
                    <li key={contrato!.id}>
                      <TarjetaContrato contrato={contrato!} resultados={resultados.slice(0, 3)} extra={resultados.length - 3} now={now} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const anclaDe = (r: Pick<Resultado, "contratoId" | "clausula">) => `r-${r.contratoId}-${r.clausula.replace(/\s+/g, "-").toLowerCase()}`;

function ciudadDe(c: Contrato | undefined) {
  if (!c) return "";
  return c.titulo.includes("City Express") ? c.titulo.split("City Express ").pop()! : c.contraparte.split(",")[0];
}

function TarjetaContrato({ contrato: c, resultados, extra, now }: { contrato: Contrato; resultados: Resultado[]; extra: number; now: Date }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Link href={`/contratos/repositorio/${c.id}`} className="underline-offset-4 hover:underline">
            {c.contraparte}
          </Link>
          <StatusBadge status={estatusVigencia(c.vigenciaFin, now)} map={ESTATUS_VIGENCIA} />
        </CardTitle>
        <CardDescription>
          {c.folio} · {NOMBRE_TIPO_CONTRATO[c.tipo]} · {ciudadDe(c)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {resultados.map((r) => (
          <div key={r.clausula} id={anclaDe(r)} className="flex scroll-mt-20 flex-col gap-2 border-l-2 pl-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Cláusula {r.clausula} · {r.titulo} · pág. {r.pagina}
              </span>
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/contratos/repositorio/${c.id}?pagina=${r.pagina}`} />}>
                <BookOpen data-icon="inline-start" />
                Abrir en la cláusula
              </Button>
            </div>
            <p className="text-sm leading-relaxed">
              <Resaltado segmentos={r.segmentos} />
            </p>
          </div>
        ))}
        {extra > 0 && <p className="text-xs text-muted-foreground">{extra === 1 ? "1 cláusula más" : `${extra} cláusulas más`} en este contrato.</p>}
      </CardContent>
    </Card>
  );
}

function Resaltado({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.resaltado ? (
          // TODO tokens: color de resaltado de búsqueda; hoy el acento neutro del tema.
          <mark key={i} className="rounded-sm bg-accent px-0.5 font-medium text-accent-foreground">
            {s.texto}
          </mark>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}

function Filtro({ id, etiqueta, valor, opciones, onChange }: { id: string; etiqueta: string; valor: string; opciones: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Select items={opciones} value={valor} onValueChange={(v) => onChange((v as string | null) ?? TODOS)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
