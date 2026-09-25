"use client";

import { CheckCircle2, CircleDashed, FileQuestion, FolderUp, PackageOpen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { RequiereFase } from "@/components/desarrollo/RequiereFase";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { DialogoJustificacion } from "@/components/shared/DialogoJustificacion";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { archivoPaquete, PAQUETE_EJEMPLO } from "@/lib/fixtures/desarrollo/paquete";
import { puedeAuditar, verificar, type ResultadoCompletitud } from "@/lib/sim/desarrollo/completitud";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { NOMBRE_DISCIPLINA_CRITERIO, type ArchivoPaquete } from "@/lib/types/desarrollo";
import { cn } from "@/lib/utils";

const P = "/desarrollo/proyectos/juarez";
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function CompletitudPaquete() {
  const p = useDesarrollo((s) => s.proyecto);
  const cargarPaquete = useDesarrollo((s) => s.cargarPaquete);
  const continuar = useDesarrollo((s) => s.continuarConSupuesto);
  const { actor } = useActorDesarrollo();
  const [dialogo, setDialogo] = useState(false);

  if (p.fase < 4) return <RequiereFase titulo="Completitud del paquete ejecutivo" descripcion="Checklist de entregables por disciplina y carga del paquete." />;

  const r = p.paquete ? verificar(p.paquete) : null;
  const gate = puedeAuditar(p);

  function agregar(archivos: ArchivoPaquete[]) {
    const actuales = p.paquete ?? [];
    const nuevos = archivos.filter((a) => !actuales.some((x) => x.nombre === a.nombre));
    if (!nuevos.length) {
      toast.info("Esos archivos ya estaban en el paquete");
      return;
    }
    const antes = actuales.length ? verificar(actuales) : null;
    const paquete = [...actuales, ...nuevos];
    cargarPaquete(paquete, actor);
    const despues = verificar(paquete);
    const resueltos = antes ? antes.faltantes.filter((f) => !despues.faltantes.some((x) => x.id === f.id)) : [];
    toast.success(`${nuevos.length === 1 ? "1 archivo cargado" : `${nuevos.length} archivos cargados`}`, {
      description: resueltos.length
        ? `Cubre: ${resueltos.map((x) => x.nombre).join(", ")}.`
        : `${despues.faltantes.length === 0 ? "Paquete completo" : `Faltan ${despues.faltantes.length} entregables`} · ${despues.noIdentificados.length} sin identificar.`,
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Completitud del paquete ejecutivo"
        description="El proyectista carga el paquete; el sistema identifica cada archivo por su clave de plano y marca lo que falta según las secciones 5.2–5.6 del estándar."
        actions={
          p.paquete ? (
            <Button
              variant="ghost"
              onClick={() => {
                cargarPaquete(null, actor);
                toast.info("Se retiró el paquete");
              }}
            >
              <Trash2 data-icon="inline-start" />
              Quitar paquete
            </Button>
          ) : undefined
        }
      />

      <CargaPaquete
        onArchivos={agregar}
        onEjemplo={() => agregar(PAQUETE_EJEMPLO.map((n) => ({ nombre: archivoPaquete(n), src: `/fixtures/desarrollo/paquete/${encodeURIComponent(archivoPaquete(n))}` })))}
        vacio={!p.paquete}
      />

      {r && (
        <>
          {gate.puede ? (
            p.notaSupuestoPaquete && r.faltantesCriticos.length ? (
              <GateBanner variant="advertencia" title="Auditoría habilitada con nota de supuesto · nivel 2" description={p.notaSupuestoPaquete} action={<IrAuditoria />} />
            ) : (
              <GateBanner variant="aprobado" title="Paquete listo para auditoría" description={r.faltantes.length ? `Faltan ${r.faltantes.length} entregables no críticos.` : "Todos los entregables del estándar están presentes."} action={<IrAuditoria />} />
            )
          ) : (
            <GateBanner
              variant="bloqueado"
              title={`No se puede ejecutar la auditoría: ${r.faltantesCriticos.length === 1 ? "falta 1 entregable crítico" : `faltan ${r.faltantesCriticos.length} entregables críticos`}`}
              items={r.faltantesCriticos.map((f) => `${f.nombre} (${NOMBRE_DISCIPLINA_CRITERIO[f.disciplina]}, clave ${f.clave})`)}
              action={
                <Button size="sm" variant="outline" onClick={() => setDialogo(true)}>
                  Continuar con nota de supuesto
                </Button>
              }
            />
          )}

          <Resumen r={r} total={p.paquete!.length} />
          <Checklist r={r} />
        </>
      )}

      <DialogoJustificacion
        open={dialogo}
        onOpenChange={setDialogo}
        titulo="Continuar con nota de supuesto"
        descripcion="La auditoría se ejecuta sin los entregables críticos faltantes; los hallazgos de esas disciplinas se marcarán como supuestos."
        etiqueta="Nota de supuesto"
        accion="Continuar"
        ayuda="Obligatoria. Queda en la bitácora del proyecto y en el reporte de auditoría."
        onConfirmar={(nota) => {
          continuar(nota, actor);
          toast.success("Auditoría habilitada con nota de supuesto");
        }}
      />
    </div>
  );
}

function IrAuditoria() {
  return (
    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`${P}/auditoria`} />}>
      Ir a la auditoría
    </Button>
  );
}

function CargaPaquete({ onArchivos, onEjemplo, vacio }: { onArchivos: (a: ArchivoPaquete[]) => void; onEjemplo: () => void; vacio: boolean }) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  const recibir = (files: FileList | null) => {
    if (!files?.length) return;
    onArchivos([...files].map((f) => ({ nombre: f.name, tamano: f.size })));
    if (ref.current) ref.current.value = "";
  };
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSobre(false);
          recibir(e.dataTransfer.files);
        }}
        data-dragging={sobre || undefined}
        className="flex flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-6 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/50 data-dragging:bg-muted"
      >
        <FolderUp className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex flex-col">
          <span className="text-sm font-medium">{vacio ? "Arrastra el paquete ejecutivo o selecciona los archivos" : "Agregar archivos al paquete"}</span>
          <span className="text-xs text-muted-foreground">PDF, DWG, IFC o RVT · varios a la vez</span>
        </span>
        <input ref={ref} id={id} type="file" multiple accept=".pdf,.dwg,.ifc,.rvt" className="sr-only" onChange={(e) => recibir(e.target.files)} />
      </label>
      {vacio && (
        <Button variant="outline" className="h-auto" onClick={onEjemplo}>
          <PackageOpen data-icon="inline-start" />
          Usar paquete de ejemplo (60 archivos)
        </Button>
      )}
    </div>
  );
}

