"use client";

import { Library, Printer, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { etiquetaFuente, Fuentes } from "@/components/desarrollo/Fuentes";
import { RequiereFase } from "@/components/desarrollo/RequiereFase";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoNow } from "@/lib/demo";
import { BIBLIOTECA } from "@/lib/fixtures/desarrollo/biblioteca";
import { hotelPorId } from "@/lib/fixtures/desarrollo";
import { crearCriterios } from "@/lib/fixtures/desarrollo/criterios";
import { esc, imprimirHtml } from "@/lib/imprimir";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { DISCIPLINAS_CRITERIO, NOMBRE_DISCIPLINA_CRITERIO, NOMBRE_TIPO_BIBLIOTECA, type Criterio, type ElementoBiblioteca, type Proyecto } from "@/lib/types/desarrollo";

const P = "/desarrollo/proyectos/juarez";

export function CriteriosDisciplina() {
  const p = useDesarrollo((s) => s.proyecto);
  const quitar = useDesarrollo((s) => s.quitarDeBiblioteca);
  const criterios = useMemo(() => crearCriterios(), []);
  const agregados = p.bibliotecaAgregada.map((id) => BIBLIOTECA.find((b) => b.id === id)).filter((b): b is ElementoBiblioteca => !!b);

  if (p.fase < 4) return <RequiereFase titulo="Criterios por disciplina" descripcion="Criterios de diseño con su fuente en el corpus y en los inputs del sitio." />;

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Criterios por disciplina"
        description="Punto de partida del ejecutivo: valores de referencia con el rango del corpus y su relación con el sitio. No sustituyen el diseño del proyectista."
        actions={
          <Button variant="outline" onClick={() => exportar(p, criterios, agregados)}>
            <Printer data-icon="inline-start" />
            Exportar paquete de criterios
          </Button>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Tabs defaultValue="estructura" className="min-w-0 gap-4">
          <TabsList className="h-auto max-w-full flex-wrap justify-start">
            {DISCIPLINAS_CRITERIO.map((d) => (
              <TabsTrigger key={d} value={d}>
                {NOMBRE_DISCIPLINA_CRITERIO[d]}
              </TabsTrigger>
            ))}
          </TabsList>
          {DISCIPLINAS_CRITERIO.map((d) => (
            <TabsContent key={d} value={d}>
              <ul className="grid gap-3 lg:grid-cols-2">
                {criterios
                  .filter((c) => c.disciplina === d)
                  .map((c) => (
                    <li key={c.id}>
                      <TarjetaCriterio c={c} />
                    </li>
                  ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Paquete de criterios</CardTitle>
            <CardDescription>
              {criterios.length} criterios y {agregados.length === 1 ? "1 solución" : `${agregados.length} soluciones`} de la biblioteca.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {agregados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Agrega detalles, fichas o especificaciones desde la biblioteca.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {agregados.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      {b.titulo}
                      <span className="block text-xs text-muted-foreground">
                        {NOMBRE_TIPO_BIBLIOTECA[b.tipo]} · {hotelPorId(b.hotelId)?.nombre.replace("City Express ", "")}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar ${b.titulo} del paquete`}
                      onClick={() => {
                        quitar(b.id);
                        toast.info(`${b.titulo} se quitó del paquete`);
                      }}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" nativeButton={false} render={<Link href={`${P}/biblioteca`} />}>
              <Library data-icon="inline-start" />
              Ir a la biblioteca
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TarjetaCriterio({ c }: { c: Criterio }) {
  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className="font-mono">{c.id}</span>
          {c.titulo}
        </CardDescription>
        <CardTitle className="text-base leading-snug">{c.valor}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {c.rango && (
          <p>
            <span className="text-muted-foreground">Corpus: </span>
            {c.rango}
          </p>
        )}
        {c.sitio && (
          <p>
            <span className="text-muted-foreground">Sitio: </span>
            {c.sitio}
          </p>
        )}
        <Fuentes fuentes={c.fuentes} max={2} />
      </CardContent>
    </Card>
  );
}

function exportar(p: Proyecto, criterios: Criterio[], agregados: ElementoBiblioteca[]) {
  const secciones = DISCIPLINAS_CRITERIO.map((d) => {
    const filas = criterios
      .filter((c) => c.disciplina === d)
      .map(
        (c) =>
          `<tr><td>${esc(c.id)}</td><td><strong>${esc(c.titulo)}</strong><br>${esc(c.valor)}${c.rango ? `<br><span class="muted small">Corpus: ${esc(c.rango)}</span>` : ""}${c.sitio ? `<br><span class="muted small">Sitio: ${esc(c.sitio)}</span>` : ""}</td><td class="small">${c.fuentes.map((f) => esc(etiquetaFuente(f))).join("<br>")}</td></tr>`,
      )
      .join("");
    return `<h2>${esc(NOMBRE_DISCIPLINA_CRITERIO[d])}</h2><table><thead><tr><th>ID</th><th>Criterio</th><th>Fuente</th></tr></thead><tbody>${filas}</tbody></table>`;
  }).join("");
  const biblio = agregados.length
    ? `<h2>Soluciones de la biblioteca</h2><table><thead><tr><th>ID</th><th>Solución</th><th>Origen</th></tr></thead><tbody>${agregados
        .map((b) => `<tr><td>${esc(b.id)}</td><td><strong>${esc(b.titulo)}</strong><br>${esc(b.descripcion)}</td><td class="small">${esc(hotelPorId(b.hotelId)?.nombre)} · ${esc(b.clave)}</td></tr>`)
        .join("")}</tbody></table>`
    : "";
  imprimirHtml({
    titulo: `Paquete de criterios · ${p.nombre}`,
    html: `<p class="muted">${p.llaves} llaves · Fase de Definición aprobada por ${esc(p.definicion.acta?.aprobadoPor)} · ${esc(demoNow().toLocaleDateString("es-MX", { dateStyle: "long" }))}</p>${secciones}${biblio}`,
  });
  toast.success("Paquete de criterios listo para imprimir o guardar en PDF");
}
