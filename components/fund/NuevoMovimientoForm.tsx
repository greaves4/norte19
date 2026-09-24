"use client";

import { ArrowLeft, CircleAlert, CircleCheck, CircleDashed, OctagonX, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GateBanner } from "@/components/shared/GateBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { UploadZone, type UploadValue } from "@/components/shared/UploadZone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { demoNow, useNow } from "@/lib/demo";
import { CENTROS_COSTOS, categoriaPorClave, hotelPorId, USUARIOS_DEMO } from "@/lib/fixtures/fund";
import { fechaHora, mxn } from "@/lib/format";
import { comprobanteDeUpload, comprobanteXml } from "@/lib/sim/fund/archivos";
import { CfdiError, fechaEmision, parseCfdi, type Cfdi } from "@/lib/sim/fund/cfdi";
import { ejemploPorId, FIXTURES_COMPROBANTE, FIXTURES_XML, leerXmlDeUpload } from "@/lib/sim/fund/ejemplos";
import {
  validarCategorias,
  validarDocumental,
  validarRfcReceptor,
  validarVentana3Dias,
  type NivelValidacion,
  type ResultadoValidacion,
} from "@/lib/sim/fund/validaciones";
import { useFund } from "@/lib/store/fund";
import { cn } from "@/lib/utils";

const USUARIO = USUARIOS_DEMO.hotel;
const HOTEL = hotelPorId(USUARIO.hotelId!)!;
const TARJETA_ID = `tj-${HOTEL.id}`;

type EstadoXml =
  | { estado: "vacio" }
  | { estado: "leyendo" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; cfdi: Cfdi; xml: string; nombreArchivo: string };

const CENTROS_ITEMS = CENTROS_COSTOS.map((c) => ({ value: c.id, label: c.nombre }));

