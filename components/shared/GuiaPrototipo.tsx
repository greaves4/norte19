"use client";

import { ArrowLeft, ChevronRight, Info, Laptop, Tablet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DemoProfile } from "@/components/shared/DemoBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GuiaPrototipo as Guia, RecorridoPerfil } from "@/lib/ayuda";
import { useDemo, useDemoHydrated } from "@/lib/demo";

type Props = {
  // Nombre y descripción corta del prototipo, p. ej. "Fund" y "Caja chica hotelera".
  nombre: string;
  subtitulo: string;
  guia: Guia;
  perfiles: DemoProfile[];
  inicio: Record<string, string>;
  // Ruta del selector de perfil, p. ej. "/fund".
  selector: string;
};

const BARRA_DEMO: { control: string; uso: string }[] = [
  { control: "Perfil", uso: "Cambia de perfil sin salir. Te lleva al inicio de ese perfil." },
  { control: "x1 · x60 · x1440", uso: "Velocidad del reloj simulado: tiempo real, una hora por minuto o un día por minuto. Sirve para ver avanzar los SLA y los plazos." },
  { control: "+24 h", uso: "Adelanta el reloj un día." },
  { control: "Reiniciar demo", uso: "Regresa los datos de ejemplo al estado inicial y el reloj a la hora real." },
  { control: "Demo", uso: "En celular la barra aparece como este botón abajo a la derecha; tócalo para abrirla." },
];

export function GuiaPrototipo({ nombre, subtitulo, guia, perfiles, inicio, selector }: Props) {
  const router = useRouter();
  const hydrated = useDemoHydrated();
  const { profile, setProfile } = useDemo();
  const actual = perfiles.some((p) => p.value === profile) ? profile : null;

  function entrar(perfil: string) {
    setProfile(perfil);
    router.push(inicio[perfil]);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {nombre} · {subtitulo}
        </p>
        <PageHeader
          title="Cómo usar el prototipo"
          description={guia.queEs}
          actions={
            <Button variant="outline" onClick={() => router.push(actual ? inicio[actual] : selector)}>
              <ArrowLeft data-icon="inline-start" />
              {actual ? "Volver" : "Elegir perfil"}
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Qué está simulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              {guia.simulado.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Barra de demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Está fija abajo de la pantalla. No es parte del sistema final.</p>
            <dl className="flex flex-col gap-2 text-sm">
              {BARRA_DEMO.map((b) => (
                <div key={b.control} className="flex flex-col gap-0.5">
                  <dt className="font-medium">{b.control}</dt>
                  <dd className="text-muted-foreground">{b.uso}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info />
        <AlertTitle>Orden recomendado</AlertTitle>
        <AlertDescription>{guia.orden}</AlertDescription>
      </Alert>

      <section className="flex flex-col gap-3" aria-labelledby="recorridos">
        <h2 id="recorridos" className="text-lg font-light tracking-[0.125em] uppercase">
          Recorrido por perfil
        </h2>
        {hydrated ? (
          <Recorridos guia={guia} perfiles={perfiles} inicial={actual ?? guia.perfiles[0]?.perfil} onEntrar={entrar} />
        ) : (
          <Skeleton className="h-96 w-full" />
        )}
      </section>
    </main>
  );
}

// Pestañas controladas: la inicial es el perfil activo al abrir la Ayuda y no cambia si "Entrar como" cambia el perfil.
function Recorridos({ guia, perfiles, inicial, onEntrar }: { guia: Guia; perfiles: DemoProfile[]; inicial?: string; onEntrar: (perfil: string) => void }) {
  const [tab, setTab] = useState(inicial);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-4">
      <TabsList className="h-auto max-w-full flex-wrap justify-start">
        {guia.perfiles.map((r) => (
          <TabsTrigger key={r.perfil} value={r.perfil}>
            {etiqueta(perfiles, r.perfil)}
          </TabsTrigger>
        ))}
      </TabsList>
      {guia.perfiles.map((r) => (
        <TabsContent key={r.perfil} value={r.perfil}>
          <Recorrido recorrido={r} etiqueta={etiqueta(perfiles, r.perfil)} onEntrar={() => onEntrar(r.perfil)} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function etiqueta(perfiles: DemoProfile[], valor: string) {
  return perfiles.find((p) => p.value === valor)?.label ?? valor;
}

function Recorrido({ recorrido: r, etiqueta, onEntrar }: { recorrido: RecorridoPerfil; etiqueta: string; onEntrar: () => void }) {
  const Icono = r.dispositivo === "Escritorio" ? Laptop : Tablet;
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{etiqueta}</CardTitle>
            <Badge variant="secondary">
              <Icono data-icon="inline-start" />
              {r.dispositivo}
            </Badge>
          </div>
          <Button onClick={onEntrar}>
            Entrar como {etiqueta}
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{r.resumen}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {r.requisito && (
          <Alert>
            <Info />
            <AlertTitle>Antes de empezar</AlertTitle>
            <AlertDescription>{r.requisito}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">En tu menú</h3>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {r.secciones.map((s) => (
              <div key={s.nombre} className="flex flex-col gap-0.5">
                <dt className="font-medium">{s.nombre}</dt>
                <dd className="text-muted-foreground">{s.descripcion}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Paso a paso</h3>
          <ol className="flex flex-col divide-y border-y">
            {r.pasos.map((paso, i) => (
              <li key={paso.accion} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 py-3 text-sm">
                <span className="font-medium text-muted-foreground tabular-nums" aria-hidden>
                  {i + 1}.
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p>{paso.accion}</p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Qué debe pasar: </span>
                    {paso.resultado}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
