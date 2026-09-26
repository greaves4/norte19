"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Dato = { etiqueta: string; valor: number };

type Props = {
  datos: Dato[];
  formato: (valor: number) => string;
  // Marcas del eje; por defecto el mismo formato. Para moneda conviene sin centavos.
  formatoEje?: (valor: number) => string;
  // Nombre de la medida para el tooltip, p. ej. "Promedio".
  medida: string;
  ariaLabel: string;
  anchoEtiquetas?: number;
};

// Barras horizontales de una sola serie: un color, valor en la punta, tooltip por barra.
// Serie en --chart-2 = color-green, el verde de marca.
export function GraficaBarras({ datos, formato, formatoEje = formato, medida, ariaLabel, anchoEtiquetas = 200 }: Props) {
  const alto = Math.max(datos.length * 32 + 40, 160);
  return (
    <div role="img" aria-label={ariaLabel} style={{ height: alto }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 88, bottom: 4, left: 4 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis
            type="number"
            tickFormatter={formatoEje}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="etiqueta"
            width={anchoEtiquetas}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              const d = active ? (payload?.[0]?.payload as Dato | undefined) : undefined;
              if (!d) return null;
              return (
                <div className="border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
                  <p className="font-medium">{d.etiqueta}</p>
                  <p className="text-muted-foreground">
                    {medida}: <span className="text-foreground tabular-nums">{formato(d.valor)}</span>
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="valor" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
            <LabelList dataKey="valor" position="right" formatter={(v) => formato(Number(v))} fill="var(--muted-foreground)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
