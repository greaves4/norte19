import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

// Módulos del proyecto que llegan en las siguientes iteraciones (D3–D6).
export function EnConstruccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={titulo} description={descripcion} />
      <EmptyState icon={Construction} title="Vista en construcción" description="Esta pantalla se agrega en la siguiente iteración del prototipo." />
    </div>
  );
}
