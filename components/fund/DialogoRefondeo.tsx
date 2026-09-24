"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { hotelPorId } from "@/lib/fixtures/fund";
import { mxn } from "@/lib/format";
import { calcularRefondeo, NOTA_FORMULA } from "@/lib/sim/fund/refondeo";
import { useFund } from "@/lib/store/fund";
import type { Tarjeta } from "@/lib/types/fund";

type Props = {
  tarjetas: Tarjeta[] | null;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (items: { tarjetaId: string; monto: number }[]) => void;
};

// Re-fondeo automático por lote: cálculo por tarjeta con monto editable.
export function DialogoRefondeo({ tarjetas, onOpenChange, onConfirmar }: Props) {
  const movimientos = useFund((s) => s.movimientos);
  const [editados, setEditados] = useState<Record<string, string>>({});

  const filas = useMemo(
    () =>
      (tarjetas ?? []).map((t) => {
        const calculo = calcularRefondeo(t, movimientos);
        const texto = editados[t.id];
        const monto = texto === undefined ? calculo.propuesto : Number(texto.replace(/[$,\s]/g, ""));
        return { tarjeta: t, calculo, texto, monto: Number.isFinite(monto) ? monto : 0 };
      }),
    [tarjetas, movimientos, editados],
  );
  const total = filas.reduce((s, f) => s + (f.monto > 0 ? f.monto : 0), 0);
  const aDispersar = filas.filter((f) => f.monto > 0);

  function cambiar(abierto: boolean) {
    if (!abierto) setEditados({});
    onOpenChange(abierto);
  }

  return (
    <Dialog open={tarjetas !== null} onOpenChange={cambiar}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Re-fondeo automático</DialogTitle>
          <DialogDescription>
            Presupuesto del corte − saldo actual + aprobados y autorizados desde el último fondeo. {NOTA_FORMULA}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-2 font-medium">Hotel</th>
                <th className="p-2 text-right font-medium">Presupuesto</th>
                <th className="p-2 text-right font-medium">Saldo</th>
                <th className="p-2 text-right font-medium">Aprobados</th>
                <th className="p-2 text-right font-medium">Monto a dispersar</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ tarjeta: t, calculo, texto, monto }) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-2">
                    <span className="flex flex-col">
                      <span>{hotelPorId(t.hotelId)?.nombre}</span>
                      <span className="text-xs text-muted-foreground">•••• {t.ultimosCuatro}</span>
                    </span>
                  </td>
                  <td className="p-2 text-right tabular-nums">{mxn(calculo.presupuesto)}</td>
                  <td className="p-2 text-right tabular-nums">{mxn(calculo.saldo)}</td>
                  <td className="p-2 text-right tabular-nums">{mxn(calculo.aprobados)}</td>
                  <td className="p-2">
                    <Input
                      inputMode="decimal"
                      value={texto ?? calculo.propuesto.toFixed(2)}
                      onChange={(e) => setEditados((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      aria-label={`Monto a dispersar a ${hotelPorId(t.hotelId)?.nombre}`}
                      aria-invalid={!(monto >= 0) ? true : undefined}
                      className="ml-auto w-32 text-right tabular-nums"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm">
          Total a dispersar: <span className="font-semibold tabular-nums">{mxn(total)}</span>
          {filas.length !== aDispersar.length && (
            <span className="text-muted-foreground"> · {filas.length - aDispersar.length} en cero no se dispersan</span>
          )}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => cambiar(false)}>
            Cancelar
          </Button>
          <Button
            disabled={aDispersar.length === 0}
            onClick={() => {
              onConfirmar(aDispersar.map((f) => ({ tarjetaId: f.tarjeta.id, monto: f.monto })));
              cambiar(false);
            }}
          >
            Dispersar {aDispersar.length === 1 ? "1 fondeo" : `${aDispersar.length} fondeos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
