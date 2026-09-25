"use client";

import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { hotelPorId } from "@/lib/fixtures/desarrollo";
import { documentoCorpus } from "@/lib/sim/desarrollo/consulta";

export type DocumentoAbierto = { documento: string; pagina?: number; resaltar?: string };

// Visor del texto de origen de un documento del corpus, abierto en la página citada.
export function VisorDocumentoCorpus({ abierto, onOpenChange }: { abierto: DocumentoAbierto | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={abierto !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">{abierto && <Contenido key={`${abierto.documento}-${abierto.pagina}`} abierto={abierto} />}</SheetContent>
    </Sheet>
  );
}

function Contenido({ abierto }: { abierto: DocumentoAbierto }) {
  const doc = documentoCorpus(abierto.documento);
  const [pagina, setPagina] = useState(Math.min(Math.max(abierto.pagina ?? 1, 1), doc?.textoPaginas.length ?? 1));
  if (!doc) {
    return (
      <SheetHeader>
        <SheetTitle>Documento no disponible</SheetTitle>
        <SheetDescription>Este documento no forma parte del corpus procesado.</SheetDescription>
      </SheetHeader>
    );
  }
  const total = doc.textoPaginas.length;
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          {doc.titulo}
        </SheetTitle>
        <SheetDescription>
          {hotelPorId(doc.hotelId)?.nombre} · texto extraído del documento de origen
          {abierto.pagina ? ` · la fuente cita la página ${abierto.pagina}` : ""}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-3 px-4 pb-6">
        <div className="flex items-center justify-between gap-2 border-y py-1.5">
          <Button variant="ghost" size="icon-sm" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <span className="text-sm tabular-nums" aria-live="polite">
            Página {pagina} de {total}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setPagina((p) => Math.min(total, p + 1))} disabled={pagina >= total} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        </div>
        <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{doc.textoPaginas[pagina - 1]}</pre>
      </div>
    </>
  );
}
