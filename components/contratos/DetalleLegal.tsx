"use client";

import { ArrowLeft, Check, FileText, Library, Play, Send, Signature, Undo2, UserRoundPen, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AnalisisJuridico } from "@/components/contratos/AnalisisJuridico";
import { TONO_EVENTO_SOLICITUD } from "@/components/contratos/DetalleSolicitud";
import { DialogoReasignar } from "@/components/contratos/DialogoReasignar";
import { RelojSla } from "@/components/contratos/RelojSla";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { DialogoJustificacion } from "@/components/shared/DialogoJustificacion";
import { EmptyState } from "@/components/shared/EmptyState";
import { GateBanner } from "@/components/shared/GateBanner";
import { SplitViewer } from "@/components/shared/SplitViewer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNow } from "@/lib/demo";
import { abogadoPorId, contraparteDe, solicitantePorId, USUARIOS_CONTRATOS, venceSla } from "@/lib/fixtures/contratos";
import { fecha, fechaHora } from "@/lib/format";
import { analisisVacio, PLANTILLA_ANALISIS } from "@/lib/sim/contratos/analisis";
import { definicionPara, documentosFaltantes, formatearValor } from "@/lib/sim/contratos/formulario";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, NOMBRE_TIPO_PERSONA, type PerfilContratos, type Solicitud } from "@/lib/types/contratos";
import { cn } from "@/lib/utils";

const REGRESO: Record<PerfilContratos, { href: string; label: string }> = {
  abogado: { href: "/contratos/legal/bandeja", label: "Bandeja" },
  directivo: { href: "/contratos/aprobaciones", label: "Aprobaciones" },
  admin: { href: "/contratos/firma", label: "Firma" },
  solicitante: { href: "/contratos/solicitudes", label: "Mis solicitudes" },
};

const EDITABLE = new Set(["nueva", "en_analisis", "en_ajustes"]);

type Pestana = "solicitud" | "expediente" | "analisis" | "timeline";

export function DetalleLegal({ id }: { id: string }) {
  const hidratado = useContratosHydrated();
  const s = useContratos((st) => st.solicitudes.find((x) => x.id === id));
  const { perfil } = useActorContratos();
  const regreso = REGRESO[perfil];

  if (!hidratado) return null;
  if (!s) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <EmptyState
          icon={FileText}
          title="No encontramos la solicitud"
          description="Puede que se haya reiniciado la demo."
          action={<Button variant="outline" nativeButton={false} render={<Link href={regreso.href} />}>Ir a {regreso.label}</Button>}
        />
      </div>
    );
  }
  return <Detalle key={s.id} s={s} />;
}

