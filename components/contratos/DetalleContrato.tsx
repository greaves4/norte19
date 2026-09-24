"use client";

import { ArrowLeft, BookOpen, Check, FileText, PencilLine, ScanText, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DialogoPrestamo, type Prestando } from "@/components/contratos/DialogoPrestamo";
import { SelloFirma } from "@/components/contratos/SelloFirma";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { EmptyState } from "@/components/shared/EmptyState";
import { GateBanner } from "@/components/shared/GateBanner";
import { SplitViewer } from "@/components/shared/SplitViewer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/lib/demo";
import { fecha, fechaHora, mxn } from "@/lib/format";
import { prestamoVencido } from "@/lib/sim/contratos/custodia";
import { estatusVigencia } from "@/lib/sim/contratos/vencimientos";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { CONFIANZA, ESTATUS_TANTO, ESTATUS_VIGENCIA, NOMBRE_TIPO_CONTRATO, type CampoExtraido, type Contrato } from "@/lib/types/contratos";

type Pestana = "datos" | "custodia" | "historial";

export function DetalleContrato({ id }: { id: string }) {
  const hidratado = useContratosHydrated();
  const c = useContratos((st) => st.contratos.find((x) => x.id === id));
  if (!hidratado) return null;
  if (!c) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <EmptyState
          icon={FileText}
          title="No encontramos el contrato"
          description="Puede que se haya reiniciado la demo."
          action={<Button variant="outline" nativeButton={false} render={<Link href="/contratos/repositorio" />}>Ir al repositorio</Button>}
        />
      </div>
    );
  }
  return <Detalle key={c.id} c={c} />;
}

