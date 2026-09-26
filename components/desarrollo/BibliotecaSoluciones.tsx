"use client";

import { Check, FileText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RequiereFase } from "@/components/desarrollo/RequiereFase";
import { VisorPdf, type PdfAbierto } from "@/components/desarrollo/VisorPdf";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hotelPorId } from "@/lib/fixtures/desarrollo";
import { BIBLIOTECA } from "@/lib/fixtures/desarrollo/biblioteca";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { normalizar } from "@/lib/texto";
import { DISCIPLINAS_CRITERIO, NOMBRE_DISCIPLINA_CRITERIO, NOMBRE_TIPO_BIBLIOTECA, type ElementoBiblioteca, type TipoBiblioteca } from "@/lib/types/desarrollo";

const TODOS = "todos";
const AREAS = [...new Set(BIBLIOTECA.map((b) => b.area))].sort();
const TIPOS = Object.keys(NOMBRE_TIPO_BIBLIOTECA) as TipoBiblioteca[];
const corto = (id: string) => hotelPorId(id)?.nombre.replace("City Express ", "") ?? id;

export function BibliotecaSoluciones() {
  const fase = useDesarrollo((s) => s.proyecto.fase);
  const agregados = useDesarrollo((s) => s.proyecto.bibliotecaAgregada);
  const agregar = useDesarrollo((s) => s.agregarABiblioteca);
  const quitar = useDesarrollo((s) => s.quitarDeBiblioteca);
  const [texto, setTexto] = useState("");
  const [disciplina, setDisciplina] = useState(TODOS);
  const [area, setArea] = useState(TODOS);
  const [tipo, setTipo] = useState(TODOS);
  const [abierto, setAbierto] = useState<ElementoBiblioteca | null>(null);

  const visibles = useMemo(() => {
    const q = normalizar(texto.trim());
    return BIBLIOTECA.filter(
      (b) =>
        (disciplina === TODOS || b.disciplina === disciplina) &&
        (area === TODOS || b.area === area) &&
        (tipo === TODOS || b.tipo === tipo) &&
        (!q || normalizar(`${b.titulo} ${b.descripcion} ${b.clave} ${b.puntos.join(" ")}`).includes(q)),
    );
  }, [texto, disciplina, area, tipo]);

  if (fase < 4) return <RequiereFase titulo="Biblioteca de soluciones" descripcion="Detalles constructivos, fichas de acabados, FF&E y especificaciones del corpus." />;

  function alternar(b: ElementoBiblioteca) {
    if (agregados.includes(b.id)) {
      quitar(b.id);
      toast.info("Se quitó del paquete de criterios", { description: b.titulo });
    } else {
      agregar(b.id);
      toast.success("Se agregó al paquete de criterios", { description: `${b.titulo} · origen: ${corto(b.hotelId)} · ${b.clave}` });
    }
  }

  const pdf: PdfAbierto | null = abierto
    ? {
        src: `/fixtures/desarrollo/biblioteca/${abierto.id}.pdf`,
        titulo: abierto.titulo,
        descripcion: `${NOMBRE_TIPO_BIBLIOTECA[abierto.tipo]} · ${hotelPorId(abierto.hotelId)?.nombre} · ${abierto.clave}`,
        acciones: <BotonAgregar b={abierto} agregado={agregados.includes(abierto.id)} onClick={() => alternar(abierto)} />,
      }
    : null;

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Biblioteca de soluciones"
        description={`${BIBLIOTECA.length} soluciones de los hoteles del corpus. Agrega las que apliquen al paquete de criterios de Juárez.`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/desarrollo/proyectos/juarez/criterios" />}>
            Paquete de criterios · {agregados.length}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Filtros de la biblioteca">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bib-texto">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="bib-texto" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cancelería, piso, rociador…" className="pl-8" />
          </div>
        </div>
        <Filtro id="bib-disciplina" etiqueta="Disciplina" valor={disciplina} onChange={setDisciplina} opciones={DISCIPLINAS_CRITERIO.map((d) => ({ value: d, label: NOMBRE_DISCIPLINA_CRITERIO[d] }))} />
        <Filtro id="bib-area" etiqueta="Área del hotel" valor={area} onChange={setArea} opciones={AREAS.map((a) => ({ value: a, label: a }))} />
        <Filtro id="bib-tipo" etiqueta="Tipo" valor={tipo} onChange={setTipo} opciones={TIPOS.map((t) => ({ value: t, label: NOMBRE_TIPO_BIBLIOTECA[t] }))} />
      </div>

      {visibles.length === 0 ? (
        <EmptyState icon={Search} title="Sin soluciones con esos filtros" description="Quita algún filtro o busca con otra palabra." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((b) => {
            const agregado = agregados.includes(b.id);
            return (
              <li key={b.id}>
                <Card size="sm" className="h-full">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{NOMBRE_TIPO_BIBLIOTECA[b.tipo]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {NOMBRE_DISCIPLINA_CRITERIO[b.disciplina]} · {b.area}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-snug">{b.titulo}</CardTitle>
                    <CardDescription>
                      {corto(b.hotelId)} · {b.clave}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">{b.descripcion}</CardContent>
                  <CardFooter className="mt-auto flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAbierto(b)}>
                      <FileText data-icon="inline-start" />
                      Ver documento
                    </Button>
                    <BotonAgregar b={b} agregado={agregado} onClick={() => alternar(b)} />
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <VisorPdf abierto={pdf} onOpenChange={(o) => !o && setAbierto(null)} />
    </div>
  );
}

function BotonAgregar({ b, agregado, onClick }: { b: ElementoBiblioteca; agregado: boolean; onClick: () => void }) {
  return (
    <Button size="sm" variant={agregado ? "secondary" : "default"} onClick={onClick} aria-pressed={agregado} aria-label={agregado ? `Quitar ${b.titulo} del paquete` : `Agregar ${b.titulo} al paquete`}>
      {agregado ? <Check data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
      {agregado ? "En el paquete" : "Agregar al paquete"}
    </Button>
  );
}

function Filtro({ id, etiqueta, valor, onChange, opciones }: { id: string; etiqueta: string; valor: string; onChange: (v: string) => void; opciones: { value: string; label: string }[] }) {
  const items = [{ value: TODOS, label: "Todas" }, ...opciones];
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Select items={items} value={valor} onValueChange={(v) => onChange((v as string | null) ?? TODOS)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
