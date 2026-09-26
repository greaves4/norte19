"use client";

import { FileSearch, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RequiereFase } from "@/components/desarrollo/RequiereFase";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { GateBanner } from "@/components/shared/GateBanner";
import { Indicador } from "@/components/shared/Indicador";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressRunner } from "@/components/shared/ProgressRunner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { crearHallazgos } from "@/lib/fixtures/desarrollo/hallazgos";
import { NOMBRE_RUBRO, pasosAuditoria, RUBROS, rubroDePaso } from "@/lib/sim/desarrollo/auditoria";
import { puedeAuditar, verificar } from "@/lib/sim/desarrollo/completitud";
import { useDesarrollo } from "@/lib/store/desarrollo";
import type { Rubro, Severidad } from "@/lib/types/desarrollo";

const REPORTE = "/desarrollo/proyectos/juarez/auditoria/reporte";

export function AuditoriaProyecto() {
  const p = useDesarrollo((s) => s.proyecto);
  const ejecutar = useDesarrollo((s) => s.ejecutarAuditoria);
  const { perfil, actor } = useActorDesarrollo();
  const router = useRouter();
  const [corriendo, setCorriendo] = useState(false);
  const hallazgos = useMemo(() => crearHallazgos(), []);
  const pasos = useMemo(() => pasosAuditoria(p.paquete ?? [], hallazgos), [p.paquete, hallazgos]);

  if (p.fase < 4) return <RequiereFase titulo="Auditoría integral" descripcion="Revisión del paquete ejecutivo en seis rubros con score y plan de acción." />;

  const gate = puedeAuditar(p);
  const r = p.paquete ? verificar(p.paquete) : null;
  const revisor = perfil === "revisor";

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Auditoría integral"
        description="El motor revisa el paquete ejecutivo en seis rubros (coordinación, operación, marca, constructibilidad, calidad documental y riesgo económico) y genera el reporte con score y plan de acción."
        actions={
          p.auditoria && !corriendo ? (
            <Button variant="outline" nativeButton={false} render={<Link href={REPORTE} />}>
              <FileSearch data-icon="inline-start" />
              Ver reporte
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Gate documental del paquete</CardTitle>
          <CardDescription>Lo que recibe el motor. La completitud se revisa en el módulo de Completitud.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {r && (
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <li>
                <Indicador etiqueta="Archivos" valor={p.paquete!.length} nota={`${r.noIdentificados.length} sin clave de plano`} />
              </li>
              <li>
                <Indicador etiqueta="Completitud" valor={`${Math.round(r.porcentaje * 100)}%`} nota={`${r.entregables.length - r.faltantes.length} de ${r.entregables.length} entregables`} />
              </li>
              <li>
                <Indicador etiqueta="Faltantes críticos" valor={r.faltantesCriticos.length} nota={r.faltantesCriticos.map((f) => f.clave).join(", ") || "Ninguno"} />
              </li>
              <li>
                <Indicador etiqueta="Verificación" valor="2D" nota="Geométrica sobre plantas; sin BIM federado" />
              </li>
            </ul>
          )}
          {gate.puede ? (
            <GateBanner
              variant={p.notaSupuestoPaquete ? "advertencia" : "aprobado"}
              title={p.notaSupuestoPaquete ? "Listo para auditar con supuesto documentado" : "Listo para auditar"}
              description={p.notaSupuestoPaquete ?? "El paquete no tiene faltantes críticos."}
            />
          ) : (
            <GateBanner
              variant="bloqueado"
              title="Aún no se puede auditar"
              description={gate.motivo}
              action={
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/desarrollo/proyectos/juarez/completitud" />}>
                  Ir a Completitud
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {corriendo ? (
        <Ejecucion
          pasos={pasos}
          hallazgos={hallazgos}
          onFin={() => {
            ejecutar(hallazgos, actor);
            toast.success("Auditoría terminada", { description: `${hallazgos.length} hallazgos. Abriendo el reporte.` });
            router.push(REPORTE);
          }}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5 text-sm">
              {p.auditoria ? (
                <>
                  <span className="font-medium">Última ejecución: {new Date(p.auditoria.ejecutadaEn).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}</span>
                  <span className="text-muted-foreground">
                    Por {p.auditoria.ejecutadaPor} · {p.auditoria.hallazgos.length} hallazgos. Volver a ejecutar reinicia las revisiones del reporte.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium">Cinco fases del estándar, unos 25 segundos</span>
                  <span className="text-muted-foreground">Inputs, Indexation, Audit engine (A–F), Reporting y QA / Cierre.</span>
                </>
              )}
              {!revisor && <span className="text-muted-foreground">La ejecuta el revisor experto.</span>}
            </div>
            <Button
              disabled={!gate.puede || !revisor}
              variant={p.auditoria ? "outline" : "default"}
              onClick={() => {
                if (p.auditoria && !window.confirm("Se reiniciarán las revisiones del reporte actual. ¿Continuar?")) return;
                setCorriendo(true);
              }}
            >
              <Play data-icon="inline-start" />
              {p.auditoria ? "Volver a ejecutar" : "Ejecutar auditoría"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Revela los hallazgos del rubro en curso a lo largo de su paso; "Saltar" completa todos.
function Ejecucion({ pasos, hallazgos, onFin }: { pasos: ReturnType<typeof pasosAuditoria>; hallazgos: ReturnType<typeof crearHallazgos>; onFin: () => void }) {
  const [hechos, setHechos] = useState<string[]>([]);
  const [fraccion, setFraccion] = useState(0);
  const inicioPaso = useRef(0);
  const contenedor = useRef<HTMLDivElement>(null);

  // Cuerpo con llaves: scrollIntoView devuelve una promesa en Chrome reciente y React la trataría como limpieza.
  useEffect(() => {
    contenedor.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const actual = pasos.find((s) => !hechos.includes(s.id));
  const rubroActual = actual ? rubroDePaso(actual.id) : null;

  useEffect(() => {
    inicioPaso.current = performance.now();
    setFraccion(0);
    if (!rubroActual || !actual) return;
    const id = setInterval(() => setFraccion(Math.min(1, (performance.now() - inicioPaso.current) / actual.durationMs)), 150);
    return () => clearInterval(id);
  }, [actual, rubroActual]);

  const rubrosHechos = new Set(hechos.map(rubroDePaso).filter(Boolean) as Rubro[]);
  const enCurso = rubroActual ? hallazgos.filter((h) => h.rubro === rubroActual) : [];
  const visibles = [...hallazgos.filter((h) => rubrosHechos.has(h.rubro)), ...enCurso.slice(0, Math.floor(fraccion * enCurso.length))];
  const cuenta = (s: Severidad) => visibles.filter((h) => h.severidad === s).length;

  return (
    <div ref={contenedor} className="grid scroll-mt-4 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ProgressRunner title="Auditoría integral" steps={pasos} autoStart onStepDone={(id) => setHechos((h) => (h.includes(id) ? h : [...h, id]))} onDone={onFin} />
      <Card>
        <CardHeader>
          <CardTitle aria-live="polite">
            <span className="tabular-nums" data-contador-hallazgos>
              {visibles.length}
            </span>{" "}
            hallazgos
          </CardTitle>
          <CardDescription>
            {cuenta("critico")} críticos · {cuenta("medio")} medios · {cuenta("menor")} menores
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-wrap gap-1.5" aria-label="Avance por rubro">
            {RUBROS.map((rb) => (
              <li key={rb.id}>
                <Badge variant={rubrosHechos.has(rb.id) ? "secondary" : rb.id === rubroActual ? "default" : "outline"}>
                  {rb.letra} · {rb.nombre}
                </Badge>
              </li>
            ))}
          </ul>
          <ol className="flex max-h-72 flex-col divide-y overflow-y-auto text-sm">
            {[...visibles].reverse().map((h) => (
              <li key={h.id} className="flex gap-2 py-1.5">
                <span className="w-11 shrink-0 font-mono text-xs">{h.id}</span>
                <span className="min-w-0 flex-1">{h.descripcion}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{NOMBRE_RUBRO[h.rubro]}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
