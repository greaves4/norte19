import type { Segmento } from "@/lib/texto";

// Texto con los segmentos coincidentes de una búsqueda resaltados.
export function Resaltado({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.resaltado ? (
          // TODO tokens: color de resaltado de búsqueda; hoy el acento neutro del tema.
          <mark key={i} className="rounded-sm bg-accent px-0.5 font-medium text-accent-foreground">
            {s.texto}
          </mark>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}
