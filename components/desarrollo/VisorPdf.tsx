"use client";

import dynamic from "next/dynamic";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

// react-pdf usa APIs del navegador: se carga solo en cliente.
const DocumentViewer = dynamic(() => import("@/components/shared/DocumentViewer"), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export type PdfAbierto = { src: string; titulo: string; descripcion?: string; acciones?: React.ReactNode };

// Visor de un PDF (lámina de la biblioteca, archivo del paquete) en un panel lateral.
export function VisorPdf({ abierto, onOpenChange }: { abierto: PdfAbierto | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={abierto !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-3xl">
        {abierto && (
          <>
            <SheetHeader>
              <SheetTitle>{abierto.titulo}</SheetTitle>
              {abierto.descripcion && <SheetDescription>{abierto.descripcion}</SheetDescription>}
            </SheetHeader>
            <div className="min-h-0 flex-1 border-y">
              <DocumentViewer document={{ type: "pdf", src: abierto.src }} />
            </div>
            {abierto.acciones && <div className="flex flex-wrap gap-2 px-4 pb-4">{abierto.acciones}</div>}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