function Resumen({ r, total }: { r: ResultadoCompletitud; total: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Completitud por disciplina · {pct(r.porcentaje)}</CardTitle>
          <CardDescription>
            {total} archivos · {r.entregables.length - r.faltantes.length} de {r.entregables.length} entregables presentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {r.porDisciplina.map((d) => (
              <li key={d.disciplina} className="grid grid-cols-[9rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm">
                <span>{NOMBRE_DISCIPLINA_CRITERIO[d.disciplina]}</span>
                <Progress value={d.porcentaje * 100} aria-label={`${NOMBRE_DISCIPLINA_CRITERIO[d.disciplina]}: ${pct(d.porcentaje)}`} />
                <span className="text-right tabular-nums">
                  {d.presentes}/{d.total}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lo que falta antes de auditoría</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {r.faltantes.length === 0 ? (
            <p className="text-muted-foreground">Nada: el paquete cubre todos los entregables.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...r.faltantes]
                .sort((a, b) => Number(b.critico) - Number(a.critico))
                .map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-2">
                    <span>
                      {f.nombre}
                      <span className="block text-xs text-muted-foreground">
                        {NOMBRE_DISCIPLINA_CRITERIO[f.disciplina]} · clave {f.clave}
                      </span>
                    </span>
                    {f.critico && <Badge variant="destructive">Crítico</Badge>}
                  </li>
                ))}
            </ul>
          )}
          {r.noIdentificados.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-3">
              <span className="font-medium">{r.noIdentificados.length === 1 ? "1 archivo sin identificar" : `${r.noIdentificados.length} archivos sin identificar`}</span>
              <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                {r.noIdentificados.map((n) => (
                  <li key={n} className="flex items-center gap-1.5">
                    <FileQuestion className="size-3.5 shrink-0" aria-hidden />
                    {n}
                  </li>
                ))}
              </ul>
              <span className="text-xs text-muted-foreground">Renómbralos con la clave del plano (p. ej. ES-103) para que cuenten.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Checklist({ r }: { r: ResultadoCompletitud }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist de entregables</CardTitle>
        <CardDescription>Secciones 5.2–5.6 del estándar de desarrollo.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {r.porDisciplina.map((d) => (
          <section key={d.disciplina} aria-labelledby={`chk-${d.disciplina}`} className="flex flex-col gap-2">
            <h3 id={`chk-${d.disciplina}`} className="text-sm font-medium">
              {NOMBRE_DISCIPLINA_CRITERIO[d.disciplina]} · {pct(d.porcentaje)}
            </h3>
            <ul className="flex flex-col divide-y rounded-lg border">
              {r.entregables
                .filter((x) => x.entregable.disciplina === d.disciplina)
                .map(({ entregable: e, archivos, estatus }) => (
                  <li key={e.id} className={cn("grid grid-cols-[minmax(0,1fr)] gap-1 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] sm:items-center", estatus === "faltante" && "bg-muted/40")}>
                    <span className="flex items-start gap-2">
                      {estatus === "presente" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
                      <span className="min-w-0">
                        <span className="sr-only">{estatus === "presente" ? "Presente: " : "Faltante: "}</span>
                        {e.nombre}
                        <span className="block text-xs text-muted-foreground">
                          {e.seccion} · clave {e.clave}
                          {e.critico ? " · crítico" : ""}
                        </span>
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground sm:text-right" title={archivos.join(", ")}>
                      {estatus === "presente" ? (archivos.length === 1 ? archivos[0] : `${archivos.length} archivos`) : "Falta"}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
