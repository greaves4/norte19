"use client";

import { ArrowLeft, ArrowRight, Building2, Check, FileStack, Send, User, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { UploadZone, type UploadFixture, type UploadValue } from "@/components/shared/UploadZone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { archivoDeUpload } from "@/lib/archivos";
import { demoNow, useDemo } from "@/lib/demo";
import { abogadoPorId, DOCUMENTOS_EJEMPLO, TIPOS_CONTRATO, TIPOS_PERSONA, USUARIOS_CONTRATOS } from "@/lib/fixtures/contratos";
import { cargaPorAbogado, asignarAbogado } from "@/lib/sim/contratos/asignacion";
import {
  conservarCompatibles,
  definicionPara,
  documentosFaltantes,
  formatearValor,
  normalizarValores,
  validarCampos,
  valoresDeEjemplo,
  type Valores,
} from "@/lib/sim/contratos/formulario";
import { slaPorTipo } from "@/lib/sim/contratos/sla";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import {
  NOMBRE_TIPO_CONTRATO,
  NOMBRE_TIPO_PERSONA,
  type DefinicionCampo,
  type Documento,
  type TipoContrato,
  type TipoPersona,
} from "@/lib/types/contratos";
import { cn } from "@/lib/utils";

const USUARIO = USUARIOS_CONTRATOS.solicitante;

const PASOS = ["Tipo", "Datos", "Expediente", "Resumen"] as const;
type Paso = 0 | 1 | 2 | 3;

const DESCRIPCION_TIPO: Record<TipoContrato, string> = {
  arrendamiento: "Renta de inmuebles para hoteles u oficinas.",
  desarrollo: "Construcción, proyecto u obra de un hotel.",
  servicios: "Proveedores de servicios para los hoteles.",
  confidencialidad: "NDA para compartir información.",
};

function fixtureDe(clave: string): UploadFixture[] {
  if (!(clave in DOCUMENTOS_EJEMPLO)) return [];
  return [{ id: clave, name: `${DOCUMENTOS_EJEMPLO[clave]} (ejemplo)`, src: `/fixtures/contratos/expediente/${clave}.pdf`, type: "application/pdf" }];
}

export function NuevaSolicitud() {
  const router = useRouter();
  const corregirId = useSearchParams().get("corregir");
  const hidratado = useContratosHydrated();
  const { isDemo } = useDemo();
  const solicitudes = useContratos((s) => s.solicitudes);
  const crearSolicitud = useContratos((s) => s.crearSolicitud);
  const reenviar = useContratos((s) => s.reenviar);
  const aCorregir = corregirId ? solicitudes.find((s) => s.id === corregirId) : undefined;
  const corrigiendo = Boolean(aCorregir);

  const [paso, setPaso] = useState<Paso>(0);
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>("moral");
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>("arrendamiento");
  const [valores, setValores] = useState<Valores>({});
  const [expediente, setExpediente] = useState<Record<string, Documento>>({});
  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [intentoDatos, setIntentoDatos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [precargado, setPrecargado] = useState(false);

  // Modo corrección: precarga la solicitud regresada y empieza en los datos.
  useEffect(() => {
    if (precargado || !hidratado || !aCorregir) return;
    setTipoPersona(aCorregir.tipoPersona);
    setTipoContrato(aCorregir.tipoContrato);
    setValores({ ...aCorregir.campos });
    setExpediente(Object.fromEntries(aCorregir.expediente.map((d) => [d.clave, d])));
    setPaso(1);
    setPrecargado(true);
  }, [aCorregir, hidratado, precargado]);

  // Al cambiar de paso, regresa al inicio del formulario.
  const inicioRef = useRef<HTMLDivElement>(null);
  const primerPaso = useRef(true);
  useEffect(() => {
    if (primerPaso.current) {
      primerPaso.current = false;
      return;
    }
    inicioRef.current?.scrollIntoView({ block: "start" });
  }, [paso]);

  const def = useMemo(() => definicionPara(tipoPersona, tipoContrato), [tipoPersona, tipoContrato]);
  const errores = useMemo(() => validarCampos(def, valores), [def, valores]);
  const docs = useMemo(() => Object.values(expediente).filter((d) => def.documentos.some((x) => x.clave === d.clave)), [expediente, def]);
  const faltantes = useMemo(() => documentosFaltantes(def, docs), [def, docs]);
  const hayErrores = Object.keys(errores).length > 0;

  // Cambia la combinación en vivo: conserva lo capturado que siga existiendo en la nueva definición.
  function cambiarCombinacion(persona: TipoPersona, tipo: TipoContrato) {
    if (persona === tipoPersona && tipo === tipoContrato) return;
    const nueva = definicionPara(persona, tipo);
    const conservados = conservarCompatibles(valores, nueva);
    const antes = Object.values(valores).filter((v) => v !== "").length;
    setTipoPersona(persona);
    setTipoContrato(tipo);
    setValores(conservados);
    if (paso > 0 && antes > 0) {
      toast.info(`${NOMBRE_TIPO_CONTRATO[tipo]} · ${NOMBRE_TIPO_PERSONA[persona]}`, {
        description: `Se conservaron ${Object.keys(conservados).length} de ${antes} datos capturados.`,
      });
    }
  }

  function setValor(clave: string, valor: string) {
    setValores((v) => ({ ...v, [clave]: valor }));
  }

  async function cargarDocumento(clave: string, etiqueta: string, value: UploadValue | null) {
    if (!value) {
      setExpediente((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== clave)));
      return;
    }
    const archivo = await archivoDeUpload(value);
    setExpediente((e) => ({ ...e, [clave]: { clave, etiqueta, ...archivo } }));
  }

  function cargarEjemplos() {
    const nuevos = def.documentos.filter((d) => d.clave in DOCUMENTOS_EJEMPLO && !expediente[d.clave]);
    setExpediente((e) => ({
      ...e,
      ...Object.fromEntries(
        nuevos.map((d) => [d.clave, { clave: d.clave, etiqueta: d.etiqueta, nombre: `${d.clave}.pdf`, src: `/fixtures/contratos/expediente/${d.clave}.pdf`, tipo: "pdf" as const }]),
      ),
    }));
    toast.success(nuevos.length === 0 ? "El expediente ya estaba completo" : nuevos.length === 1 ? "Se cargó 1 documento de ejemplo" : `Se cargaron ${nuevos.length} documentos de ejemplo`);
  }

  function siguiente() {
    if (paso === 1 && hayErrores) {
      setIntentoDatos(true);
      toast.error("Revisa los datos marcados");
      return;
    }
    setPaso((p) => Math.min(3, p + 1) as Paso);
  }

  // Vista previa de la asignación: la misma regla que aplica el store al enviar.
  const abogadoPrevisto = abogadoPorId(asignarAbogado(solicitudes));
  const cargaPrevista = abogadoPrevisto ? cargaPorAbogado(solicitudes)[abogadoPrevisto.id] : 0;
  const sla = slaPorTipo(tipoContrato);

  function enviar() {
    if (faltantes.length || hayErrores || enviando) return;
    setEnviando(true);
    const campos = normalizarValores(def, valores);
    const expedienteFinal = def.documentos.flatMap((d) => (expediente[d.clave] ? [expediente[d.clave]] : []));
    if (aCorregir) {
      const ok = reenviar(aCorregir.id, { campos, expediente: expedienteFinal }, USUARIO.nombre);
      if (!ok) {
        setEnviando(false);
        toast.error("Esta solicitud ya no está en ajustes");
        return;
      }
      toast.success(`Solicitud ${aCorregir.folio} reenviada a Legal`, {
        description: `La retoma ${abogadoPorId(aCorregir.abogadoId)?.nombre}.`,
      });
    } else {
      const { id, abogadoId } = crearSolicitud(
        { tipoPersona, tipoContrato, campos, expediente: expedienteFinal, solicitanteId: USUARIO.id },
        USUARIO.nombre,
      );
      const folio = useContratos.getState().solicitudes.find((s) => s.id === id)?.folio;
      toast.success(`Solicitud ${folio} enviada a Legal`, {
        description: `Asignada a ${abogadoPorId(abogadoId)?.nombre} · SLA de análisis: ${sla} días hábiles`,
      });
    }
    router.push("/contratos/solicitudes");
  }

  if (corregirId && hidratado && !aCorregir) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Corregir solicitud" />
        <GateBanner
          variant="bloqueado"
          title="No encontramos la solicitud"
          description="Puede que se haya reiniciado la demo."
          action={<Button size="sm" variant="outline" nativeButton={false} render={<Link href="/contratos/solicitudes" />}>Ver mis solicitudes</Button>}
        />
      </div>
    );
  }

  return (
    <div ref={inicioRef} className="mx-auto flex w-full max-w-4xl scroll-mt-4 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={corrigiendo ? `Corregir ${aCorregir?.folio}` : "Nueva solicitud"}
        description={corrigiendo ? "Ajusta los datos o el expediente y reenvía a Legal." : "Cuatro pasos. Legal la recibe con su SLA en cuanto la envíes."}
        actions={
          <Button variant="ghost" nativeButton={false} render={<Link href="/contratos/solicitudes" />}>
            Cancelar
          </Button>
        }
      />

      <ol className="grid grid-cols-4 gap-2" aria-label="Pasos">
        {PASOS.map((nombre, i) => {
          const hecho = i < paso;
          const actual = i === paso;
          const bloqueado = corrigiendo && i === 0;
          return (
            <li key={nombre}>
              <button
                type="button"
                disabled={i > paso || bloqueado}
                onClick={() => setPaso(i as Paso)}
                aria-current={actual ? "step" : undefined}
                className={cn(
                  "flex w-full flex-col items-start gap-1.5 border-t-2 pt-2 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default",
                  actual || hecho ? "border-primary" : "border-border text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {hecho ? <Check className="size-3.5" aria-hidden /> : <span className="tabular-nums">{i + 1}</span>}
                  <span className="sr-only">{hecho ? "Completado" : actual ? "Actual" : "Pendiente"}:</span>
                </span>
                <span className={cn("font-medium", actual && "text-foreground")}>{nombre}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {paso === 0 && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">¿Con quién se firma?</h2>
            <div role="radiogroup" aria-label="Tipo de persona" className="grid gap-3 sm:grid-cols-2">
              {TIPOS_PERSONA.map((p) => (
                <OpcionCard
                  key={p}
                  seleccionada={tipoPersona === p}
                  onClick={() => cambiarCombinacion(p, tipoContrato)}
                  icono={p === "moral" ? Building2 : User}
                  titulo={NOMBRE_TIPO_PERSONA[p]}
                  descripcion={p === "moral" ? "Empresa: acta constitutiva y poder del representante." : "Persona: identificación, CURP y domicilio."}
                />
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Tipo de contrato</h2>
            <div role="radiogroup" aria-label="Tipo de contrato" className="grid gap-3 sm:grid-cols-2">
              {TIPOS_CONTRATO.map((t) => (
                <OpcionCard
                  key={t}
                  seleccionada={tipoContrato === t}
                  onClick={() => cambiarCombinacion(tipoPersona, t)}
                  icono={FileStack}
                  titulo={NOMBRE_TIPO_CONTRATO[t]}
                  descripcion={`${DESCRIPCION_TIPO[t]} SLA de ${slaPorTipo(t)} días hábiles.`}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {paso === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la contraparte y del contrato</CardTitle>
            <CardDescription>Los campos cambian con la combinación; lo que ya capturaste se conserva si aplica.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {!corrigiendo && (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  spacing={0}
                  value={[tipoPersona]}
                  onValueChange={(v) => v[0] && cambiarCombinacion(v[0] as TipoPersona, tipoContrato)}
                  aria-label="Tipo de persona"
                >
                  {TIPOS_PERSONA.map((p) => (
                    <ToggleGroupItem key={p} value={p}>
                      {NOMBRE_TIPO_PERSONA[p]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  spacing={0}
                  value={[tipoContrato]}
                  onValueChange={(v) => v[0] && cambiarCombinacion(tipoPersona, v[0] as TipoContrato)}
                  aria-label="Tipo de contrato"
                  className="flex-wrap"
                >
                  {TIPOS_CONTRATO.map((t) => (
                    <ToggleGroupItem key={t} value={t}>
                      {t === "servicios" ? "Servicios" : NOMBRE_TIPO_CONTRATO[t]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
            {isDemo && (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => {
                  // Respeta lo capturado que ya es válido; llena lo vacío y reemplaza lo inválido.
                  setValores((v) => ({ ...valoresDeEjemplo(def, demoNow()), ...Object.fromEntries(Object.entries(v).filter(([k, x]) => x !== "" && !errores[k])) }));
                  toast.success("Campos vacíos o inválidos llenados con datos de ejemplo");
                }}
              >
                <WandSparkles data-icon="inline-start" />
                Llenar con datos de ejemplo
              </Button>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {def.campos.map((c) => (
                <CampoDinamico
                  key={`${tipoPersona}-${tipoContrato}-${c.clave}`}
                  campo={c}
                  valor={valores[c.clave]}
                  error={intentoDatos || tocados.has(c.clave) ? errores[c.clave] : undefined}
                  onChange={(v) => setValor(c.clave, v)}
                  onBlur={() => setTocados((t) => new Set(t).add(c.clave))}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paso === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Expediente</CardTitle>
            <CardDescription>
              {def.documentos.length
                ? `${def.documentos.filter((d) => d.obligatorio).length} documentos obligatorios para ${NOMBRE_TIPO_CONTRATO[tipoContrato].toLowerCase()} con ${NOMBRE_TIPO_PERSONA[tipoPersona].toLowerCase()}. PDF o imagen.`
                : "Este tipo de contrato no requiere documentos."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ExpedienteGate faltantes={faltantes.map((d) => d.etiqueta)} total={def.documentos.length} />
            {def.documentos.some((d) => d.clave in DOCUMENTOS_EJEMPLO && !expediente[d.clave]) && (
              <Button variant="outline" size="sm" className="self-start" onClick={cargarEjemplos}>
                <FileStack data-icon="inline-start" />
                Cargar ejemplos en todos
              </Button>
            )}
            <ul className="flex flex-col gap-3">
              {def.documentos.map((d) => (
                <li key={d.clave} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{d.etiqueta}</span>
                    <Badge variant={d.obligatorio ? "secondary" : "outline"}>{d.obligatorio ? "Obligatorio" : "Opcional"}</Badge>
                  </div>
                  <UploadZone
                    compacto
                    accept=".pdf,image/*"
                    label="Arrastra o selecciona"
                    fixtures={fixtureDe(d.clave)}
                    archivo={expediente[d.clave] ? { nombre: expediente[d.clave].nombre, tamano: expediente[d.clave].tamano } : null}
                    onFile={(v) => void cargarDocumento(d.clave, d.etiqueta, v)}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {paso === 3 && (
        <div className="flex flex-col gap-4">
          <ExpedienteGate faltantes={faltantes.map((d) => d.etiqueta)} total={def.documentos.length} ocultarCompleto />
          {hayErrores && (
            <GateBanner
              variant="bloqueado"
              title="Faltan datos"
              items={Object.keys(errores).map((k) => def.campos.find((c) => c.clave === k)?.etiqueta ?? k)}
              action={<Button size="sm" variant="outline" onClick={() => { setIntentoDatos(true); setPaso(1); }}>Ir a los datos</Button>}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>{NOMBRE_TIPO_CONTRATO[tipoContrato]} · {NOMBRE_TIPO_PERSONA[tipoPersona]}</CardTitle>
              <CardDescription>
                {corrigiendo
                  ? `Regresa a ${abogadoPorId(aCorregir!.abogadoId)?.nombre}, que la dejó en ajustes.`
                  : `Se asignará a ${abogadoPrevisto?.nombre} (menor carga: ${cargaPrevista} activas) con SLA de análisis de ${sla} días hábiles.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                {def.campos.map((c) => (
                  <div key={c.clave} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">{c.etiqueta}</dt>
                    <dd className="break-words">{formatearValor(c, normalizarValores(def, valores)[c.clave])}</dd>
                  </div>
                ))}
              </dl>
              {def.documentos.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Expediente</h3>
                  <ul className="flex flex-col gap-1 text-sm">
                    {def.documentos.map((d) => (
                      <li key={d.clave} className="flex items-center justify-between gap-3">
                        <span>{d.etiqueta}</span>
                        <span className="text-xs text-muted-foreground">{expediente[d.clave]?.nombre ?? (d.obligatorio ? "Falta" : "Sin cargar")}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={enviar} disabled={faltantes.length > 0 || hayErrores || enviando}>
                <Send data-icon="inline-start" />
                {corrigiendo ? "Reenviar a Legal" : "Enviar a Legal"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={() => setPaso((p) => Math.max(corrigiendo ? 1 : 0, p - 1) as Paso)} disabled={paso === 0 || (corrigiendo && paso === 1)}>
          <ArrowLeft data-icon="inline-start" />
          Anterior
        </Button>
        {paso < 3 && (
          <Button onClick={siguiente}>
            Siguiente
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ExpedienteGate({ faltantes, total, ocultarCompleto = false }: { faltantes: string[]; total: number; ocultarCompleto?: boolean }) {
  if (total === 0) return null;
  if (faltantes.length === 0) return ocultarCompleto ? null : <GateBanner variant="aprobado" title="Expediente completo" />;
  return (
    <GateBanner
      variant="bloqueado"
      title={faltantes.length === 1 ? "Falta 1 documento obligatorio" : `Faltan ${faltantes.length} documentos obligatorios`}
      description={faltantes.length === 1 ? "No se puede enviar a Legal sin él." : "No se puede enviar a Legal sin ellos."}
      items={faltantes}
    />
  );
}

function OpcionCard({
  seleccionada,
  onClick,
  icono: Icono,
  titulo,
  descripcion,
}: {
  seleccionada: boolean;
  onClick: () => void;
  icono: typeof User;
  titulo: string;
  descripcion: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onClick}
      className="group h-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card size="sm" className={cn("h-full transition-colors group-hover:bg-muted/50", seleccionada && "ring-2 ring-primary")}>
        <CardContent className="flex items-start gap-3">
          <Icono className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-medium">{titulo}</span>
            <span className="text-sm text-muted-foreground">{descripcion}</span>
          </div>
          {seleccionada && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
        </CardContent>
      </Card>
    </button>
  );
}

function CampoDinamico({
  campo,
  valor,
  error,
  onChange,
  onBlur,
}: {
  campo: DefinicionCampo;
  valor: string | number | undefined;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = `campo-${campo.clave}`;
  const texto = valor === undefined ? "" : String(valor);
  const ayudaId = `${id}-ayuda`;
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {campo.etiqueta}
        {!campo.requerido && <span className="font-normal text-muted-foreground">(opcional)</span>}
      </Label>
      {campo.tipo === "select" ? (
        <Select items={(campo.opciones ?? []).map((o) => ({ value: o, label: o }))} value={texto || null} onValueChange={(v) => { onChange((v as string | null) ?? ""); onBlur(); }}>
          <SelectTrigger id={id} className="w-full" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}>
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            {(campo.opciones ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={campo.tipo === "date" ? "date" : "text"}
          inputMode={campo.tipo === "number" ? "numeric" : campo.tipo === "money" ? "decimal" : undefined}
          value={texto}
          placeholder={campo.placeholder ?? (campo.tipo === "money" ? "$0.00" : undefined)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={[campo.ayuda ? ayudaId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          className={cn((campo.clave === "rfc" || campo.clave === "curp") && "uppercase placeholder:normal-case")}
        />
      )}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        campo.ayuda && (
          <p id={ayudaId} className="text-xs text-muted-foreground">
            {campo.ayuda}
          </p>
        )
      )}
    </div>
  );
}
