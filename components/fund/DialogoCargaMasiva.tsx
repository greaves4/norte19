"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UploadZone, type UploadValue } from "@/components/shared/UploadZone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { hotelPorId } from "@/lib/fixtures/fund";
import { mxn } from "@/lib/format";
import { archivoEjemplo, descargarPlantilla, leerExcel, revisarFilas, type FilaRevisada } from "@/lib/sim/fund/cargaMasiva";
import { useFund } from "@/lib/store/fund";

const EJEMPLO = { id: "carga-ejemplo", name: "Carga de fondeos de ejemplo (7 filas)", src: "generado:carga-masiva" };

export function DialogoCargaMasiva({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const tarjetas = useFund((s) => s.tarjetas);
  const [filas, setFilas] = useState<FilaRevisada[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const validas = (filas ?? []).filter((f) => !f.error);

  async function cargar(value: UploadValue | null) {
    setError(null);
    if (!value) return setFilas(null);
    try {
      const archivo = value.kind === "file" ? value.file : await archivoEjemplo(useFund.getState().tarjetas);
      const leidas = await leerExcel(archivo);
      if (leidas.length === 0) throw new Error("vacío");
      setFilas(revisarFilas(leidas, useFund.getState().tarjetas));
    } catch {
      setFilas(null);
      setError("No se pudo leer el archivo. Usa la plantilla de Excel con las columnas Hotel, Tarjeta, Monto y Referencia.");
    }
  }

  function aplicar() {
    const r = useFund.getState().aplicarCargaMasiva(validas);
    toast.success(`${r.aplicadas.length} fondeos aplicados`, {
      description: `Total ${mxn(r.aplicadas.reduce((s, a) => s + a.monto, 0))}${r.errores.length ? ` · ${r.errores.length} con error` : ""}`,
    });
    cambiar(false);
  }

  function cambiar(abierto: boolean) {
    if (!abierto) {
      setFilas(null);
      setError(null);
    }
    onOpenChange(abierto);
  }

  return (
    <Dialog open={open} onOpenChange={cambiar}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Carga masiva de fondeos</DialogTitle>
          <DialogDescription>Sube el Excel con los fondeos. Se valida cada fila antes de aplicar.</DialogDescription>
        </DialogHeader>

        <Button variant="outline" size="sm" className="self-start" onClick={() => descargarPlantilla(tarjetas)}>
          <Download data-icon="inline-start" />
          Descargar plantilla
        </Button>

        <UploadZone accept=".xlsx,.xls,.csv" fixtures={[EJEMPLO]} onFile={cargar} label="Arrastra el Excel o selecciónalo" hint="Formatos: XLSX, XLS o CSV" />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {filas && (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              <span className="font-medium">{validas.length} válidas</span>
              {filas.length > validas.length && <span className="text-destructive"> · {filas.length - validas.length} con error</span>}
            </p>
            <div className="overflow-x-auto border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2 font-medium">Fila</th>
                    <th className="p-2 font-medium">Hotel</th>
                    <th className="p-2 font-medium">Tarjeta</th>
                    <th className="p-2 text-right font-medium">Monto</th>
                    <th className="p-2 font-medium">Referencia</th>
                    <th className="p-2 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.fila} className="border-b last:border-0" data-error={f.error ? true : undefined}>
                      <td className="p-2 tabular-nums">{f.fila}</td>
                      <td className="p-2">{f.tarjetaId ? hotelPorId(f.tarjetaId.replace(/^tj-/, ""))?.nombre : f.hotel ?? "—"}</td>
                      <td className="p-2 tabular-nums">•••• {f.ultimosCuatro}</td>
                      <td className="p-2 text-right tabular-nums">{Number.isFinite(f.monto) ? mxn(f.monto) : "—"}</td>
                      <td className="p-2">{f.referencia || "—"}</td>
                      <td className="p-2">
                        {f.error ? <span className="text-destructive">{f.error}</span> : <Badge variant="secondary">Válida</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => cambiar(false)}>
            Cancelar
          </Button>
          <Button disabled={validas.length === 0} onClick={aplicar}>
            Aplicar {validas.length === 1 ? "1 fondeo" : `${validas.length} fondeos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