function Detalle({ s }: { s: Solicitud }) {
  const router = useRouter();
  const now = useNow(1000);
  const { perfil, actor } = useActorContratos();
  const st = useContratos.getState;
  const [pestana, setPestana] = useState<Pestana>("solicitud");
  const [borradorLocal, setBorrador] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<"regresar" | "rechazar" | "reasignar" | null>(null);
  const def = definicionPara(s.tipoPersona, s.tipoContrato);
  const faltantes = documentosFaltantes(def, s.expediente);
  const regreso = REGRESO[perfil];

  const esAbogado = perfil === "abogado";
  const editable = esAbogado && EDITABLE.has(s.estatus);
  const borrador = borradorLocal ?? (s.analisis || PLANTILLA_ANALISIS);
  const sucio = borrador !== (s.analisis || PLANTILLA_ANALISIS);
  const abogado = abogadoPorId(s.abogadoId);
  const rechazoDirectivo = s.estatus === "en_analisis" && s.motivoRechazo ? [...s.timeline].reverse().find((e) => e.tipo === "rechazada_ajustes") : undefined;

  function guardar() {
    if (analisisVacio(borrador)) {
      toast.error("Escribe el análisis antes de guardarlo");
      return false;
    }
    st().guardarAnalisis(s.id, borrador, actor);
    setBorrador(null);
    toast.success(`Versión ${s.versionesAnalisis.length + 1} del análisis guardada`);
    return true;
  }

  function enviarAAprobacion() {
    if (analisisVacio(borrador)) {
      setPestana("analisis");
      toast.error("Falta el análisis jurídico", { description: "Escríbelo antes de enviar a aprobación." });
      return;
    }
    if (sucio && !guardar()) return;
    if (st().enviarAAprobacion(s.id, actor)) {
      toast.success(`${s.folio} enviada a aprobación`, { description: `La revisa ${USUARIOS_CONTRATOS.directivo.nombre}.` });
    }
  }

  const acciones: React.ReactNode[] = [];
  if (esAbogado && s.estatus === "nueva") {
    acciones.push(
      <Button key="iniciar" onClick={() => st().iniciarAnalisis(s.id, actor) && toast.success(`${s.folio} en análisis`)}>
        <Play data-icon="inline-start" />
        Iniciar análisis
      </Button>,
    );
  }
  if (esAbogado && s.estatus === "en_analisis") {
    acciones.push(
      <Button key="aprobacion" onClick={enviarAAprobacion}>
        <Send data-icon="inline-start" />
        Enviar a aprobación
      </Button>,
    );
  }
  if (esAbogado && (s.estatus === "nueva" || s.estatus === "en_analisis")) {
    acciones.push(
      <Button key="regresar" variant="outline" onClick={() => setDialogo("regresar")}>
        <Undo2 data-icon="inline-start" />
        Regresar a solicitante
      </Button>,
    );
  }
  if (perfil === "directivo" && s.estatus === "en_aprobacion") {
    acciones.push(
      <Button
        key="aprobar"
        onClick={() => {
          if (st().aprobar(s.id, actor)) toast.success(`${s.folio} aprobada`, { description: `Se notificó a ${abogado?.nombre} para enviarla a firma.` });
        }}
      >
        <Check data-icon="inline-start" />
        Aprobar
      </Button>,
      <Button key="rechazar" variant="outline" onClick={() => setDialogo("rechazar")}>
        <X data-icon="inline-start" />
        Rechazar a ajustes
      </Button>,
    );
  }
  if ((esAbogado || perfil === "admin") && s.estatus === "aprobada") {
    acciones.push(
      <Button
        key="firma"
        onClick={() => {
          if (st().enviarAFirma(s.id, actor)) {
            toast.success(`${s.folio} enviada a firma electrónica`);
            router.push(`/contratos/firma/${s.id}`);
          }
        }}
      >
        <Signature data-icon="inline-start" />
        Enviar a firma
      </Button>,
    );
  }
  if (s.estatus === "en_firma" && perfil !== "directivo") {
    acciones.push(
      <Button key="seguimiento" variant="outline" nativeButton={false} render={<Link href={`/contratos/firma/${s.id}`} />}>
        <Signature data-icon="inline-start" />
        Ver seguimiento de firma
      </Button>,
    );
  }
  if (s.estatus === "formalizada" && s.contratoId && perfil !== "directivo") {
    acciones.push(
      <Button key="repo" variant="outline" nativeButton={false} render={<Link href={`/contratos/repositorio/${s.contratoId}`} />}>
        <Library data-icon="inline-start" />
        Ver en repositorio
      </Button>,
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" nativeButton={false} render={<Link href={regreso.href} />}>
        <ArrowLeft data-icon="inline-start" />
        {regreso.label}
      </Button>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{s.folio}</span>
            <StatusBadge status={s.estatus} map={ESTATUS_SOLICITUD} />
            <RelojSla solicitud={s} now={now} />
          </div>
          <h1 className="text-xl font-semibold text-balance">{contraparteDe(s.campos)}</h1>
          <p className="text-sm text-muted-foreground">
            {NOMBRE_TIPO_CONTRATO[s.tipoContrato]} · {NOMBRE_TIPO_PERSONA[s.tipoPersona]} · {solicitantePorId(s.solicitanteId)?.area}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            <span>
              Asignada a <span className="font-medium">{abogado?.nombre}</span>
            </span>
            {(esAbogado || perfil === "admin") && s.estatus !== "formalizada" && (
              <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setDialogo("reasignar")}>
                <UserRoundPen data-icon="inline-start" />
                Reasignar
              </Button>
            )}
          </p>
        </div>
        {acciones.length > 0 && <div className="flex flex-wrap gap-2 lg:justify-end">{acciones}</div>}
      </header>

      {s.estatus === "en_ajustes" && (
        <GateBanner variant="advertencia" title="Con el solicitante para ajustes" description={s.motivoRechazo} />
      )}
      {rechazoDirectivo && (
        <GateBanner
          variant="advertencia"
          title={`${rechazoDirectivo.actor} la rechazó a ajustes`}
          description={`${s.motivoRechazo} Ajusta el análisis y vuelve a enviarla a aprobación.`}
        />
      )}
      {s.estatus === "en_aprobacion" && perfil !== "directivo" && (
        <GateBanner variant="advertencia" title={`En revisión de ${USUARIOS_CONTRATOS.directivo.nombre}`} description={`Enviada el ${fechaHora(s.etapas.en_aprobacion ?? s.creadaEn)}.`} />
      )}
      {s.estatus === "aprobada" && <GateBanner variant="aprobado" title="Aprobada por el directivo" description="Lista para enviarse a firma electrónica." />}

      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)} className="gap-4">
        <TabsList className="max-w-full">
          <TabsTrigger value="solicitud">Solicitud</TabsTrigger>
          <TabsTrigger value="expediente">Expediente ({s.expediente.length})</TabsTrigger>
          <TabsTrigger value="analisis">
            Análisis jurídico
            {sucio && <span className="sr-only"> (sin guardar)</span>}
            {sucio && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitud">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {def.campos.map((c) => (
                <Dato key={c.clave} etiqueta={c.etiqueta} valor={formatearValor(c, s.campos[c.clave])} />
              ))}
            </dl>
            <dl className="flex flex-col gap-4 text-sm lg:border-l lg:pl-6">
              <Dato etiqueta="Solicitante" valor={`${solicitantePorId(s.solicitanteId)?.nombre} · ${solicitantePorId(s.solicitanteId)?.puesto}`} />
              <Dato etiqueta="Creada" valor={fechaHora(s.creadaEn)} />
              <Dato etiqueta="SLA de análisis" valor={`${s.slaDiasHabiles} días hábiles · vence ${fecha(venceSla(s), "d MMM yyyy, HH:mm")}`} />
              {s.renovacionDe && <Dato etiqueta="Renovación de" valor={s.renovacionDe} />}
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="expediente">
          <Expediente s={s} faltantes={faltantes.map((d) => d.etiqueta)} />
        </TabsContent>

        <TabsContent value="analisis">
          <AnalisisJuridico solicitud={s} editable={editable} borrador={borrador} onBorrador={setBorrador} onGuardar={guardar} />
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline
            className="max-w-2xl"
            events={[...s.timeline].reverse().map((e, i) => ({ id: String(i), fecha: e.fecha, titulo: e.titulo, actor: e.actor, descripcion: e.descripcion, tone: TONO_EVENTO_SOLICITUD[e.tipo] }))}
          />
        </TabsContent>
      </Tabs>

      <DialogoJustificacion
        open={dialogo === "regresar"}
        onOpenChange={(o) => !o && setDialogo(null)}
        titulo={`Regresar ${s.folio} al solicitante`}
        descripcion={`${solicitantePorId(s.solicitanteId)?.nombre} verá el motivo y podrá corregir y reenviar.`}
        etiqueta="Qué debe corregir"
        accion="Regresar"
        ayuda="Obligatorio. Queda en el historial de la solicitud."
        onConfirmar={(motivo) => {
          if (st().regresarASolicitante(s.id, motivo, actor)) toast.success(`${s.folio} regresada al solicitante`, { description: "Queda en ajustes hasta que la reenvíe." });
        }}
      />
      <DialogoJustificacion
        open={dialogo === "rechazar"}
        onOpenChange={(o) => !o && setDialogo(null)}
        titulo={`Rechazar ${s.folio} a ajustes`}
        descripcion={`Regresa a En análisis con ${abogado?.nombre}.`}
        etiqueta="Motivo"
        accion="Rechazar a ajustes"
        destructiva
        ayuda="Obligatorio. El abogado lo verá en la solicitud."
        onConfirmar={(motivo) => {
          if (st().rechazarAAjustes(s.id, motivo, actor)) toast.success(`Regresada a ${abogado?.nombre}`, { description: "Vuelve a En análisis con tu motivo." });
        }}
      />
      <DialogoReasignar solicitud={dialogo === "reasignar" ? s : null} actor={actor} onOpenChange={(o) => !o && setDialogo(null)} />
    </div>
  );
}

