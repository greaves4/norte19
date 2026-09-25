"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Fuentes } from "@/components/desarrollo/Fuentes";
import { IndicadorSemaforo } from "@/components/desarrollo/IndicadorSemaforo";
import { puedeVerDesarrollo } from "@/components/desarrollo/DesarrolloShell";
import { useActorDesarrollo } from "@/components/desarrollo/useActorDesarrollo";
import { GateBanner } from "@/components/shared/GateBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularCapex, INFLACION_CONSTRUCCION, TIPO_CAMBIO } from "@/lib/sim/desarrollo/capex";
import { useDesarrollo } from "@/lib/store/desarrollo";
import { NOMBRE_ZONA } from "@/lib/types/desarrollo";

const usd = (v: number) => v.toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdM = (v: number) => `${(v / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} M USD`;
const n = (v: number, dec = 0) => v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function CapexTab({ bloqueado }: { bloqueado: boolean }) {
  const p = useDesarrollo((s) => s.proyecto);
  const setFactor = useDesarrollo((s) => s.setFactorActualizacion);
  const { perfil } = useActorDesarrollo();
  const conObjetivo = !!p.inputs.find((i) => i.id === "capex_objetivo")?.archivo;
  const c = calcularCapex(p.definicion.cuadroAreas, p.llaves, p.factorActualizacion, conObjetivo);
  const [factor, setFactorTexto] = useState(String(p.factorActualizacion));

  return (
    <div className="flex flex-col gap-5">
      {!c.objetivo && (
        <GateBanner
          variant="advertencia"
          title="CAPEX en ámbar: falta el CAPEX objetivo"
          description="Supuesto documentado: la estimación no se compara contra un objetivo aprobado por el comité de inversión."
          action={
            puedeVerDesarrollo(perfil, "/desarrollo/proyectos/juarez/inputs") ? (
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/desarrollo/proyectos/juarez/inputs" />}>
                Cargar en Inputs
              </Button>
            ) : undefined
          }
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Por llave (rango ±10%)</span>
            <span className="text-xl font-semibold tabular-nums">
              {usd(c.rangoPorLlave[0])} a {usd(c.rangoPorLlave[1])}
            </span>
            <span className="text-xs text-muted-foreground">Punto medio {usd(c.porLlaveUsd)}</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Total ({p.llaves} llaves)</span>
            <span className="text-xl font-semibold tabular-nums">
              {usdM(c.rangoTotal[0])} a {usdM(c.rangoTotal[1])}
            </span>
            <span className="text-xs text-muted-foreground">Sin terreno</span>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Contra el objetivo</span>
            {c.objetivo ? (
              <>
                <span className="text-xl font-semibold tabular-nums">
                  {c.objetivo.desviacion > 0 ? "+" : ""}
                  {n(c.objetivo.desviacion * 100, 1)}%
                </span>
                <span className="text-xs text-muted-foreground">Objetivo {usd(c.objetivo.usdPorLlave)} por llave</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Sin objetivo cargado</span>
            )}
            <span>
              <IndicadorSemaforo valor={c.semaforo} />
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desglose por disciplina</CardTitle>
          <CardDescription>Costo directo por m² construido, derivado de los catálogos históricos del corpus y actualizado.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">Concepto</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">MXN por m²</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">USD</th>
                  <th scope="col" className="py-2 pl-2 font-medium">Base</th>
                </tr>
              </thead>
              <tbody>
                {c.porDisciplina.map((d) => (
                  <tr key={d.catalogo} className="border-b align-top">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      {d.nombre}
                      <Fuentes fuentes={d.fuentes} max={2} className="mt-1" />
                    </th>
                    <td className="px-2 py-2 text-right tabular-nums">{n(d.mxnPorM2)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{usd(d.usd)}</td>
                    <td className="py-2 pl-2 text-xs text-muted-foreground">Catálogos de {d.hoteles} hoteles</td>
                  </tr>
                ))}
                <tr className="border-b align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">Estacionamiento exterior</th>
                  <td className="px-2 py-2 text-right tabular-nums">{n(c.porZona.find((z) => z.zona === "estacionamiento")!.mxnPorM2)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{usd(c.porZona.find((z) => z.zona === "estacionamiento")!.usd)}</td>
                  <td className="py-2 pl-2 text-xs text-muted-foreground">Pavimento, guarniciones y alumbrado</td>
                </tr>
                <tr className="border-b font-medium">
                  <th scope="row" className="py-2 pr-3 text-left">Costo directo</th>
                  <td />
                  <td className="px-2 py-2 text-right tabular-nums">{usd(c.directoUsd)}</td>
                  <td />
                </tr>
                {c.supuestos.map((s) => (
                  <tr key={s.id} className="border-b">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">{s.concepto}</th>
                    <td className="px-2 py-2 text-right text-muted-foreground tabular-nums">{n(s.pct * 100)}% del directo</td>
                    <td className="px-2 py-2 text-right tabular-nums">{usd(s.usd)}</td>
                    <td className="py-2 pl-2 text-xs text-muted-foreground">Supuesto paramétrico: sin catálogo en el corpus</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <th scope="row" className="py-2 pr-3 text-left">Total</th>
                  <td />
                  <td className="px-2 py-2 text-right tabular-nums">{usd(c.totalUsd)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Desglose por zona del cuadro de áreas</summary>
            <table className="mt-2 w-full">
              <tbody>
                {c.porZona.map((z) => (
                  <tr key={z.zona} className="border-b last:border-0">
                    <td className="py-1.5">{NOMBRE_ZONA[z.zona]}</td>
                    <td className="py-1.5 text-right tabular-nums">{n(z.m2)} m²</td>
                    <td className="py-1.5 text-right tabular-nums">{n(z.mxnPorM2)} MXN/m²</td>
                    <td className="py-1.5 text-right tabular-nums">{usd(z.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            Precios de origen de {c.preciosDesde} a {c.preciosHasta}, llevados a 2022 con {n(INFLACION_CONSTRUCCION * 100, 1)}% anual de inflación de construcción y actualizados con un factor de{" "}
            {n(c.factor, 2)}. Tipo de cambio de {n(TIPO_CAMBIO, 2)} MXN por USD.
          </p>
          {perfil === "direccion" && !bloqueado && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const f = Number(factor);
                if (!(f >= 0.8 && f <= 2)) {
                  toast.error("Usa un factor entre 0.80 y 2.00");
                  return;
                }
                setFactor(f);
                toast.success(`Factor de actualización: ${n(f, 2)}`, { description: "El CAPEX se recalculó." });
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="factor">Factor de actualización</Label>
                <Input id="factor" inputMode="decimal" value={factor} onChange={(e) => setFactorTexto(e.target.value)} className="w-28" />
              </div>
              <Button type="submit" variant="outline">
                Aplicar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
