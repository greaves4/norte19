"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MINIMO = 10;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion: React.ReactNode;
  etiqueta: string;
  accion: string;
  destructiva?: boolean;
  // Texto de ayuda bajo el campo.
  ayuda?: string;
  onConfirmar: (justificacion: string) => void;
};

// Diálogo con justificación obligatoria (Fund: rechazo y autorización; Contratos: regresar y rechazar a ajustes).
export function DialogoJustificacion({ open, onOpenChange, titulo, descripcion, etiqueta, accion, destructiva, ayuda = "Obligatoria. Queda en el historial del movimiento.", onConfirmar }: Props) {
  const [texto, setTexto] = useState("");
  const [intento, setIntento] = useState(false);
  const valido = texto.trim().length >= MINIMO;

  function cambiar(abierto: boolean) {
    if (!abierto) {
      setTexto("");
      setIntento(false);
    }
    onOpenChange(abierto);
  }

  return (
    <Dialog open={open} onOpenChange={cambiar}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setIntento(true);
            if (!valido) return;
            onConfirmar(texto.trim());
            cambiar(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>{descripcion}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="justificacion">{etiqueta}</Label>
            <Textarea
              id="justificacion"
              autoFocus
              rows={4}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              aria-invalid={intento && !valido ? true : undefined}
              aria-describedby="justificacion-ayuda"
            />
            <p id="justificacion-ayuda" className={intento && !valido ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
              {intento && !valido ? `Escribe al menos ${MINIMO} caracteres.` : ayuda}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => cambiar(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant={destructiva ? "destructive" : "default"}>
              {accion}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
