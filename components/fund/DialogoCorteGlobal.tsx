"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFund } from "@/lib/store/fund";
import { NOMBRE_CORTE, type Corte } from "@/lib/types/fund";

const CORTES = (Object.keys(NOMBRE_CORTE) as Corte[]).map((c) => ({ value: c, label: NOMBRE_CORTE[c] }));

export function DialogoCorteGlobal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [corte, setCorte] = useState<Corte>("quincenal");
  const total = useFund((s) => s.tarjetas.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar corte global</DialogTitle>
          <DialogDescription>Aplica la misma periodicidad de corte a las {total} tarjetas. Después puedes ajustar cada una en su detalle.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="corte-global">Periodicidad</Label>
          <Select items={CORTES} value={corte} onValueChange={(v) => v && setCorte(v as Corte)}>
            <SelectTrigger id="corte-global" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CORTES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              useFund.getState().configurarCorte("global", corte);
              toast.success("Corte global actualizado", { description: `${total} tarjetas con corte ${NOMBRE_CORTE[corte].toLowerCase()}.` });
              onOpenChange(false);
            }}
          >
            Aplicar a todas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
