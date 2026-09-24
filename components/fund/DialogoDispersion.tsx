"use client";

import { toast } from "sonner";
import { ProgressRunner } from "@/components/shared/ProgressRunner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { mxn } from "@/lib/format";
import type { DispersionEnCurso } from "@/lib/sim/fund/payconnect";

// Muestra la dispersión Pay Connect en curso. Si se cierra antes de terminar, el webhook "llega" igual.
export function DialogoDispersion({ dispersion, onClose }: { dispersion: DispersionEnCurso | null; onClose: () => void }) {
  const [terminada, setTerminada] = useState(false);
  const total = (dispersion?.dispersiones ?? []).reduce((s, d) => s + d.monto, 0);
  const cantidad = dispersion?.dispersiones.length ?? 0;

  function cerrar() {
    if (dispersion && !terminada) {
      dispersion.finalizar();
      toast.info("La dispersión sigue en Pay Connect", { description: "El webhook actualizará el estatus del fondeo." });
    }
    setTerminada(false);
    onClose();
  }

  return (
    <Dialog open={dispersion !== null} onOpenChange={(open) => !open && cerrar()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Dispersión Pay Connect</DialogTitle>
          <DialogDescription>
            {cantidad === 1 ? "1 fondeo" : `${cantidad} fondeos`} por {mxn(total)}. Los estatus se actualizan con la respuesta de Pay Connect.
          </DialogDescription>
        </DialogHeader>
        {dispersion && (
          <ProgressRunner
            key={dispersion.dispersiones.map((d) => d.fondeoId).join("-")}
            autoStart
            steps={dispersion.pasos}
            onStepDone={dispersion.alTerminarPaso}
            onDone={() => {
              setTerminada(true);
              toast.success("Fondeo depositado", { description: `${cantidad === 1 ? "1 tarjeta" : `${cantidad} tarjetas`} · ${mxn(total)}` });
            }}
          />
        )}
        <DialogFooter>
          <Button variant={terminada ? "default" : "outline"} onClick={cerrar}>
            {terminada ? "Listo" : "Cerrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
