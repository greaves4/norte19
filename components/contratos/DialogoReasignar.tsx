"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ABOGADOS, abogadoPorId } from "@/lib/fixtures/contratos";
import { cargaPorAbogado } from "@/lib/sim/contratos/asignacion";
import { useContratos } from "@/lib/store/contratos";
import type { Solicitud } from "@/lib/types/contratos";

type Props = {
  solicitud: Pick<Solicitud, "id" | "folio" | "abogadoId"> | null;
  actor: string;
  onOpenChange: (open: boolean) => void;
};

// Reasignación manual con la carga activa de cada abogado a la vista.
export function DialogoReasignar({ solicitud: abierta, actor, onOpenChange }: Props) {
  // Conserva la última solicitud mientras corre la animación de cierre.
  const [ultima, setUltima] = useState<Props["solicitud"]>(abierta);
  if (abierta && abierta !== ultima) setUltima(abierta);
  const solicitud = abierta ?? ultima;
  const solicitudes = useContratos((s) => s.solicitudes);
  const reasignar = useContratos((s) => s.reasignar);
  const [destino, setDestino] = useState<string | null>(null);
  const carga = cargaPorAbogado(solicitudes);
  const opciones = ABOGADOS.filter((a) => a.id !== solicitud?.abogadoId).map((a) => ({
    value: a.id,
    label: `${a.nombre} · ${carga[a.id]} activas`,
  }));

  function cambiar(abierto: boolean) {
    if (!abierto) setDestino(null);
    onOpenChange(abierto);
  }

  return (
    <Dialog open={abierta !== null} onOpenChange={cambiar}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!solicitud || !destino) return;
            if (reasignar(solicitud.id, destino, actor)) {
              toast.success(`${solicitud.folio} reasignada`, { description: `Ahora la atiende ${abogadoPorId(destino)?.nombre}. El SLA no se reinicia.` });
            } else {
              toast.error("Esta solicitud ya no se puede reasignar");
            }
            cambiar(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Reasignar {solicitud?.folio}</DialogTitle>
            <DialogDescription>Hoy la atiende {abogadoPorId(solicitud?.abogadoId ?? "")?.nombre}. Queda registrado en el historial.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reasignar-abogado">Nuevo abogado</Label>
            <Select items={opciones} value={destino} onValueChange={(v) => setDestino(v as string | null)}>
              <SelectTrigger id="reasignar-abogado" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => cambiar(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!destino}>
              Reasignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
