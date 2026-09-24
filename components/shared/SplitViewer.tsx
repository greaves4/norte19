"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ViewerDocument } from "@/components/shared/DocumentViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type { ViewerDocument };

// react-pdf usa APIs del navegador: se carga solo en cliente.
const DocumentViewer = dynamic(() => import("@/components/shared/DocumentViewer"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const MIN_PCT = 30;
const MAX_PCT = 70;

type Props = {
  document: ViewerDocument;
  children: React.ReactNode;
  // Porcentaje inicial del panel del documento.
  defaultSplit?: number;
  // Define la altura; por defecto ocupa el alto disponible del contenedor.
  className?: string;
  // Se llama cuando el documento termina de mostrarse (primera página del PDF o imagen).
  onDocumentLoad?: () => void;
  // Página controlada del PDF. En móvil, cada cambio de `pageRequest` muestra la pestaña del documento.
  page?: number;
  onPageChange?: (page: number) => void;
  pageRequest?: number;
};

export function SplitViewer({ document: doc, children, defaultSplit = 50, className, onDocumentLoad, page, onPageChange, pageRequest }: Props) {
  const isMobile = useIsMobile();
  const [split, setSplit] = useState(clamp(defaultSplit));
  const containerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState("documento");
  useEffect(() => {
    if (pageRequest) setTab("documento");
  }, [pageRequest]);

  if (isMobile) {
    return (
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className={cn("flex h-full min-h-[480px] flex-col", className)}>
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="documento">Documento</TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="documento" className="min-h-0 flex-1 border">
          <DocumentViewer document={doc} onLoad={onDocumentLoad} page={page} onPageChange={onPageChange} />
        </TabsContent>
        <TabsContent value="datos" className="min-h-0 flex-1 overflow-auto">
          {children}
        </TabsContent>
      </Tabs>
    );
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => setSplit(clamp(((ev.clientX - rect.left) / rect.width) * 100));
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      document.body.style.removeProperty("user-select");
    };
    document.body.style.userSelect = "none";
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setSplit((s) => clamp(s - step));
    else if (e.key === "ArrowRight") setSplit((s) => clamp(s + step));
    else if (e.key === "Home") setSplit(MIN_PCT);
    else if (e.key === "End") setSplit(MAX_PCT);
    else return;
    e.preventDefault();
  }

  return (
    <div ref={containerRef} className={cn("flex h-full min-h-[480px] border", className)}>
      <div className="min-w-0 overflow-hidden" style={{ width: `${split}%` }}>
        <DocumentViewer document={doc} onLoad={onDocumentLoad} page={page} onPageChange={onPageChange} />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Cambiar tamaño de los paneles"
        aria-valuemin={MIN_PCT}
        aria-valuemax={MAX_PCT}
        aria-valuenow={Math.round(split)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className="group relative w-px shrink-0 cursor-col-resize touch-none bg-border outline-none focus-visible:bg-ring"
      >
        {/* Área de agarre más ancha que la línea visible. */}
        <span className="absolute inset-y-0 -left-1.5 w-3 group-hover:bg-border/60" />
      </div>
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

function clamp(pct: number) {
  return Math.min(Math.max(pct, MIN_PCT), MAX_PCT);
}
