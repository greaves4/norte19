import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

// Placeholder: el prototipo se construye a partir del prompt D1.
export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader title="Desarrollo hotelero" description="Proyecto ejecutivo y auditoría" />
      <EmptyState
        icon={Construction}
        title="Prototipo en construcción"
        description="Las pantallas de este prototipo se agregan en los siguientes prompts."
      />
    </div>
  );
}
