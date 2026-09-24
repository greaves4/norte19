import { ShieldCheck } from "lucide-react";
import { fechaHora } from "@/lib/format";
import type { Contrato } from "@/lib/types/contratos";

// Franja de "sello" simulado del documento firmado: folio, hash ficticio y fecha.
export function SelloFirma({ contrato }: { contrato: Pick<Contrato, "folio" | "sello"> }) {
  if (!contrato.sello) return null;
  return (
    <div className="flex items-start gap-3 border border-dashed px-3 py-2.5 text-sm" role="group" aria-label="Sello de firma electrónica">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <dl className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-1.5">
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Folio</dt>
          <dd className="font-mono">{contrato.folio}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">Firmado</dt>
          <dd>{fechaHora(contrato.sello.fecha)}</dd>
        </div>
        <div className="flex min-w-0 basis-full flex-col lg:basis-auto lg:flex-1">
          <dt className="text-xs text-muted-foreground">Huella SHA-256 (simulada)</dt>
          <dd className="font-mono text-xs break-all">{contrato.sello.hash}</dd>
        </div>
      </dl>
    </div>
  );
}
