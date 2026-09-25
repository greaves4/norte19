"use client";

import { ArrowRight, BookMarked, CheckCircle2, Circle, CircleDot, Download, FileInput, Gauge, Library, ListChecks, Lock, OctagonAlert, ScrollText, ShieldCheck, Table2 } from "lucide-react";
import Link from "next/link";
import { MapaTerreno } from "@/components/desarrollo/MapaTerreno";
import { puedeVerDesarrollo } from "@/components/desarrollo/DesarrolloShell";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { GateBanner } from "@/components/shared/GateBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { m2Construidos } from "@/lib/sim/desarrollo/benchmark";
import { estadoFases, estadoModulos, type EstadoModulo, type EstadoPaso } from "@/lib/sim/desarrollo/fases";
import { evaluarInputs } from "@/lib/sim/desarrollo/gates";
import { calcularAvance } from "@/lib/sim/desarrollo/semaforo";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { cn } from "@/lib/utils";

const P = "/desarrollo/proyectos/juarez";
const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// TODO tokens: colores de estado para las fases; hoy se distinguen por ícono y texto.
const ICONO_PASO: Record<EstadoPaso, typeof Circle> = { completo: CheckCircle2, en_curso: CircleDot, detenido: OctagonAlert, pendiente: Circle };
const TEXTO_PASO: Record<EstadoPaso, string> = { completo: "Completa", en_curso: "En curso", detenido: "Detenida", pendiente: "Pendiente" };

const MODULOS = [
  { id: "inputs", titulo: "Inputs", descripcion: "Obligatorios y complementarios del estándar", href: `${P}/inputs`, icono: FileInput },
  { id: "definicion", titulo: "Fase de Definición", descripcion: "Cuadro de áreas, marca, decisiones, riesgos y CAPEX", href: `${P}/definicion`, icono: ScrollText },
  { id: "criterios", titulo: "Criterios por disciplina", descripcion: "Criterios de diseño con fuente en el corpus", href: `${P}/criterios`, icono: BookMarked },
  { id: "completitud", titulo: "Completitud", descripcion: "Checklist de entregables y carga del paquete", href: `${P}/completitud`, icono: ListChecks },
  { id: "catalogos", titulo: "Catálogos de obra", descripcion: "Conceptos por ratio del corpus", href: `${P}/catalogos`, icono: Table2 },
  { id: "semaforo", titulo: "Semáforo y trazabilidad", descripcion: "Avance ponderado de 13 entregables", href: `${P}/semaforo`, icono: Gauge },
  { id: "auditoria", titulo: "Auditoría", descripcion: "Auditoría integral del paquete ejecutivo", href: `${P}/auditoria`, icono: ShieldCheck },
  { id: "reporte", titulo: "Reporte de auditoría", descripcion: "Score, hallazgos, clash report y plan de acción", href: `${P}/auditoria/reporte`, icono: Library },
] as const;

const VARIANTE_MODULO: Record<EstadoModulo["estado"], "secondary" | "outline" | "destructive"> = { listo: "secondary", en_curso: "outline", atencion: "destructive", bloqueado: "outline" };
const TEXTO_MODULO: Record<EstadoModulo["estado"], string> = { listo: "Listo", en_curso: "En curso", atencion: "Atención", bloqueado: "Bloqueado" };

