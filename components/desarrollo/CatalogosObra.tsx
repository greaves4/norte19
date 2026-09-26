"use client";

import { FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Fuentes } from "@/components/desarrollo/Fuentes";
import { RequiereFase } from "@/components/desarrollo/RequiereFase";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { Indicador } from "@/components/shared/Indicador";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge, type StatusMap } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularCapex, TIPO_CAMBIO } from "@/lib/sim/desarrollo/capex";
import { filasExcel, generarCatalogos, requierenRevision, UMBRAL_CONFIANZA, type CatalogoGenerado, type Confianza, type ConceptoGenerado } from "@/lib/sim/desarrollo/catalogos";
import { useDesarrollo } from "@/lib/store/desarrollo";

const CONFIANZA: StatusMap<Confianza> = {
  alta: { label: "Alta", tone: "success" },
  media: { label: "Media", tone: "warning" },
  baja: { label: "Baja", tone: "danger" },
};

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const mxn = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const mxnC = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const cant = (v: number) => n(v, v < 10 ? 2 : 0);

const col = dataGridColumns<ConceptoGenerado>();
const columnas = col.columns([
  col.accessor("clave", { header: "Clave", cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span> }),
  col.accessor("concepto", {
    header: "Concepto",
    cell: (c) => (
      <span className="flex min-w-36 flex-col gap-1 whitespace-normal">
        <span>{c.getValue()}</span>
        <span className="xl:hidden">
          <Fuentes fuentes={c.row.original.fuentes} max={1} />
        </span>
      </span>
    ),
  }),
  col.accessor("cantidad", {
    header: "Cantidad",
    cell: (c) => (
      <span className="flex flex-col items-end">
        <span className="whitespace-nowrap tabular-nums">
          {cant(c.getValue())} <span className="text-muted-foreground">{c.row.original.unidad}</span>
        </span>
        {c.row.original.rango && c.row.original.hoteles > 1 && (
          <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {cant(c.row.original.rango[0])}–{cant(c.row.original.rango[1])}
          </span>
        )}
      </span>
    ),
    meta: { align: "end", exportValue: (v) => Number(Number(v).toFixed(3)) },
  }),
  col.accessor((k) => k.precioUnitario ?? 0, {
    id: "pu",
    header: "P.U.",
    cell: (c) => (c.row.original.precioUnitario === null ? <span className="text-muted-foreground">Por cotizar</span> : <span className="whitespace-nowrap">{mxnC(c.row.original.precioUnitario)}</span>),
    meta: { align: "end", label: "P.U. (MXN)", hideBelow: "xl" },
  }),
  col.accessor("importe", {
    header: "Importe",
    cell: (c) => (
      <span className="flex flex-col items-end whitespace-nowrap">
        {c.row.original.precioUnitario === null ? <span className="text-muted-foreground">Por cotizar</span> : mxn(c.getValue())}
        {c.row.original.precioUnitario !== null && <span className="text-xs text-muted-foreground xl:hidden">P.U. {mxnC(c.row.original.precioUnitario)}</span>}
      </span>
    ),
    meta: { align: "end", label: "Importe (MXN)" },
  }),
  col.accessor("confianza", {
    header: "Confianza",
    cell: (c) => <StatusBadge status={c.getValue()} map={CONFIANZA} />,
    meta: { exportValue: (v) => CONFIANZA[v as Confianza].label },
  }),
  col.display({ id: "fuente", header: "Fuente", cell: (c) => <Fuentes fuentes={c.row.original.fuentes} max={1} className="min-w-44" />, meta: { hideBelow: "xl" } }),
]);

