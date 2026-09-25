"use client";

import { useMemo } from "react";
import { GraficaBarras } from "@/components/shared/GraficaBarras";
import { Indicador } from "@/components/shared/Indicador";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNow } from "@/lib/demo";
import { cargaAbogados, indicadoresContratos, volumenPorTipo } from "@/lib/sim/contratos/dashboard";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";

const dias = (n: number) => `${n.toLocaleString("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: n > 0 && n < 10 ? 1 : 0 })} d`;
const entero = (n: number) => n.toLocaleString("es-MX");

export function DashboardContratos() {
  const hidratado = useContratosHydrated();
  const solicitudes = useContratos((s) => s.solicitudes);
  const contratos = useContratos((s) => s.contratos);
  const now = useNow(60_000);
  const minuto = Math.floor(now.getTime() / 60_000);

  // Se recalcula por minuto del reloj de demo: lo que pase en la sesión (o el "+24 h") se refleja aquí.
  const datos = useMemo(() => {
    const ahora = new Date(minuto * 60_000);
    return { k: indicadoresContratos(solicitudes, contratos, ahora), tipos: volumenPorTipo(solicitudes), carga: cargaAbogados(solicitudes) };
  }, [solicitudes, contratos, minuto]);
  const { k } = datos;
  const cuello = [...k.etapas].sort((a, b) => b.valor - a.valor)[0];

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Dashboard" description="Se calcula con los datos de la demo: lo que se crea, aprueba o firma en la sesión aparece aquí." />
      {!hidratado ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <li>
            <Indicador etiqueta="Solicitudes del mes" valor={entero(k.delMes)} nota={now.toLocaleDateString("es-MX", { month: "long", year: "numeric" })} />
          </li>
          <li>
            <Indicador etiqueta="En proceso" valor={entero(k.enProceso)} nota="Sin formalizar" />
          </li>
          <li>
            <Indicador
              etiqueta="Cumplimiento de SLA"
              valor={k.sla.porcentaje === null ? "—" : `${Math.round(k.sla.porcentaje)}%`}
              nota={`${k.sla.cumplidas} de ${k.sla.evaluadas} dentro del SLA de análisis`}
            />
          </li>
          <li>
            <Indicador etiqueta="Tiempo promedio por etapa" valor={dias(k.promedioEtapa)} nota="Días hábiles" />
          </li>
          <li>
            <Indicador etiqueta="Por vencer en 90 días" valor={entero(k.porVencer)} nota="Contratos del repositorio" />
          </li>
        </ul>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
        <Grafica
          titulo="Cuellos de botella"
          descripcion={cuello && cuello.valor > 0 ? `Tiempo promedio en cada columna del Kanban. La más lenta: ${cuello.etiqueta} (${dias(cuello.valor)}).` : "Tiempo promedio en cada columna del Kanban."}
          datos={k.etapas}
          formato={dias}
          medida="Promedio en días hábiles"
          columnaEtiqueta="Columna"
          columnaValor="Días hábiles"
          cargando={!hidratado}
        />
        <Grafica titulo="Carga por abogado" descripcion="Solicitudes activas (nuevas, en análisis y en ajustes)." datos={datos.carga} formato={entero} medida="Activas" columnaEtiqueta="Abogado" columnaValor="Activas" cargando={!hidratado} />
        <Grafica titulo="Volumen por tipo de contrato" descripcion="Todas las solicitudes, en cualquier estatus." datos={datos.tipos} formato={entero} medida="Solicitudes" columnaEtiqueta="Tipo" columnaValor="Solicitudes" cargando={!hidratado} />
      </div>
    </div>
  );
}

function Grafica({
  titulo,
  descripcion,
  datos,
  formato,
  medida,
  columnaEtiqueta,
  columnaValor,
  cargando,
}: {
  titulo: string;
  descripcion: string;
  datos: { etiqueta: string; valor: number }[];
  formato: (n: number) => string;
  medida: string;
  columnaEtiqueta: string;
  columnaValor: string;
  cargando: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {cargando ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <GraficaBarras datos={datos} formato={formato} medida={medida} ariaLabel={`${titulo}: ${datos.map((d) => `${d.etiqueta} ${formato(d.valor)}`).join(", ")}`} anchoEtiquetas={150} />
        )}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Ver tabla</summary>
          <table className="mt-2 w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-1.5 font-medium">{columnaEtiqueta}</th>
                <th className="py-1.5 text-right font-medium">{columnaValor}</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.etiqueta} className="border-b last:border-0">
                  <td className="py-1.5">{d.etiqueta}</td>
                  <td className="py-1.5 text-right tabular-nums">{formato(d.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </CardContent>
    </Card>
  );
}
