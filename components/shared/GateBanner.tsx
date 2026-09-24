import { CircleCheck, Lock, TriangleAlert } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type GateVariant = "bloqueado" | "advertencia" | "aprobado";

const ICON = { bloqueado: Lock, advertencia: TriangleAlert, aprobado: CircleCheck } as const;

type Props = {
  variant: GateVariant;
  title: string;
  description?: React.ReactNode;
  // Lista de faltantes o pendientes.
  items?: React.ReactNode[];
  action?: React.ReactNode;
  className?: string;
};

// TODO tokens: tonos de advertencia y aprobado; hoy solo "bloqueado" usa la variante destructive.
export function GateBanner({ variant, title, description, items = [], action, className }: Props) {
  const Icon = ICON[variant];
  return (
    <Alert
      variant={variant === "bloqueado" ? "destructive" : "default"}
      data-variant={variant}
      className={className}
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      {(description || items.length > 0) && (
        <AlertDescription>
          {description && <p>{description}</p>}
          {items.length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </AlertDescription>
      )}
      {action && <AlertAction>{action}</AlertAction>}
    </Alert>
  );
}
