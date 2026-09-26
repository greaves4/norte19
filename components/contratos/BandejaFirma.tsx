"use client";

import { Signature } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { useActorContratos } from "@/components/contratos/useActorContratos";
import { DataGrid, dataGridColumns } from "@/components/shared/DataGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { abogadoPorId, contraparteDe, TIPOS_CONTRATO } from "@/lib/fixtures/contratos";
import { fechaHora } from "@/lib/format";
import { pasosPendientes } from "@/lib/sim/contratos/firma";
import { useContratos, useContratosHydrated } from "@/lib/store/contratos";
import { ESTATUS_SOLICITUD, NOMBRE_TIPO_CONTRATO, PASOS_FIRMA, type EstatusSolicitud, type Solicitud } from "@/lib/types/contratos";

const ESTATUS: EstatusSolicitud[] = ["aprobada", "en_firma", "formalizada"];
const ORDEN: Record<string, number> = { aprobada: 0, en_firma: 1, formalizada: 2 };

const col = dataGridColumns<Solicitud>();

function columnas(enviar: (s: Solicitud) => void) {
  return col.columns([
    col.accessor("folio", { header: "Folio", cell: (c) => <span className="font-mono text-xs whitespace-nowrap">{c.getValue()}</span>, meta: { hideOnMobile: true } }),
    col.accessor((s) => contraparteDe(s.campos), {
      id: "contraparte",
      header: "Contraparte",
      cell: (c) => (
        <span className="flex min-w-0 flex-col gap-1 md:min-w-40">
          <span className="line-clamp-2 whitespace-normal">{c.getValue()}</span>
          <span className="md:hidden">
            <StatusBadge status={c.row.original.estatus} map={ESTATUS_SOLICITUD} />
          </span>
        </span>
      ),
    }),
    col.accessor("tipoContrato", {
      header: "Tipo",
      filterFn: "equalsString",
      cell: (c) => NOMBRE_TIPO_CONTRATO[c.getValue()],
      meta: { hideBelow: "lg", filter: { type: "select", options: TIPOS_CONTRATO.map((t) => ({ value: t, label: NOMBRE_TIPO_CONTRATO[t] })) } },
    }),
    col.accessor((s) => abogadoPorId(s.abogadoId)?.nombre ?? "", { id: "abogado", header: "Abogado", meta: { hideBelow: "xl" } }),
    col.accessor("estatus", {
      header: "Estatus",
      filterFn: "equalsString",
      cell: (c) => <StatusBadge status={c.getValue()} map={ESTATUS_SOLICITUD} />,
      meta: {
        hideOnMobile: true,
        filter: { type: "select", options: ESTATUS.map((e) => ({ value: e, label: ESTATUS_SOLICITUD[e].label })) },
        exportValue: (v) => ESTATUS_SOLICITUD[v as EstatusSolicitud]?.label ?? String(v),
      },
    }),
    col.accessor((s) => PASOS_FIRMA.length - pasosPendientes(s).length, {
      id: "avance",
      header: "Avance",
      enableGlobalFilter: false,
      cell: (c) =>
        c.row.original.estatus === "aprobada" ? (
          <span className="text-muted-foreground">Sin enviar</span>
        ) : (
          <span className="tabular-nums">
            {c.getValue()} de {PASOS_FIRMA.length}
          </span>
        ),
      // En tablet el estatus basta; el avance ocupa el ancho del botón de acción.
      meta: { hideBelow: "xl" },
    }),
    col.accessor((s) => new Date(s.etapas.formalizada ?? s.etapas.en_firma ?? s.etapas.aprobada ?? s.creadaEn), {
      id: "fecha",
      header: "Último movimiento",
      sortFn: "datetime",
      enableGlobalFilter: false,
      cell: (c) => <span className="whitespace-nowrap">{fechaHora(c.getValue())}</span>,
      meta: { hideBelow: "xl" },
    }),
    col.display({
      id: "accion",
      header: "",
      enableSorting: false,
      cell: (c) =>
        c.row.original.estatus === "aprobada" ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              enviar(c.row.original);
            }}
          >
            <Signature data-icon="inline-start" className="hidden xl:block" />
            Enviar a firma
          </Button>
        ) : null,
      meta: { align: "end" },
    }),
  ]);
}

export function BandejaFirma() {
  const router = useRouter();
  const hidratado = useContratosHydrated();
  const { actor } = useActorContratos();
  const todas = useContratos((s) => s.solicitudes);
  const enviarAFirma = useContratos((s) => s.enviarAFirma);
  // Primero lo que requiere acción (por enviar), luego en firma y al final formalizadas recientes.
  const filas = useMemo(
    () =>
      todas
        .filter((s) => ESTATUS.includes(s.estatus))
        .sort((a, b) => ORDEN[a.estatus] - ORDEN[b.estatus] || (b.etapas.formalizada ?? b.creadaEn).localeCompare(a.etapas.formalizada ?? a.creadaEn)),
    [todas],
  );
  const cols = useMemo(
    () =>
      columnas((s) => {
        if (enviarAFirma(s.id, actor)) {
          toast.success(`${s.folio} enviada a firma electrónica`);
          router.push(`/contratos/firma/${s.id}`);
        }
      }),
    [enviarAFirma, actor, router],
  );

  return (
    <div className="flex min-w-0 flex-col gap-5 p-4 md:p-6">
      <PageHeader title="Firma electrónica" description="Solicitudes aprobadas por enviar, firmas en curso y contratos formalizados." />
      <DataGrid
        columns={cols}
        data={filas}
        loading={!hidratado}
        getRowId={(s) => s.id}
        onRowClick={(s) => router.push(`/contratos/firma/${s.id}`)}
        searchPlaceholder="Buscar por folio o contraparte"
        exportFileName="firma-electronica"
        emptyTitle="Nada en firma"
        emptyDescription="Las solicitudes aprobadas por el directivo aparecen aquí."
      />
    </div>
  );
}
