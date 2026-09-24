"use client";

import { addDays, format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoNow } from "@/lib/demo";
import { useContratos } from "@/lib/store/contratos";
import type { Contrato } from "@/lib/types/contratos";

export type Prestando = { contrato: Pick<Contrato, "id" | "folio" | "contraparte">; numero: 1 | 2 | 3 };

// Registro de préstamo de un original: a quién y hasta cuándo.
export function DialogoPrestamo({ prestando: abierto, actor, onOpenChange }: { prestando: Prestando | null; actor: string; onOpenChange: (open: boolean) => void }) {
  // Conserva el último original mientras corre la animación de cierre.
  const [ultimo, setUltimo] = useState<Prestando | null>(abierto);
  if (abierto && abierto !== ultimo) setUltimo(abierto);
  const prestando = abierto ?? ultimo;
  const registrar = useContratos((s) => s.registrarPrestamo);
  const [aQuien, setAQuien] = useState("");
  const [hasta, setHasta] = useState("");
  const [intento, setIntento] = useState(false);
  const minimo = format(demoNow(), "yyyy-MM-dd");
  const hastaEfectivo = hasta || format(addDays(demoNow(), 7), "yyyy-MM-dd");
  const errores = { aQuien: !aQuien.trim(), hasta: hastaEfectivo < minimo };

  function cambiar(abierto: boolean) {
    if (!abierto) {
      setAQuien("");
      setHasta("");
      setIntento(false);
    }
    onOpenChange(abierto);
  }

  return (
    <Dialog open={abierto !== null} onOpenChange={cambiar}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setIntento(true);
            if (!prestando || errores.aQuien || errores.hasta) return;
            // Vence al final del día elegido.
            const limite = new Date(`${hastaEfectivo}T23:59:59`).toISOString();
            if (registrar(prestando.contrato.id, prestando.numero, aQuien, limite, actor)) {
              toast.success(`Original ${prestando.numero}/3 prestado`, { description: `A ${aQuien.trim()}, hasta el ${hastaEfectivo.split("-").reverse().join("/")}.` });
            } else {
              toast.error("Ese original ya está prestado");
            }
            cambiar(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Registrar préstamo · original {prestando?.numero}/3</DialogTitle>
            <DialogDescription>
              {prestando?.contrato.folio} · {prestando?.contrato.contraparte}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prestamo-quien">A quién</Label>
            <Input
              id="prestamo-quien"
              autoFocus
              value={aQuien}
              onChange={(e) => setAQuien(e.target.value)}
              placeholder="Nombre y área"
              aria-invalid={intento && errores.aQuien ? true : undefined}
              aria-describedby={intento && errores.aQuien ? "prestamo-quien-error" : undefined}
            />
            {intento && errores.aQuien && (
              <p id="prestamo-quien-error" className="text-sm text-destructive">
                Escribe a quién se presta.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prestamo-hasta">Hasta</Label>
            <Input
              id="prestamo-hasta"
              type="date"
              min={minimo}
              value={hastaEfectivo}
              onChange={(e) => setHasta(e.target.value)}
              aria-invalid={intento && errores.hasta ? true : undefined}
            />
            <p className={intento && errores.hasta ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
              {intento && errores.hasta ? "La fecha no puede ser anterior a hoy." : "Al pasar esta fecha se marca como préstamo vencido."}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => cambiar(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar préstamo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
