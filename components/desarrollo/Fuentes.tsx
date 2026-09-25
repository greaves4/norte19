"use client";

// "Fuente" junto a cada dato: los documentos del corpus se abren en el visor de texto en la página citada; los inputs
// del proyecto abren su PDF (si ya se cargó). El visor es único por página, a través de este proveedor.
import { FileText } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { VisorDocumentoCorpus, type DocumentoAbierto } from "@/components/desarrollo/VisorDocumentoCorpus";
import { hotelPorId } from "@/lib/fixtures/desarrollo";
import { documentoCorpus } from "@/lib/sim/desarrollo/consulta";
import { useDesarrollo } from "@/lib/store/desarrollo";
import type { Fuente } from "@/lib/types/desarrollo";
import { cn } from "@/lib/utils";

const Contexto = createContext<(d: DocumentoAbierto) => void>(() => {});

export function ProveedorFuentes({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState<DocumentoAbierto | null>(null);
  return (
    <Contexto.Provider value={setAbierto}>
      {children}
      <VisorDocumentoCorpus abierto={abierto} onOpenChange={(o) => !o && setAbierto(null)} />
    </Contexto.Provider>
  );
}

export function useAbrirDocumento() {
  return useContext(Contexto);
}

export function etiquetaFuente(f: Fuente) {
  if (f.tipo === "input") return [f.documento, f.clavePlano ?? (f.pagina ? `pág. ${f.pagina}` : null)].filter(Boolean).join(" · ");
  const doc = documentoCorpus(f.documento);
  const hotel = hotelPorId(f.hotelId)?.nombre.replace("City Express ", "");
  return [hotel, doc?.titulo.split(" · ")[0] ?? f.documento, f.pagina ? `pág. ${f.pagina}` : null].filter(Boolean).join(" · ");
}

function EnlaceFuente({ fuente: f }: { fuente: Fuente }) {
  const abrir = useAbrirDocumento();
  const input = useDesarrollo((s) => (f.tipo === "input" ? s.proyecto.inputs.find((i) => i.id === f.inputId) : undefined));
  const clase = "inline-flex max-w-full items-center gap-1 text-left underline-offset-4 hover:underline";
  if (f.tipo === "corpus" && documentoCorpus(f.documento)) {
    return (
      <button type="button" className={clase} onClick={() => abrir({ documento: f.documento, pagina: f.pagina })}>
        <FileText className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{etiquetaFuente(f)}</span>
      </button>
    );
  }
  if (f.tipo === "input" && input?.archivo?.tipo === "pdf") {
    return (
      <a href={`${input.archivo.src}${f.pagina ? `#page=${f.pagina}` : ""}`} target="_blank" rel="noreferrer" className={clase}>
        <FileText className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{etiquetaFuente(f)}</span>
      </a>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      {etiquetaFuente(f)}
      {f.tipo === "input" && !input?.archivo && <span className="text-muted-foreground">(input pendiente)</span>}
    </span>
  );
}

// Lista compacta: "Fuente: A · B · +3".
export function Fuentes({ fuentes, max = 3, className }: { fuentes: Fuente[]; max?: number; className?: string }) {
  const [todas, setTodas] = useState(false);
  if (!fuentes.length) return null;
  const visibles = todas ? fuentes : fuentes.slice(0, max);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", className)}>
      <span className="font-medium">{fuentes.length === 1 ? "Fuente:" : "Fuentes:"}</span>
      {visibles.map((f, i) => (
        <EnlaceFuente key={i} fuente={f} />
      ))}
      {fuentes.length > max && (
        <button type="button" className="underline underline-offset-4" onClick={() => setTodas(!todas)}>
          {todas ? "Ver menos" : `+${fuentes.length - max}`}
        </button>
      )}
    </div>
  );
}
