"use client";

import { FileSignature, Stamp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CapexTab } from "@/components/desarrollo/definicion/CapexTab";
import { CuadroAreasTab } from "@/components/desarrollo/definicion/CuadroAreasTab";
import { DecisionesTab } from "@/components/desarrollo/definicion/DecisionesTab";
import { MarcaTab } from "@/components/desarrollo/definicion/MarcaTab";
import { RiesgosTab } from "@/components/desarrollo/definicion/RiesgosTab";
import { puedeVerDesarrollo } from "@/components/desarrollo/DesarrolloShell";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoNow } from "@/lib/demo";
import { compararCuadro } from "@/lib/sim/desarrollo/benchmark";
import { calcularCapex } from "@/lib/sim/desarrollo/capex";
import { evaluarInputs } from "@/lib/sim/desarrollo/gates";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { NOMBRE_ZONA, type Proyecto } from "@/lib/types/desarrollo";

const P = "/desarrollo/proyectos/juarez";
const usd = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const cuenta = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? "" : "s"}`;

// Resumen que queda en el acta del gate (se congela al aprobar).
export function resumenDefinicion(p: Proyecto): string[] {
  const filas = compararCuadro(p.definicion.cuadroAreas, p.llaves);
  const fuera = filas.filter((f) => f.semaforo !== "verde").map((f) => `${NOMBRE_ZONA[f.zona]} ${f.desviacion > 0 ? "+" : ""}${(f.desviacion * 100).toFixed(1)}%`);
  const marca = p.definicion.marca;
  const riesgos = p.definicion.riesgos;
  const capex = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, !!p.inputs.find((i) => i.id === "capex_objetivo")?.archivo);
  const supuestos = evaluarInputs(p.inputs).supuestos;
  return [
    fuera.length ? `Cuadro de áreas: zonas fuera del rango verde: ${fuera.join(", ")}.` : "Cuadro de áreas: todas las zonas en el rango verde.",
    `Marca: ${marca.filter((m) => m.estatus === "cumple").length} de ${marca.length} requisitos cumplen; ${marca.filter((m) => m.estatus === "desvia").length} desvían.`,
    `Riesgos: ${cuenta(riesgos.filter((r) => r.estatus === "confirmado").length, "confirmado")}, ${cuenta(riesgos.filter((r) => r.estatus === "descartado").length, "descartado")}, ${cuenta(riesgos.filter((r) => r.estatus === "pendiente").length, "pendiente")}.`,
    `CAPEX: ${usd(capex.rangoPorLlave[0])} a ${usd(capex.rangoPorLlave[1])} por llave${capex.objetivo ? ` (${capex.objetivo.desviacion > 0 ? "+" : ""}${(capex.objetivo.desviacion * 100).toFixed(1)}% contra objetivo)` : " (sin objetivo aprobado)"}.`,
    supuestos.length ? `Supuestos documentados: ${supuestos.map((s) => s.input.nombre).join(", ")}.` : "Sin supuestos documentados.",
    "Decisiones de diseño: 8 con fuente en el corpus o en los inputs del sitio.",
  ];
}

export function FaseDefinicion() {
  const p = useDesarrollo((s) => s.proyecto);
  const aprobar = useDesarrollo((s) => s.aprobarGateDefinicion);
  const { perfil, actor } = useActorDesarrollo();
  const [acta, setActa] = useState(false);
  const aprobada = p.fase >= 4;
  const bloqueado = aprobada;

  if (p.fase === 1) {
    return (
      <div className="flex flex-col gap-5 p-4 md:p-6">
        <PageHeader title="Fase de Definición" description="Cuadro de áreas, marca, decisiones, riesgos y CAPEX." />
        <GateBanner
          variant="bloqueado"
          title="Proceso detenido en la Fase 01"
          description={`La Fase de Definición empieza cuando se liberan los inputs obligatorios. Falta: ${evaluarInputs(p.inputs).faltantes.map((f) => f.input.nombre).join(", ")}.`}
          action={
            puedeVerDesarrollo(perfil, `${P}/inputs`) ? (
              <Button size="sm" nativeButton={false} render={<Link href={`${P}/inputs`} />}>
                Resolver en Inputs
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const resumen = p.definicion.acta?.resumen ?? resumenDefinicion(p);

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Fase de Definición"
        description="Generada a partir del anteproyecto y del corpus. Cada dato muestra su fuente."
        actions={
          aprobada ? (
            <Button variant="outline" onClick={() => setActa(true)}>
              <FileSignature data-icon="inline-start" />
              Ver acta
            </Button>
          ) : perfil === "revisor" ? (
            <Button onClick={() => setActa(true)}>
              <Stamp data-icon="inline-start" />
              Aprobar Fase de Definición
            </Button>
          ) : undefined
        }
      />
      {aprobada ? (
        <GateBanner
          variant="aprobado"
          title={`Aprobada por ${p.definicion.acta?.aprobadoPor}`}
          description={`${new Date(p.definicion.acta?.fecha ?? "").toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })} · Se habilitaron criterios por disciplina y catálogos de obra (Fase 04).`}
        />
      ) : (
        perfil !== "revisor" && <GateBanner variant="advertencia" title="En revisión" description="El revisor experto aprueba la Fase de Definición; al aprobarla se habilitan criterios y catálogos." />
      )}

      <Tabs defaultValue="cuadro" className="gap-4">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="cuadro">Cuadro de áreas</TabsTrigger>
          <TabsTrigger value="marca">Brand standards</TabsTrigger>
          <TabsTrigger value="decisiones">Decisiones de diseño</TabsTrigger>
          <TabsTrigger value="riesgos">Mapa de riesgos</TabsTrigger>
          <TabsTrigger value="capex">CAPEX</TabsTrigger>
        </TabsList>
        <TabsContent value="cuadro">
          <CuadroAreasTab bloqueado={bloqueado} />
        </TabsContent>
        <TabsContent value="marca">
          <MarcaTab bloqueado={bloqueado} />
        </TabsContent>
        <TabsContent value="decisiones">
          <DecisionesTab />
        </TabsContent>
        <TabsContent value="riesgos">
          <RiesgosTab bloqueado={bloqueado} />
        </TabsContent>
        <TabsContent value="capex">
          <CapexTab bloqueado={bloqueado} />
        </TabsContent>
      </Tabs>

      <Dialog open={acta} onOpenChange={setActa}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{aprobada ? "Acta del gate de la Fase de Definición" : "Aprobar la Fase de Definición"}</DialogTitle>
            <DialogDescription>
              {p.nombre} · {aprobada ? `Aprobada por ${p.definicion.acta?.aprobadoPor}` : `Firma: ${actor}`} ·{" "}
              {new Date(p.definicion.acta?.fecha ?? demoNow()).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}
            </DialogDescription>
          </DialogHeader>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {resumen.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {!aprobada && <p className="text-sm text-muted-foreground">Al aprobar, el proyecto pasa a la Fase 04 (Generation) y el proyectista puede trabajar criterios, biblioteca, completitud y catálogos.</p>}
          <DialogFooter>
            {aprobada ? (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  Imprimir
                </Button>
                <Button onClick={() => setActa(false)}>Cerrar</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setActa(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (aprobar(actor, resumen)) {
                      toast.success("Fase de Definición aprobada", { description: "Fase 04 · Generation: se habilitan criterios por disciplina y catálogos de obra." });
                    } else {
                      toast.error("No se pudo aprobar", { description: "El gate de inputs está detenido." });
                    }
                    setActa(false);
                  }}
                >
                  <Stamp data-icon="inline-start" />
                  Aprobar y firmar acta
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
