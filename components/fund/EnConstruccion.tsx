import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

// Vistas de Fund que llegan en las siguientes iteraciones (F4–F6).
export function EnConstruccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title={titulo} description={descripcion} />
      <EmptyState icon={Construction} title="Vista en construcción" description="Esta pantalla se agrega en la siguiente iteración del prototipo." />
    </div>
  );
}
