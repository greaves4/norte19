import type { Segmento } from "@/lib/texto";

// Texto con los segmentos coincidentes de una búsqueda resaltados.
export function Resaltado({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.resaltado ? (
          // Resaltado con color-green-extralight (accent) y texto color-green.
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