function Detalle({ c }: { c: Contrato }) {
  const now = useNow(60_000);
  const { perfil, actor } = useActorContratos();
  const [pestana, setPestana] = useState<Pestana>("datos");
  const [pagina, setPagina] = useState(1);
  const [solicitudPagina, setSolicitudPagina] = useState(0);
  const pendientes = c.extraccion.filter((x) => !x.confirmado);
  const vigencia = estatusVigencia(c.vigenciaFin, now);

  function irA(p: number) {
    setPagina(p);
    setSolicitudPagina((n) => n + 1);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" nativeButton={false} render={<Link href="/contratos/repositorio" />}>
        <ArrowLeft data-icon="inline-start" />
        Repositorio
      </Button>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{c.folio}</span>
          <StatusBadge status={vigencia} map={ESTATUS_VIGENCIA} />
          {c.ocr && (
            <Badge variant="outline">
              <ScanText data-icon="inline-start" />
              Digitalizado por OCR
            </Badge>
          )}
          {c.sello && (
            <Badge variant="outline">
              <ShieldCheck data-icon="inline-start" />
              Firma electrónica
            </Badge>
          )}
        </div>
        <h1 className="text-xl font-semibold text-balance">{c.contraparte}</h1>
        <p className="text-sm text-muted-foreground">
          {NOMBRE_TIPO_CONTRATO[c.tipo]} · {fecha(`${c.vigenciaInicio}T12:00:00`)} al {fecha(`${c.vigenciaFin}T12:00:00`)}
          {c.monto > 0 && ` · ${mxn(c.monto)}${c.periodicidadMonto === "mensual" ? " al mes" : ""}`}
        </p>
        {c.solicitudId && perfil !== "directivo" && (
          <Button variant="link" size="sm" className="h-auto self-start px-0" nativeButton={false} render={<Link href={`/contratos/legal/solicitudes/${c.solicitudId}`} />}>
            Ver la solicitud de origen
          </Button>
        )}
      </header>

      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)} className="gap-4">
        <TabsList>
          <TabsTrigger value="datos">
            Datos extraídos
            {pendientes.length > 0 && <Badge variant="outline">{pendientes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="custodia">Custodia</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="flex flex-col gap-4">
          {c.sello && <SelloFirma contrato={c} />}
          <SplitViewer
            document={{ type: "pdf", src: c.pdf, title: c.ocr ? `${c.titulo} (digitalizado)` : c.titulo }}
            page={pagina}
            onPageChange={setPagina}
            pageRequest={solicitudPagina}
            defaultSplit={55}
            className="h-[78vh] min-h-[560px]"
          >
            <div className="flex flex-col gap-3 p-3">
              {pendientes.length > 0 ? (
                <GateBanner
                  variant="advertencia"
                  title={`${pendientes.length} ${pendientes.length === 1 ? "campo pendiente" : "campos pendientes"} de confirmar`}
                  description="La IA los leyó con confianza media o baja. Revísalos contra la cláusula."
                />
              ) : (
                <GateBanner variant="aprobado" title="Todos los campos confirmados" />
              )}
              <p className="text-xs text-muted-foreground">
                Extraídos por la IA{c.ocr ? " sobre el texto reconocido por OCR" : ""}. {c.paginas} páginas.
              </p>
              <ul className="flex flex-col gap-3">
                {c.extraccion.map((campo) => (
                  <CampoCard key={campo.clave} contratoId={c.id} campo={campo} actor={actor} onIrA={irA} />
                ))}
              </ul>
            </div>
          </SplitViewer>
        </TabsContent>

        <TabsContent value="custodia">
          <Custodia c={c} now={now} actor={actor} puedeRegistrar={perfil === "admin"} />
        </TabsContent>

        <TabsContent value="historial">
          <Timeline className="max-w-2xl" events={[...c.historial].reverse().map((e, i) => ({ id: String(i), fecha: e.fecha, titulo: e.titulo, actor: e.actor, descripcion: e.descripcion }))} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CampoCard({ contratoId, campo, actor, onIrA }: { contratoId: string; campo: CampoExtraido; actor: string; onIrA: (pagina: number) => void }) {
  const confirmarCampo = useContratos((s) => s.confirmarCampo);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(campo.valor);
  const id = `campo-${campo.clave}`;

  return (
    <li>
      <Card size="sm" data-pendiente={!campo.confirmado || undefined}>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-medium" id={`${id}-titulo`}>
              {campo.etiqueta}
            </h3>
            <StatusBadge status={campo.confianza} map={CONFIANZA} />
          </div>

          {editando ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!valor.trim()) return;
                confirmarCampo(contratoId, campo.clave, valor, actor);
                setEditando(false);
                toast.success(valor.trim() === campo.valor ? `${campo.etiqueta} confirmado` : `${campo.etiqueta} corregido`, { description: "Queda en el historial del contrato." });
              }}
            >
              <Label htmlFor={id} className="sr-only">
                Valor correcto de {campo.etiqueta}
              </Label>
              <Textarea id={id} autoFocus rows={3} value={valor} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setValor(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!valor.trim()}>
                  Guardar corrección
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setValor(campo.valor);
                    setEditando(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm whitespace-pre-line">{campo.valor}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {campo.clausula ? `Cláusula ${campo.clausula}` : "Sin cláusula"}
              {campo.pagina ? ` · pág. ${campo.pagina}` : ""}
            </span>
            {campo.pagina && (
              <Button variant="ghost" size="sm" onClick={() => onIrA(campo.pagina!)} aria-describedby={`${id}-titulo`}>
                <BookOpen data-icon="inline-start" />
                Ir a la cláusula
              </Button>
            )}
          </div>

          {!campo.confirmado && !editando && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-2">
              <span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <TriangleAlert className="size-3.5" aria-hidden />
                Pendiente de confirmar
              </span>
              <Button
                size="sm"
                onClick={() => {
                  confirmarCampo(contratoId, campo.clave, undefined, actor);
                  toast.success(`${campo.etiqueta} confirmado`);
                }}
                aria-describedby={`${id}-titulo`}
              >
                <Check data-icon="inline-start" />
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditando(true)} aria-describedby={`${id}-titulo`}>
                <PencilLine data-icon="inline-start" />
                Corregir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}

export function Custodia({ c, now, actor, puedeRegistrar }: { c: Contrato; now: Date; actor: string; puedeRegistrar: boolean }) {
  const registrarDevolucion = useContratos((s) => s.registrarDevolucion);
  const [prestando, setPrestando] = useState<Prestando | null>(null);

  return (
    <>
      <ul className="grid gap-4 lg:grid-cols-3">
        {c.custodia.map((t) => {
          const vencido = prestamoVencido(t, now);
          return (
            <li key={t.numero}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">Original {t.numero}/3</h3>
                    <StatusBadge status={t.estatus} map={ESTATUS_TANTO} />
                  </div>
                  <dl className="flex flex-col gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Ubicación</dt>
                      <dd>{t.ubicacion}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Responsable</dt>
                      <dd>{t.responsable}</dd>
                    </div>
                  </dl>
                  {t.prestamo && (
                    <GateBanner
                      variant={vencido ? "bloqueado" : "advertencia"}
                      title={vencido ? "Préstamo vencido" : "Prestado"}
                      description={`A ${t.prestamo.aQuien} desde el ${fecha(t.prestamo.desde)}; ${vencido ? "debía volver" : "vuelve"} el ${fecha(t.prestamo.hasta)}.`}
                    />
                  )}
                  {t.historialPrestamos.length > 0 && (
                    <section className="flex flex-col gap-1.5">
                      <h4 className="text-xs font-medium text-muted-foreground">Préstamos</h4>
                      <ol className="flex flex-col gap-1.5 text-xs">
                        {[...t.historialPrestamos].reverse().map((p, i) => (
                          <li key={i}>
                            <span className="font-medium">{p.aQuien}</span>
                            <span className="block text-muted-foreground">
                              Salida {fechaHora(p.desde)} · {p.devuelto ? `entrada ${fechaHora(p.devuelto)}` : `hasta ${fecha(p.hasta)}`}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                  {puedeRegistrar && t.responsable !== "Contraparte" && (
                    <div className="mt-auto pt-1">
                      {t.estatus === "prestado" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (registrarDevolucion(c.id, t.numero, actor)) toast.success(`Original ${t.numero}/3 devuelto`, { description: "De vuelta en resguardo." });
                          }}
                        >
                          Registrar devolución
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setPrestando({ contrato: c, numero: t.numero })}>
                          Registrar préstamo
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
      <DialogoPrestamo prestando={prestando} actor={actor} onOpenChange={(o) => !o && setPrestando(null)} />
    </>
  );
}