export function CatalogosObra() {
  const p = useDesarrollo((s) => s.proyecto);
  const setFactor = useDesarrollo((s) => s.setFactorActualizacion);
  const [factor, setFactorTexto] = useState(String(p.factorActualizacion));
  const catalogos = useMemo(() => generarCatalogos(p.definicion.cuadroAreas, p.llaves, p.niveles, p.factorActualizacion), [p.definicion.cuadroAreas, p.llaves, p.niveles, p.factorActualizacion]);

  if (p.fase < 4) return <RequiereFase titulo="Catálogos de obra" descripcion="Conceptos por ratio del corpus sobre el cuadro de áreas aprobado." />;

  const total = catalogos.reduce((t, c) => t + c.total, 0);
  const capex = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, !!p.inputs.find((i) => i.id === "capex_objetivo")?.archivo);
  const directoCapexMxn = capex.directoUsd * TIPO_CAMBIO;
  const revision = requierenRevision(catalogos);
  const conceptos = catalogos.reduce((t, c) => t + c.conceptos.length, 0);

  async function exportar(lista: CatalogoGenerado[]) {
    const XLSX = await import("xlsx");
    const libro = XLSX.utils.book_new();
    for (const c of lista) {
      const hoja = XLSX.utils.aoa_to_sheet(filasExcel(c));
      hoja["!cols"] = [{ wch: 10 }, { wch: 60 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(libro, hoja, c.nombre.slice(0, 31));
    }
    const uno = lista.length === 1 ? lista[0] : null;
    XLSX.writeFile(libro, uno ? `catalogo-${uno.id.replace(/_/g, "-")}-juarez.xlsx` : "catalogos-de-obra-juarez.xlsx");
    toast.success(uno ? `Catálogo ${uno.nombre} exportado a Excel` : "Catálogos exportados a Excel", {
      description: uno ? `${uno.conceptos.length} conceptos con clave, unidad, cantidad, P.U. e importe.` : "Una hoja por catálogo: clave, concepto, unidad, cantidad, P.U. e importe.",
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader
        title="Catálogos de obra"
        description="Cantidades por ratio del corpus sobre el cuadro de áreas aprobado, con precios históricos actualizados. La confianza refleja cuánto varía el ratio entre hoteles."
        actions={
          <Button variant="outline" onClick={() => void exportar(catalogos)}>
            <FileSpreadsheet data-icon="inline-start" />
            Exportar los 5 catálogos
          </Button>
        }
      />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <Indicador etiqueta="Costo directo (5 catálogos)" valor={mxn(total)} nota={`${(total / TIPO_CAMBIO).toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`} />
        </li>
        <li>
          <Indicador
            etiqueta="Contra el CAPEX de la Definición"
            valor={`${total >= directoCapexMxn ? "+" : ""}${n((total / directoCapexMxn - 1) * 100, 1)}%`}
            nota={`CAPEX directo ${mxn(directoCapexMxn)}`}
          />
        </li>
        <li>
          <Indicador etiqueta="Conceptos" valor={n(conceptos)} nota="Obra civil e instalaciones" />
        </li>
        <li>
          <Indicador etiqueta="Requieren revisión" valor={n(revision.length)} nota="Confianza baja o sin referencia" />
        </li>
      </ul>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Tabs defaultValue="obra_civil" className="min-w-0 gap-4">
          <TabsList className="h-auto max-w-full flex-wrap justify-start">
            {catalogos.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.nombre}
              </TabsTrigger>
            ))}
          </TabsList>
          {catalogos.map((c) => (
            <TabsContent key={c.id} value={c.id} className="flex flex-col gap-3">
              <TotalCatalogo c={c} onExportar={() => void exportar([c])} />
              <DataGrid columns={columnas} data={c.conceptos} getRowId={(k) => k.clave} initialPageSize={50} searchPlaceholder="Buscar concepto o clave" exportable={false} />
            </TabsContent>
          ))}
        </Tabs>

        <aside className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Requiere revisión · {revision.length}</CardTitle>
              <CardDescription>Conceptos con confianza baja (dispersión ≥ {n(UMBRAL_CONFIANZA.media * 100)}% o un solo hotel) o sin referencia en el corpus.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y text-sm">
                {revision.map(({ catalogo, concepto: k }) => (
                  <li key={k.clave} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{k.clave}</span>
                      <span className="text-xs text-muted-foreground">{catalogos.find((c) => c.id === catalogo)?.nombre}</span>
                    </span>
                    <span>{k.concepto}</span>
                    <span className="text-xs text-muted-foreground">{k.motivoRevision}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">Precios del corpus llevados a 2022 y actualizados con el factor {n(p.factorActualizacion, 2)} (el mismo del CAPEX).</p>
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = Number(factor);
                  if (!(f >= 0.8 && f <= 2)) {
                    toast.error("Usa un factor entre 0.80 y 2.00");
                    return;
                  }
                  setFactor(f);
                  toast.success(`Factor de actualización: ${n(f, 2)}`, { description: "Catálogos y CAPEX se recalcularon." });
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="factor-catalogos">Factor de actualización</Label>
                  <Input id="factor-catalogos" inputMode="decimal" value={factor} onChange={(e) => setFactorTexto(e.target.value)} className="w-28" />
                </div>
                <Button type="submit" variant="outline">
                  Aplicar
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function TotalCatalogo({ c, onExportar }: { c: CatalogoGenerado; onExportar: () => void }) {
  const conteo = (x: Confianza) => c.conceptos.filter((k) => k.confianza === x).length;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="flex flex-col gap-0.5">
        <span>
          Total {c.nombre}: <span className="font-semibold tabular-nums">{mxn(c.total)}</span>
        </span>
        <span className="text-muted-foreground">
          {c.conceptos.length} conceptos · confianza alta {conteo("alta")}, media {conteo("media")}, baja {conteo("baja")}
        </span>
      </span>
      <Button size="sm" onClick={onExportar}>
        <FileSpreadsheet data-icon="inline-start" />
        Exportar {c.nombre} a Excel
      </Button>
    </div>
  );
}
