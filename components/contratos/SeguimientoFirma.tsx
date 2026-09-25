"use client";

import { ArrowLeft, Check, Circle, FileText, Info, Library, Signature } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { SelloFirma } from "@/components/contratos/SelloFirma";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { EmptyState } from "@/components/shared/EmptyState";
import { GateBanner } from "@/components/shared/GateBanner";
import { ProgressRunner } from "@/components/shared/ProgressRunner";
import { SplitViewer } from "@/components/shared/SplitViewer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ARRENDATARIA, contraparteDe } from "@/lib/fixtures/contratos";
import { fechaHora } from "@/lib/format";
import { pasosRunner, PROVEEDOR_NOTA } from "@/lib/sim/contratos/firma";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, PASOS_FIRMA, type PasoFirma, type Solicitud } from "@/lib/types/contratos";
import { cn } from "@/lib/utils";

const EN_FIRMA = new Set(["aprobada", "en_firma", "formalizada"]);

export function SeguimientoFirma({ id }: { id: string }) {
  const hidratado = useContratosHydrated();
  const s = useContratos((st) => st.solicitudes.find((x) => x.id === id));
  const contrato = useContratos((st) => (s?.contratoId ? st.contratos.find((c) => c.id === s.contratoId) : undefined));
  const { perfil, actor } = useActorContratos();
  const enviarAFirma = useContratos((st) => st.enviarAFirma);
  const regreso = perfil === "admin" ? { href: "/contratos/firma", label: "Firma" } : { href: `/contratos/legal/solicitudes/${id}`, label: "Solicitud" };

  if (!hidratado) return null;
  if (!s || !EN_FIRMA.has(s.estatus)) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <EmptyState
          icon={Signature}
          title={s ? "Esta solicitud aún no está aprobada" : "No encontramos la solicitud"}
          description={s ? "Se envía a firma cuando el directivo la aprueba." : "Puede que se haya reiniciado la demo."}
          action={
            <Button variant="outline" nativeButton={false} render={<Link href={s ? `/contratos/legal/solicitudes/${s.id}` : regreso.href} />}>
              {s ? "Ver solicitud" : `Ir a ${regreso.label}`}
            </Button>
          }
        />
      </div>
    );
  }

  const firmantes = [
    { rol: "Firmante 1 · Norte 19", nombre: ARRENDATARIA.representante, paso: "firmante_1" as PasoFirma },
    { rol: "Firmante 2 · Contraparte", nombre: String(s.campos.representanteLegal ?? s.campos.nombre ?? contraparteDe(s.campos)), paso: "firmante_2" as PasoFirma },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" nativeButton={false} render={<Link href={regreso.href} />}>
        <ArrowLeft data-icon="inline-start" />
        {regreso.label}
      </Button>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{s.folio}</span>
          <StatusBadge status={s.estatus} map={ESTATUS_SOLICITUD} />
        </div>
        <h1 className="text-xl font-semibold text-balance">Firma electrónica · {contraparteDe(s.campos)}</h1>
        <p className="text-sm text-muted-foreground">{NOMBRE_TIPO_CONTRATO[s.tipoContrato]}</p>
      </header>
      <Alert>
        <Info />
        <AlertDescription>{PROVEEDOR_NOTA}</AlertDescription>
      </Alert>

      {s.estatus === "aprobada" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Lista para firma</CardTitle>
            <CardDescription>Se envía el contrato al proveedor y cada firmante recibe su liga. El orden es secuencial.</CardDescription>
          </CardHeader>
          <CardContent>
            <Firmantes firmantes={firmantes} s={s} />
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => {
                if (enviarAFirma(s.id, actor)) toast.success(`${s.folio} enviada al proveedor de firma`);
              }}
            >
              <Signature data-icon="inline-start" />
              Enviar a firma
            </Button>
          </CardFooter>
        </Card>
      )}

      {s.estatus === "en_firma" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <EjecucionFirma key={s.id} s={s} />
          <Card size="sm">
            <CardHeader>
              <CardTitle>Firmantes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Firmantes firmantes={firmantes} s={s} />
              <PasosConFecha s={s} />
              <p className="text-xs text-muted-foreground">
                Si una parte no firma, el proveedor le envía recordatorios y la solicitud sigue en firma. Legal puede cancelar el envío, ajustar y reenviar.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {s.estatus === "formalizada" &&
        (contrato ? (
          <div className="flex flex-col gap-4">
            <GateBanner variant="aprobado" title={`Contrato ${contrato.folio} formalizado`} description="El documento firmado y su constancia ya están en el repositorio." />
            <SelloFirma contrato={contrato} />
            <SplitViewer document={{ type: "pdf", src: contrato.pdf, title: contrato.titulo }} defaultSplit={60} className="h-[75vh] min-h-[520px]">
              <div className="flex flex-col gap-5 p-4">
                <Firmantes firmantes={firmantes} s={s} />
                <PasosConFecha s={s} />
                <Button className="self-start" nativeButton={false} render={<Link href={`/contratos/repositorio/${contrato.id}`} />}>
                  <Library data-icon="inline-start" />
                  Ver en repositorio
                </Button>
              </div>
            </SplitViewer>
          </div>
        ) : (
          <EmptyState icon={FileText} title="Contrato formalizado" description="No encontramos el documento en el repositorio." />
        ))}
    </div>
  );
}

// Corre el ProgressRunner con los pasos pendientes; cada paso queda en el store y al final se formaliza.
function EjecucionFirma({ s }: { s: Solicitud }) {
  const avanzarFirma = useContratos((st) => st.avanzarFirma);
  const formalizar = useContratos((st) => st.formalizar);
  // Se calculan una vez: el store avanza mientras corre y no deben cambiar a medio proceso.
  const [pasos] = useState(() => pasosRunner(s));

  return (
    <ProgressRunner
      title="Proceso de firma"
      steps={pasos}
      autoStart
      onStepDone={(paso) => avanzarFirma(s.id, paso as PasoFirma)}
      onDone={() => {
        const contratoId = formalizar(s.id);
        if (contratoId) {
          const folio = useContratos.getState().contratos.find((c) => c.id === contratoId)?.folio;
          toast.success(`Contrato ${folio} formalizado`, { description: "Ya está en el repositorio con su constancia de conservación." });
        }
      }}
    />
  );
}

function Firmantes({ firmantes, s }: { firmantes: { rol: string; nombre: string; paso: PasoFirma }[]; s: Solicitud }) {
  return (
    <ul className="flex flex-col gap-3 text-sm">
      {firmantes.map((f) => {
        const firmo = s.firma?.pasos[f.paso];
        return (
          <li key={f.paso} className="flex items-start gap-2">
            {firmo ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">{f.rol}</span>
              <span className="font-medium">{f.nombre}</span>
              <span className="text-xs text-muted-foreground">{firmo ? `Firmó ${fechaHora(firmo)}` : "Pendiente"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PasosConFecha({ s }: { s: Solicitud }) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="pasos-firma">
      <h2 id="pasos-firma" className="text-sm font-medium">
        Pasos
      </h2>
      <ol className="flex flex-col gap-2 text-sm">
        {PASOS_FIRMA.map((p) => {
          const fecha = s.firma?.pasos[p.id];
          return (
            <li key={p.id} className="flex items-start gap-2">
              {fecha ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
              <span className={cn("flex min-w-0 flex-col", !fecha && "text-muted-foreground")}>
                <span>{p.etiqueta}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{fecha ? fechaHora(fecha) : "Pendiente"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