function Expediente({ s, faltantes }: { s: Solicitud; faltantes: string[] }) {
  const [clave, setClave] = useState(s.expediente[0]?.clave ?? null);
  const doc = s.expediente.find((d) => d.clave === clave) ?? s.expediente[0];
  if (!doc) {
    return <EmptyState icon={FileText} title="Sin documentos" description="Este tipo de contrato no requiere expediente o aún no se carga." />;
  }
  return (
    <div className="flex flex-col gap-4">
      {faltantes.length > 0 && <GateBanner variant="bloqueado" title="Expediente incompleto" items={faltantes} />}
      <SplitViewer document={{ type: doc.tipo === "pdf" ? "pdf" : "image", src: doc.src, title: doc.etiqueta }} defaultSplit={60} className="h-[70vh] min-h-[480px]">
        <nav aria-label="Documentos del expediente" className="flex flex-col gap-1 p-3">
          {s.expediente.map((d) => (
            <button
              key={d.clave}
              type="button"
              onClick={() => setClave(d.clave)}
              aria-current={d.clave === doc.clave ? "true" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                d.clave === doc.clave && "bg-muted font-medium",
              )}
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{d.etiqueta}</span>
            </button>
          ))}
        </nav>
      </SplitViewer>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="break-words">{valor}</dd>
    </div>
  );
}