export function NuevoMovimientoForm() {
  const router = useRouter();
  const tarjeta = useFund((s) => s.tarjetas.find((t) => t.id === TARJETA_ID)!);
  const movimientos = useFund((s) => s.movimientos);
  const now = useNow(60_000);

  const [xml, setXml] = useState<EstadoXml>({ estado: "vacio" });
  const [comprobante, setComprobante] = useState<UploadValue | null>(null);
  const [centro, setCentro] = useState<string | null>(null);
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [intentoEnviar, setIntentoEnviar] = useState(false);

  const cfdi = xml.estado === "listo" ? xml.cfdi : null;
  const montoNumero = monto.trim() === "" ? null : Number(monto.replace(/[$,\s]/g, ""));

  async function cargarXml(value: UploadValue | null) {
    if (!value) return setXml({ estado: "vacio" });
    setXml({ estado: "leyendo" });
    try {
      const texto = await leerXmlDeUpload(value, demoNow());
      const leido = parseCfdi(texto);
      const nombreArchivo = value.kind === "file" ? value.file.name : `${value.fixture.id}.xml`;
      setXml({ estado: "listo", cfdi: leido, xml: texto, nombreArchivo });
      setMonto(leido.total.toFixed(2));
      // Con un ejemplo conocido se sugiere el centro de costos.
      const sugerido = value.kind === "fixture" ? ejemploPorId(value.fixture.id)?.centroCostosSugerido : undefined;
      if (sugerido) setCentro((actual) => actual ?? sugerido);
    } catch (error) {
      setXml({ estado: "error", mensaje: error instanceof CfdiError ? error.message : "No se pudo leer el archivo." });
    }
  }

  const validaciones = useMemo(() => {
    if (!cfdi) return null;
    const ventana = validarVentana3Dias(fechaEmision(cfdi), now);
    const categoria = validarCategorias(cfdi.conceptos, tarjeta.categoriasBloqueadas);
    const rfc = validarRfcReceptor(cfdi.rfcReceptor, HOTEL.rfc);
    const documental = validarDocumental(cfdi, montoNumero, comprobante !== null);
    const duplicado = movimientos.find((m) => m.uuid === cfdi.uuid);
    return { ventana, categoria, rfc, documental, duplicado };
  }, [cfdi, now, tarjeta.categoriasBloqueadas, montoNumero, comprobante, movimientos]);

  const faltantes = [
    !cfdi && "la factura (XML)",
    !comprobante && "el comprobante (PDF o imagen)",
    !centro && "el centro de costos",
    montoNumero !== null && !(montoNumero > 0) && "un monto válido",
  ].filter(Boolean) as string[];

  const bloqueoCategoria = validaciones?.categoria.nivel === "bloqueo" ? validaciones.categoria.bloqueadas[0] : null;
  const fueraDeVentana = validaciones?.ventana.nivel === "bloqueo";
  const tarjetaBloqueada = tarjeta.estatus === "bloqueada";

  async function registrar(tipo: "enviar" | "autorizacion" | "excepcion") {
    setIntentoEnviar(true);
    if (!cfdi || xml.estado !== "listo" || !comprobante || !centro || faltantes.length > 0) return;
    setEnviando(true);
    try {
      const store = useFund.getState();
      const id = store.crearMovimiento(
        {
          hotelId: HOTEL.id,
          tarjetaId: TARJETA_ID,
          fechaEmisionCfdi: fechaEmision(cfdi).toISOString(),
          proveedor: cfdi.nombreEmisor,
          rfcEmisor: cfdi.rfcEmisor,
          rfcReceptor: cfdi.rfcReceptor,
          uuid: cfdi.uuid,
          conceptos: cfdi.conceptos,
          subtotal: cfdi.subtotal,
          iva: cfdi.iva,
          total: cfdi.total,
          centroCostos: centro,
          notas: notasFinales(notas, validaciones?.documental.diferencia ?? null),
          comprobantes: [comprobanteXml(xml.xml, xml.nombreArchivo), await comprobanteDeUpload(comprobante)],
          extemporaneo: fueraDeVentana,
        },
        USUARIO.nombre,
      );
      const resumen = `${cfdi.nombreEmisor} · ${mxn(cfdi.total)}`;
      if (tipo === "enviar") {
        store.enviarASupervision(id, USUARIO.nombre);
        toast.success("Movimiento enviado a supervisión", { description: resumen });
      } else if (tipo === "autorizacion") {
        toast.success("Autorización solicitada al supervisor", { description: `${resumen}. Quedó como registrado extemporáneo.` });
      } else if (bloqueoCategoria) {
        store.solicitarExcepcion(id, bloqueoCategoria.id, USUARIO.nombre);
        toast.success("Excepción solicitada a Tesorería", { description: `${resumen}. Categoría: ${bloqueoCategoria.nombre}.` });
      }
      router.push("/fund/hotel/registro");
    } catch {
      setEnviando(false);
      toast.error("No se pudo registrar el movimiento", { description: "Revisa los archivos e intenta de nuevo." });
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Nuevo movimiento"
        description={`${HOTEL.nombre} · Tarjeta •••• ${tarjeta.ultimosCuatro}`}
        actions={
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/fund/hotel/registro" />}>
            <ArrowLeft data-icon="inline-start" />
            Volver al registro
          </Button>
        }
      />

      {tarjetaBloqueada && (
        <GateBanner variant="bloqueado" title="Tarjeta bloqueada" description="Tesorería bloqueó esta tarjeta. No se pueden registrar movimientos hasta que la desbloquee." />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Factura (XML)</CardTitle>
              <CardDescription>Al cargar el CFDI, sus datos se llenan solos.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <UploadZone
                accept=".xml"
                fixtures={FIXTURES_XML}
                onFile={cargarXml}
                label="Arrastra el XML de la factura o selecciónalo"
                disabled={tarjetaBloqueada}
              />
              {xml.estado === "leyendo" && <p className="text-sm text-muted-foreground">Leyendo CFDI…</p>}
              {xml.estado === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  {xml.mensaje}
                </p>
              )}
              {cfdi && <DatosCfdi cfdi={cfdi} categoriasBloqueadas={tarjeta.categoriasBloqueadas} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Comprobante</CardTitle>
              <CardDescription>Ticket o comprobante de pago en PDF o imagen.</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone
                accept=".pdf,image/*"
                fixtures={FIXTURES_COMPROBANTE}
                onFile={setComprobante}
                label="Arrastra el comprobante o selecciónalo"
                disabled={tarjetaBloqueada}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>3. Datos del gasto</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="centro">Centro de costos</Label>
                <Select items={CENTROS_ITEMS} value={centro} onValueChange={(v) => setCentro(v as string | null)}>
                  <SelectTrigger id="centro" className="w-full" aria-invalid={intentoEnviar && !centro ? true : undefined}>
                    <SelectValue placeholder="Selecciona el centro de costos" />
                  </SelectTrigger>
                  <SelectContent>
                    {CENTROS_ITEMS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="monto">Monto pagado con la tarjeta</Label>
                <Input
                  id="monto"
                  inputMode="decimal"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder={cfdi ? cfdi.total.toFixed(2) : "Se toma del CFDI"}
                  disabled={!cfdi}
                  className="tabular-nums"
                />
                <p className="text-xs text-muted-foreground">Se compara contra el total del CFDI.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validaciones</CardTitle>
              <CardDescription>Se revisan al cargar el XML.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!validaciones ? (
                <p className="text-sm text-muted-foreground">Carga la factura para ver las validaciones.</p>
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {[validaciones.ventana, validaciones.categoria, validaciones.rfc, validaciones.documental].map((v) => (
                      <FilaValidacion key={v.id} validacion={v} />
                    ))}
                    {validaciones.duplicado && (
                      <FilaValidacion
                        validacion={{
                          id: "documental",
                          nivel: "advertencia",
                          titulo: "CFDI ya registrado",
                          detalle: `Este UUID ya está en un movimiento del ${fechaHora(validaciones.duplicado.fecha)}. Verifica que no sea un duplicado.`,
                        }}
                      />
                    )}
                  </ul>

                  {bloqueoCategoria && (
                    <GateBanner
                      variant="bloqueado"
                      title={`Categoría bloqueada: ${bloqueoCategoria.nombre}`}
                      description={validaciones.categoria.detalle}
                      action={
                        <Button size="sm" variant="outline" onClick={() => registrar("excepcion")} disabled={enviando || tarjetaBloqueada}>
                          Solicitar excepción
                        </Button>
                      }
                    />
                  )}
                  {fueraDeVentana && !bloqueoCategoria && (
                    <GateBanner
                      variant="bloqueado"
                      title="Fuera de la ventana de registro"
                      description={validaciones.ventana.detalle}
                      action={
                        <Button size="sm" variant="outline" onClick={() => registrar("autorizacion")} disabled={enviando || tarjetaBloqueada}>
                          Solicitar autorización
                        </Button>
                      }
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              size="lg"
              onClick={() => registrar("enviar")}
              disabled={enviando || tarjetaBloqueada || Boolean(bloqueoCategoria) || fueraDeVentana}
            >
              <Send data-icon="inline-start" />
              Enviar a supervisión
            </Button>
            {faltantes.length > 0 && (intentoEnviar || cfdi) && (
              <p className={cn("text-sm", intentoEnviar ? "text-destructive" : "text-muted-foreground")}>
                Falta {faltantes.join(", ")}.
              </p>
            )}
            {(bloqueoCategoria || fueraDeVentana) && (
              <p className="text-sm text-muted-foreground">Para continuar usa la acción del aviso de validación.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DatosCfdi({ cfdi, categoriasBloqueadas }: { cfdi: Cfdi; categoriasBloqueadas: string[] }) {
  const campos = [
    { etiqueta: "Razón social", valor: cfdi.nombreEmisor, ancho: true },
    { etiqueta: "RFC emisor", valor: cfdi.rfcEmisor },
    { etiqueta: "Fecha de emisión", valor: fechaHora(fechaEmision(cfdi)) },
    { etiqueta: "UUID", valor: cfdi.uuid, ancho: true, mono: true },
    { etiqueta: "Subtotal", valor: mxn(cfdi.subtotal) },
    { etiqueta: "IVA", valor: mxn(cfdi.iva) },
    { etiqueta: "Total", valor: mxn(cfdi.total) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campos.map((c) => (
          <div key={c.etiqueta} className={cn("flex flex-col gap-1.5", c.ancho && "sm:col-span-2")}>
            <Label className="flex items-center gap-2">
              {c.etiqueta}
              <Badge variant="outline" className="font-normal">
                Del CFDI
              </Badge>
            </Label>
            <Input readOnly value={c.valor} aria-readonly className={cn("bg-muted/50", c.mono && "font-mono text-xs")} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          Conceptos
          <Badge variant="outline" className="font-normal">
            Del CFDI
          </Badge>
        </span>
        <ul className="flex flex-col divide-y border">
          {cfdi.conceptos.map((c, i) => {
            const categoria = categoriaPorClave(c.claveProdServ);
            const bloqueada = categoria ? categoriasBloqueadas.includes(categoria.id) : false;
            return (
              <li key={i} className="flex items-start justify-between gap-3 p-2.5 text-sm">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{c.descripcion}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    Clave {c.claveProdServ} · {categoria?.nombre ?? "Sin categoría"}
                    {bloqueada && <Badge variant="destructive">Bloqueada</Badge>}
                  </span>
                </span>
                <span className="tabular-nums">{mxn(c.importe)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// TODO tokens: colores de semáforo para ok y advertencia; hoy se distinguen por ícono.
const ICONO_NIVEL: Record<NivelValidacion, typeof CircleCheck> = {
  ok: CircleCheck,
  advertencia: CircleAlert,
  bloqueo: OctagonX,
  pendiente: CircleDashed,
};

const TEXTO_NIVEL: Record<NivelValidacion, string> = {
  ok: "Correcto",
  advertencia: "Advertencia",
  bloqueo: "Bloqueo",
  pendiente: "Pendiente",
};

function FilaValidacion({ validacion: v }: { validacion: ResultadoValidacion }) {
  const Icono = ICONO_NIVEL[v.nivel];
  return (
    <li className="flex gap-3" data-nivel={v.nivel}>
      <Icono
        className={cn(
          "mt-0.5 size-4 shrink-0",
          v.nivel === "bloqueo" && "text-destructive",
          (v.nivel === "pendiente" || v.nivel === "advertencia") && "text-muted-foreground",
        )}
        aria-label={TEXTO_NIVEL[v.nivel]}
      />
      <div className="flex flex-col gap-0.5">
        <span className={cn("text-sm font-medium", v.nivel === "bloqueo" && "text-destructive")}>{v.titulo}</span>
        <span className="text-sm text-muted-foreground">{v.detalle}</span>
      </div>
    </li>
  );
}

function notasFinales(notas: string, diferencia: number | null) {
  const extra = diferencia ? `Diferencia contra el CFDI: ${mxn(diferencia)}.` : "";
  return [notas.trim(), extra].filter(Boolean).join(" ");
}
