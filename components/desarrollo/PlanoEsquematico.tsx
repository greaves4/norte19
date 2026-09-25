"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Hallazgo } from "@/lib/types/desarrollo";

export const EJES_X = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const EJES_Y = Array.from({ length: 12 }, (_, i) => i + 1);

// Retícula: ejes con letra en horizontal (A–H) y con número en vertical (1–12).
const PASO = 44;
const MARGEN = 30;
const ANCHO = MARGEN * 2 + PASO * (EJES_X.length - 1);
const ALTO = MARGEN * 2 + PASO * (EJES_Y.length - 1);
const px = (x: string) => MARGEN + EJES_X.indexOf(x) * PASO;
const py = (y: number) => MARGEN + (y - 1) * PASO;

// Contorno esquemático: el nivel 1 ocupa A–H (lobby y servicios); la torre de habitaciones, C–H.
function contorno(nivel: number) {
  const x0 = px(nivel === 1 ? "A" : "C") - 10;
  const x1 = px("H") + 10;
  const y0 = py(1) - 10;
  const y1 = py(12) + 10;
  return `M${x0},${y0} H${x1} V${y1} H${x0} Z`;
}

// Marcador: crítico relleno, medio con contorno grueso, menor pequeño; la severidad también va en el texto del tooltip.
const RADIO = { critico: 9, medio: 8, menor: 6 } as const;
const SEVERIDAD = { critico: "Crítico", medio: "Medio", menor: "Menor" } as const;

type Props = {
  hallazgos: Hallazgo[];
  nivel: number;
  seleccionado?: string | null;
  onSeleccionar?: (id: string) => void;
  className?: string;
};

export function PlanoEsquematico({ hallazgos, nivel, seleccionado, onSeleccionar, className }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const conEje = hallazgos.filter((h) => h.eje && h.nivel === nivel);
  const activo = conEje.find((h) => h.id === (hover ?? seleccionado));

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-auto w-full max-w-md" role="img" aria-label={`Planta esquemática del nivel ${nivel} con ${conEje.length} hallazgos`}>
        {/* Retícula de ejes */}
        <g className="stroke-border" strokeWidth={1} strokeDasharray="4 4">
          {EJES_X.map((x) => (
            <line key={x} x1={px(x)} x2={px(x)} y1={MARGEN - 16} y2={ALTO - MARGEN + 16} />
          ))}
          {EJES_Y.map((y) => (
            <line key={y} y1={py(y)} y2={py(y)} x1={MARGEN - 16} x2={ANCHO - MARGEN + 16} />
          ))}
        </g>
        <g className="fill-muted-foreground" fontSize={10} textAnchor="middle">
          {EJES_X.map((x) => (
            <text key={x} x={px(x)} y={11}>
              {x}
            </text>
          ))}
          {EJES_Y.map((y) => (
            <text key={y} x={9} y={py(y) + 3.5}>
              {y}
            </text>
          ))}
        </g>
        <path d={contorno(nivel)} className="fill-muted/40 stroke-foreground" strokeWidth={2} />
        {nivel > 1 && <rect x={px("F") - 14} y={py(10) - 14} width={PASO + 28} height={PASO + 28} className="fill-muted stroke-muted-foreground" strokeWidth={1} aria-hidden />}

        {conEje.map((h) => {
          const cx = px(h.eje!.x);
          const cy = py(h.eje!.y);
          const sel = h.id === seleccionado || h.id === hover;
          return (
            <g
              key={h.id}
              role="button"
              tabIndex={0}
              aria-label={`${h.id}, ${SEVERIDAD[h.severidad]}, eje ${h.eje!.x}-${h.eje!.y}: ${h.descripcion}`}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHover(h.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(h.id)}
              onBlur={() => setHover(null)}
              onClick={() => onSeleccionar?.(h.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSeleccionar?.(h.id);
                }
              }}
              data-hallazgo={h.id}
              opacity={h.estatus === "descartado" ? 0.35 : 1}
            >
              {/* Área de contacto mayor que la marca */}
              <circle cx={cx} cy={cy} r={16} className="fill-transparent" />
              {sel && <circle cx={cx} cy={cy} r={RADIO[h.severidad] + 5} className="fill-none stroke-foreground" strokeWidth={1.5} />}
              <circle
                cx={cx}
                cy={cy}
                r={RADIO[h.severidad]}
                className={cn(h.severidad === "critico" ? "fill-destructive stroke-background" : h.severidad === "medio" ? "fill-background stroke-foreground" : "fill-foreground stroke-background")}
                strokeWidth={h.severidad === "medio" ? 3 : 2}
              />
              <text x={cx + 12} y={cy - 8} fontSize={10} fontWeight={600} className="fill-foreground">
                {h.id}
              </text>
            </g>
          );
        })}
      </svg>
      {activo && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 w-60 border bg-popover p-2 text-xs text-popover-foreground shadow-md"
          style={{ left: `min(calc(${(px(activo.eje!.x) / ANCHO) * 100}% + 12px), calc(100% - 15rem))`, top: `calc(${(py(activo.eje!.y) / ALTO) * 100}% + 14px)` }}
        >
          <span className="font-semibold">
            {activo.id} · {SEVERIDAD[activo.severidad]} · eje {activo.eje!.x}-{activo.eje!.y}
          </span>
          <span className="mt-1 block">{activo.descripcion}</span>
          <span className="mt-1 block text-muted-foreground">{activo.disciplina}</span>
        </div>
      )}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Simbología">
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
            <circle cx={10} cy={10} r={8} className="fill-destructive" />
          </svg>
          Crítico
        </li>
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
            <circle cx={10} cy={10} r={7} className="fill-background stroke-foreground" strokeWidth={3} />
          </svg>
          Medio
        </li>
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
            <circle cx={10} cy={10} r={6} className="fill-foreground" />
          </svg>
          Menor
        </li>
        {nivel > 1 && <li>Recuadro gris: núcleo de circulación vertical</li>}
      </ul>
    </div>
  );
}
