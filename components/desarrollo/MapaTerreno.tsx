// Mapa esquemático del terreno de Juárez a partir de la poligonal del KMZ (metros locales): predio, huella del
// edificio, estacionamiento, boulevard y norte. Colores del tema.
import { ESTACIONAMIENTO_M, HUELLA_EDIFICIO_M, POLIGONAL_M } from "@/lib/fixtures/desarrollo/terreno";

const MARGEN = 10;
const ANCHO = Math.max(...POLIGONAL_M.map((p) => p[0]));
const ALTO = Math.max(...POLIGONAL_M.map((p) => p[1]));

// SVG con y hacia abajo: se invierte el eje norte.
const puntos = (pts: [number, number][]) => pts.map(([x, y]) => `${x + MARGEN},${ALTO - y + MARGEN}`).join(" ");

export function MapaTerreno({ superficie, className }: { superficie: number; className?: string }) {
  const w = ANCHO + MARGEN * 2;
  const h = ALTO + MARGEN * 2 + 12;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={`Terreno de ${superficie.toLocaleString("es-MX")} m² con frente al Blvd. Tomás Fernández; huella del edificio al norte y estacionamiento al frente`}>
      <rect x={0} y={ALTO + MARGEN + 2} width={w} height={10} fill="var(--muted)" />
      <text x={w / 2} y={ALTO + MARGEN + 9} textAnchor="middle" fontSize={3.6} fill="var(--muted-foreground)">
        Blvd. Tomás Fernández
      </text>
      <polygon points={puntos(POLIGONAL_M)} fill="var(--muted)" fillOpacity={0.5} stroke="var(--foreground)" strokeWidth={0.6} />
      <polygon points={puntos(ESTACIONAMIENTO_M)} fill="none" stroke="var(--muted-foreground)" strokeWidth={0.4} strokeDasharray="1.5 1" />
      <text x={MARGEN + 48} y={ALTO - 15 + MARGEN} textAnchor="middle" fontSize={3.2} fill="var(--muted-foreground)">
        Estacionamiento
      </text>
      <polygon points={puntos(HUELLA_EDIFICIO_M)} fill="var(--foreground)" fillOpacity={0.12} stroke="var(--foreground)" strokeWidth={0.8} />
      <text x={MARGEN + 40} y={ALTO - 40 + MARGEN + 1} textAnchor="middle" fontSize={3.4} fill="var(--foreground)">
        Edificio
      </text>
      <text x={MARGEN + ANCHO / 2} y={MARGEN - 2.5} textAnchor="middle" fontSize={3.2} fill="var(--muted-foreground)">
        95 m
      </text>
      <text x={MARGEN - 2.5} y={MARGEN + ALTO / 2} textAnchor="middle" fontSize={3.2} fill="var(--muted-foreground)" transform={`rotate(-90 ${MARGEN - 2.5} ${MARGEN + ALTO / 2})`}>
        58 m
      </text>
      <g transform={`translate(${w - 6} ${MARGEN + 4})`}>
        <path d="M0 -4 L2 2 L0 1 L-2 2 Z" fill="var(--foreground)" />
        <text y={7} textAnchor="middle" fontSize={3.4} fill="var(--foreground)">
          N
        </text>
      </g>
    </svg>
  );
}
