"use client";

// Visor de PDF e imagen. Se carga solo en cliente (next/dynamic con ssr: false) desde SplitViewer.
import { ChevronLeft, ChevronRight, Maximize, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Debe configurarse en el mismo módulo que usa <Document>. El archivo lo copia scripts/copy-pdf-worker.mjs.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export type ViewerDocument = { type: "pdf" | "image"; src: string; title?: string };

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export default function DocumentViewer({ document: doc, onLoad }: { document: ViewerDocument; onLoad?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  // El ancho "ajustado" es el del panel; el zoom multiplica sobre él.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPage(1);
    setNumPages(0);
    setZoom(1);
    setError(false);
  }, [doc.src]);

  const pageWidth = Math.max(width - 32, 200) * zoom;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5 text-sm">
        {doc.title && <span className="mr-auto min-w-0 truncate px-1 font-medium">{doc.title}</span>}
        {doc.type === "pdf" && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-14 text-center tabular-nums">
              {numPages ? `${page} / ${numPages}` : "–"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(p + 1, numPages))}
              disabled={page >= numPages}
              aria-label="Página siguiente"
            >
              <ChevronRight />
            </Button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Alejar"
          >
            <Minus />
          </Button>
          <span className="min-w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Acercar"
          >
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom(1)} aria-label="Ajustar al ancho">
            <Maximize />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto bg-muted p-4">
        {error ? (
          <p className="text-sm text-muted-foreground">No se pudo abrir el documento.</p>
        ) : doc.type === "pdf" ? (
          width > 0 && (
            <Document
              file={doc.src}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={() => setError(true)}
              loading={<Skeleton className="aspect-[8.5/11] w-full" />}
              className="flex justify-center"
            >
              <Page
                pageNumber={page}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<Skeleton className="aspect-[8.5/11]" style={{ width: pageWidth }} />}
                onRenderSuccess={onLoad}
                className="shadow-sm"
              />
            </Document>
          )
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- fuentes locales o blob: sin optimización de Next
          <img
            src={doc.src}
            alt={doc.title ?? "Documento"}
            onError={() => setError(true)}
            onLoad={onLoad}
            className="mx-auto h-auto max-w-none"
            style={{ width: `${zoom * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
