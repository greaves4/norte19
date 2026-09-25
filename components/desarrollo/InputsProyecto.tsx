"use client";

import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { UploadZone, type UploadFixture, type UploadValue } from "@/components/shared/UploadZone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { archivoDeUpload } from "@/lib/archivos";
import { evaluarInputs } from "@/lib/sim/desarrollo/gates";
import { useDesarrollo } from "@/lib/store/desarrollo";
import type { InputId, InputProyecto } from "@/lib/types/desarrollo";

const P = "/desarrollo/proyectos/juarez";

// Archivo de ejemplo por input (public/fixtures/desarrollo/inputs, generados con pnpm gen:desarrollo-inputs).
const EJEMPLO: Partial<Record<InputId, string>> = {
  anteproyecto: "anteproyecto-juarez.pdf",
  uso_suelo: "uso-de-suelo-juarez.pdf",
  mecanica_suelos: "mecanica-suelos-juarez.pdf",
  topografia: "topografia-juarez.pdf",
  brand_standards: "brand-standards-city-express.pdf",
  programa: "programa-juarez.pdf",
  capex_objetivo: "capex-objetivo-juarez.pdf",
  reglamento: "reglamento-juarez.pdf",
  estudio_mercado: "estudio-mercado-juarez.pdf",
};

const NOMBRE_ENTREGABLE: Record<string, string> = { capex: "CAPEX", marca: "Validación de marca", cuadro_areas: "Cuadro de áreas", arquitectura: "Arquitectura" };

export function InputsProyecto() {
  const p = useDesarrollo((s) => s.proyecto);
  const cargarInput = useDesarrollo((s) => s.cargarInput);
  const { actor } = useActorDesarrollo();
  const gate = evaluarInputs(p.inputs);

  async function cargar(input: InputProyecto, value: UploadValue | null) {
    const faseAntes = useDesarrollo.getState().proyecto.fase;
    if (!value) {
      cargarInput(input.id, null, actor);
      if (input.obligatorio && faseAntes > 1 && faseAntes < 4) toast.warning(`Se retiró ${input.nombre}`, { description: "El proceso vuelve a detenerse en la Fase 01." });
      else toast.info(`Se retiró ${input.nombre}`);
      return;
    }
    const archivo = await archivoDeUpload(value);
    cargarInput(input.id, { nombre: archivo.nombre, src: archivo.src, tipo: archivo.tipo, tamano: archivo.tamano }, actor);
    const faseDespues = useDesarrollo.getState().proyecto.fase;
    if (faseAntes === 1 && faseDespues === 2) {
      toast.success("Gate de inputs liberado", { description: "Fase 02 · Retrieval: se recuperaron las referencias de los 5 hoteles del corpus." });
    } else {
      toast.success(`${input.nombre} cargado`, { description: !input.obligatorio && input.afecta.length ? "El supuesto documentado se retira." : undefined });
    }
  }

  const obligatorios = p.inputs.filter((i) => i.obligatorio);
  const complementarios = p.inputs.filter((i) => !i.obligatorio);

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Inputs del proyecto"
        description="Los obligatorios detienen el proceso si faltan; los complementarios se sustituyen con un supuesto documentado."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={P} />}>
            Tablero
          </Button>
        }
      />

      {gate.nivel === 1 ? (
        <GateBanner
          variant="bloqueado"
          title="Proceso detenido · nivel 1"
          description={`Reporte de insuficiencia: falta ${gate.faltantes.map((f) => f.input.nombre).join(", ")}.`}
          items={gate.faltantes.map((f) => `Impacto: ${f.impacto}`)}
        />
      ) : (
        <GateBanner
          variant="aprobado"
          title="Gate de inputs liberado"
          description="Los obligatorios están completos; el proyecto avanzó a la Fase 02."
          action={
            p.fase < 4 ? (
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`${P}/definicion`} />}>
                Ir a la Fase de Definición
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : undefined
          }
        />
      )}
      {gate.supuestos.length > 0 && (
        <GateBanner
          variant="advertencia"
          title={`Supuesto documentado · nivel 2 (${gate.supuestos.length})`}
          items={gate.supuestos.map(
            (s) => `${s.input.nombre}: ${s.impacto}${s.entregables.length ? ` Entregable en ámbar: ${s.entregables.map((e) => NOMBRE_ENTREGABLE[e] ?? e).join(", ")}.` : ""}`,
          )}
        />
      )}

      <Seccion titulo="Obligatorios" descripcion="Sin ellos no avanza el proceso." inputs={obligatorios} onCargar={cargar} />
      <Seccion titulo="Complementarios" descripcion="Si faltan, se documenta el supuesto y el entregable afectado queda en ámbar." inputs={complementarios} onCargar={cargar} />
    </div>
  );
}

function Seccion({ titulo, descripcion, inputs, onCargar }: { titulo: string; descripcion: string; inputs: InputProyecto[]; onCargar: (i: InputProyecto, v: UploadValue | null) => void }) {
  const cargados = inputs.filter((i) => i.archivo).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {titulo} · {cargados} de {inputs.length}
        </CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {inputs.map((i) => (
            <li key={i.id} className="grid grid-cols-[minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {i.archivo ? <CheckCircle2 className="size-4 shrink-0" aria-hidden /> : <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className="font-medium">{i.nombre}</span>
                  {!i.archivo && <Badge variant={i.obligatorio ? "destructive" : "outline"}>{i.obligatorio ? "Falta · bloquea" : "Falta · supuesto"}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{i.descripcion}</p>
                {i.archivo && i.archivo.tipo === "pdf" && (
                  <a href={i.archivo.src} target="_blank" rel="noreferrer" className="self-start text-xs underline-offset-4 hover:underline">
                    Abrir {i.archivo.nombre}
                  </a>
                )}
                {i.id === "corpus" && (
                  <Link href="/desarrollo/corpus/consulta" className="self-start text-xs underline-offset-4 hover:underline">
                    Consultar el corpus
                  </Link>
                )}
              </div>
              {i.id === "corpus" ? (
                <span className="text-sm text-muted-foreground">Procesado · 5 hoteles, 24 documentos indexados</span>
              ) : (
                <UploadZone
                  compacto
                  accept=".pdf,.dwg,.kmz,image/*"
                  label="Arrastra o selecciona"
                  fixtures={fixtureDe(i)}
                  archivo={i.archivo ? { nombre: i.archivo.nombre, tamano: i.archivo.tamano } : null}
                  onFile={(v) => void onCargar(i, v)}
                />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function fixtureDe(i: InputProyecto): UploadFixture[] {
  const archivo = EJEMPLO[i.id];
  return archivo ? [{ id: i.id, name: `${i.nombre} (ejemplo)`, src: `/fixtures/desarrollo/inputs/${archivo}`, type: "application/pdf" }] : [];
}