export function TableroProyecto() {
  const p = useDesarrollo((s) => s.proyecto);
  const { perfil } = useActorDesarrollo();
  const fases = estadoFases(p);
  const actual = fases.find((f) => f.estado === "en_curso" || f.estado === "detenido") ?? fases[fases.length - 1];
  const modulos = estadoModulos(p);
  const gate = evaluarInputs(p.inputs);
  const avance = calcularAvance(p.semaforo);
  const construidos = m2Construidos(p.definicion.cuadroAreas);

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{p.segmento}</Badge>
            <Badge variant="outline">
              Fase 0{actual.fase} · {actual.nombre}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-balance">{p.nombre}</h1>
          <p className="text-muted-foreground">{p.terreno.direccion}</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Dato etiqueta="Llaves" valor={n(p.llaves)} />
            <Dato etiqueta="Niveles" valor={n(p.niveles)} />
            <Dato etiqueta="Terreno" valor={`${n(p.terreno.superficieM2)} m²`} />
            <Dato etiqueta="Construidos (anteproyecto)" valor={`${n(construidos)} m²`} />
          </dl>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Avance del semáforo</span>
              <span className="font-semibold tabular-nums">{Math.round(avance * 100)}%</span>
            </div>
            <Progress value={avance * 100} aria-label="Avance del semáforo" />
          </div>
        </header>
        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <MapaTerreno superficie={p.terreno.superficieM2} className="w-full" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {p.terreno.lat.toFixed(4)}, {p.terreno.lng.toFixed(4)}
              </span>
              <a href="/fixtures/desarrollo/terreno.kmz" download className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                <Download className="size-3" aria-hidden />
                terreno.kmz
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {gate.nivel === 1 && (
        <GateBanner
          variant="bloqueado"
          title="Proceso detenido"
          description={`Reporte de insuficiencia: falta ${gate.faltantes.map((f) => f.input.nombre).join(", ")}. Impacto: ${gate.faltantes.map((f) => f.impacto.charAt(0).toLowerCase() + f.impacto.slice(1)).join(" ")}`}
          action={
            puedeVerDesarrollo(perfil, `${P}/inputs`) ? (
              <Button size="sm" nativeButton={false} render={<Link href={`${P}/inputs`} />}>
                Resolver en Inputs
              </Button>
            ) : undefined
          }
        />
      )}

      <section aria-labelledby="fases" className="flex flex-col gap-3">
        <h2 id="fases" className="text-sm font-medium">
          Fases del estándar
        </h2>
        <ol className="grid gap-2 md:grid-cols-5">
          {fases.map((f) => {
            const Icono = ICONO_PASO[f.estado];
            return (
              <li key={f.fase} className={cn("flex flex-col gap-1 rounded-lg border p-3", f.estado === "en_curso" && "border-foreground", f.estado === "detenido" && "border-destructive")} aria-current={f.estado === "en_curso" || f.estado === "detenido" ? "step" : undefined}>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icono className={cn("size-4", f.estado === "detenido" && "text-destructive")} aria-hidden />
                  0{f.fase} · {TEXTO_PASO[f.estado]}
                </span>
                <span className="font-medium">{f.nombre}</span>
                <span className="text-xs text-muted-foreground">{f.detalle}</span>
                {f.gate && (
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden />
                    {f.gate}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="modulos" className="flex flex-col gap-3">
        <h2 id="modulos" className="text-sm font-medium">
          Módulos
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {MODULOS.map((m) => {
            const e = modulos[m.id];
            const accesible = puedeVerDesarrollo(perfil, m.href) && e.estado !== "bloqueado";
            const Icono = m.icono;
            const contenido = (
              <Card size="sm" className={cn("h-full transition-colors", accesible ? "group-hover:bg-muted/50" : "opacity-70")}>
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Icono className="size-5 text-muted-foreground" aria-hidden />
                    <Badge variant={VARIANTE_MODULO[e.estado]}>{TEXTO_MODULO[e.estado]}</Badge>
                  </div>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {m.titulo}
                    {accesible && <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />}
                  </CardTitle>
                  <CardDescription>{m.descripcion}</CardDescription>
                  <p className="text-sm">{e.texto}</p>
                  {!puedeVerDesarrollo(perfil, m.href) && <p className="text-xs text-muted-foreground">No disponible para tu perfil.</p>}
                </CardHeader>
              </Card>
            );
            return (
              <li key={m.id}>
                {accesible ? (
                  <Link href={m.href} className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    {contenido}
                  </Link>
                ) : (
                  contenido
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <Bitacora eventos={p.bitacora} />
    </div>
  );
}

function Bitacora({ eventos }: { eventos: { fecha: string; titulo: string; actor: string; descripcion?: string }[] }) {
  const recientes = [...eventos].reverse().slice(0, 6);
  return (
    <section aria-labelledby="bitacora" className="flex flex-col gap-2">
      <h2 id="bitacora" className="text-sm font-medium">
        Bitácora reciente
      </h2>
      <ol className="flex flex-col divide-y rounded-lg border text-sm">
        {recientes.map((e, i) => (
          <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2">
            <span>
              <span className="font-medium">{e.titulo}</span>
              {e.descripcion && <span className="text-muted-foreground"> · {e.descripcion}</span>}
            </span>
            <span className="text-xs text-muted-foreground">
              {e.actor} · {new Date(e.fecha).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </li>
        ))}
      </ol>
    </section>
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
