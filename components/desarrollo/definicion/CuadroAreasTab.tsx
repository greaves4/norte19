"use client";

import { PencilLine, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Fuentes } from "@/components/desarrollo/Fuentes";
import { IndicadorSemaforo } from "@/components/desarrollo/IndicadorSemaforo";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compararCuadro, UMBRAL_AMBAR, UMBRAL_VERDE, type FilaBenchmark } from "@/lib/sim/desarrollo/benchmark";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { NOMBRE_ZONA } from "@/lib/types/desarrollo";

const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const pct = (v: number) => `${v > 0 ? "+" : ""}${n(v * 100, 1)}%`;

export function CuadroAreasTab({ bloqueado }: { bloqueado: boolean }) {
  const p = useDesarrollo((s) => s.proyecto);
  const filas = compararCuadro(p.definicion.cuadroAreas, p.llaves);
  const mayor = [...filas].sort((a, b) => Math.abs(b.desviacion) - Math.abs(a.desviacion))[0];
  const construidos = filas.filter((f) => f.zona !== "estacionamiento").reduce((t, f) => t + f.m2, 0);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Cuadro de áreas contra el benchmark</CardTitle>
          <CardDescription>
            m² por llave de Juárez contra el promedio y el rango de los 5 hoteles del corpus. Semáforo: hasta ±{n(UMBRAL_VERDE * 100)}% verde, hasta ±{n(UMBRAL_AMBAR * 100)}% ámbar, más: rojo. La
            mayor desviación es {NOMBRE_ZONA[mayor.zona]} ({pct(mayor.desviacion)}).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Cuadro de áreas de Juárez con benchmark del corpus</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">Zona</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">m²</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">m²/llave</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">% construido</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Benchmark (rango)</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Desviación</th>
                  <th scope="col" className="px-2 py-2 font-medium">Semáforo</th>
                  <th scope="col" className="py-2 pl-2 font-medium"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <FilaCuadro key={f.zona} f={f} bloqueado={bloqueado} />
                ))}
                <tr className="font-medium">
                  <td className="py-2 pr-3">Total construido</td>
                  <td className="px-2 py-2 text-right tabular-nums">{n(construidos)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{n(construidos / p.llaves, 1)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">100%</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
          <Fuentes fuentes={[...filas[0].fuentes, ...filas[0].fuentesBenchmark]} max={3} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>m² por llave: Juárez contra el promedio del corpus</CardTitle>
        </CardHeader>
        <CardContent>
          <GraficaComparativa filas={filas} />
        </CardContent>
      </Card>
    </div>
  );
}

function FilaCuadro({ f, bloqueado }: { f: FilaBenchmark; bloqueado: boolean }) {
  const ajustar = useDesarrollo((s) => s.ajustarCuadroAreas);
  const { actor } = useActorDesarrollo();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(f.m2));
  const id = `ajuste-${f.zona}`;

  function guardar() {
    const m2 = Number(valor.replace(/[,\s]/g, ""));
    if (!(m2 > 0)) {
      toast.error("Escribe una superficie mayor a cero");
      return;
    }
    if (m2 > f.m2Original * 5 || m2 < f.m2Original / 5) {
      toast.error("Revisa la superficie", { description: `Está muy lejos de los ${n(f.m2Original)} m² del anteproyecto.` });
      return;
    }
    ajustar(f.zona, m2, actor);
    setEditando(false);
    toast.success(`${NOMBRE_ZONA[f.zona]}: ${n(m2)} m²`, { description: "La desviación y el CAPEX se recalcularon." });
  }

  return (
    <tr className="border-b align-middle">
      <th scope="row" className="py-2 pr-3 text-left font-normal">
        {NOMBRE_ZONA[f.zona]}
        {f.m2 !== f.m2Original && <span className="block text-xs text-muted-foreground">Anteproyecto: {n(f.m2Original)} m²</span>}
      </th>
      <td className="px-2 py-2 text-right tabular-nums">
        {editando ? (
          <form
            className="flex items-center justify-end gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              guardar();
            }}
          >
            <Label htmlFor={id} className="sr-only">
              m² de {NOMBRE_ZONA[f.zona]}
            </Label>
            <Input id={id} autoFocus inputMode="numeric" value={valor} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setValor(e.target.value)} className="h-8 w-24 text-right" />
            <Button type="submit" size="sm">
              Guardar
            </Button>
          </form>
        ) : (
          n(f.m2)
        )}
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{n(f.m2PorLlave, 1)}</td>
      <td className="px-2 py-2 text-right tabular-nums">{f.porcentaje === null ? "—" : `${n(f.porcentaje * 100, 1)}%`}</td>
      <td className="px-2 py-2 text-right tabular-nums">
        {n(f.promedio, 1)} <span className="text-muted-foreground">({n(f.minimo, 1)}–{n(f.maximo, 1)})</span>
      </td>
      <td className="px-2 py-2 text-right font-medium tabular-nums">{pct(f.desviacion)}</td>
      <td className="px-2 py-2">
        <IndicadorSemaforo valor={f.semaforo} />
      </td>
      <td className="py-2 pl-2 text-right whitespace-nowrap">
        {!bloqueado &&
          (editando ? (
            <Button variant="ghost" size="sm" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setValor(String(f.m2));
                  setEditando(true);
                }}
                aria-label={`Ajustar ${NOMBRE_ZONA[f.zona]}`}
                title="Ajustar"
              >
                <PencilLine />
              </Button>
              {f.m2 !== f.m2Original && (
                <Button variant="ghost" size="icon-sm" onClick={() => ajustar(f.zona, f.m2Original, actor)} aria-label={`Restaurar ${NOMBRE_ZONA[f.zona]} al anteproyecto`}>
                  <RotateCcw />
                </Button>
              )}
            </>
          ))}
      </td>
    </tr>
  );
}

// Barras horizontales agrupadas: Juárez y promedio del corpus por zona (dos series con leyenda y tooltip).
// Un solo verde de marca en dos intensidades: Juárez --chart-2 (color-green), corpus --chart-1 (color-green-light).
// El claro no llega a 3:1 sobre blanco; la leyenda, el tooltip y "Ver tabla" cubren la lectura.
function GraficaComparativa({ filas }: { filas: FilaBenchmark[] }) {
  const datos = filas.map((f) => ({ zona: NOMBRE_ZONA[f.zona], juarez: Number(f.m2PorLlave.toFixed(1)), corpus: Number(f.promedio.toFixed(1)) }));
  return (
    <div role="img" aria-label={`m² por llave, Juárez contra promedio del corpus: ${datos.map((d) => `${d.zona} ${d.juarez} contra ${d.corpus}`).join("; ")}`} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }} barCategoryGap={10} barGap={2}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="zona" width={120} tick={{ fill: "var(--foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
                  <p className="font-medium">{label}</p>
                  {payload.map((x) => (
                    <p key={String(x.dataKey)} className="text-muted-foreground">
                      {x.name}: <span className="text-foreground tabular-nums">{n(Number(x.value), 1)} m²</span>
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={(valor) => <span style={{ color: "var(--foreground)" }}>{valor}</span>} />
          <Bar dataKey="juarez" name="Juárez" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
          <Bar dataKey="corpus" name="Promedio del corpus" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
