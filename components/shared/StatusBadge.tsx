import { Badge } from "@/components/ui/badge";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";
export type StatusMap<S extends string> = Record<S, { label: string; tone: StatusTone }>;

// TODO tokens: tonos success, warning e info propios; mientras tanto se usan las variantes de Badge.
const VARIANT: Record<StatusTone, "outline" | "secondary" | "default" | "destructive"> = {
  neutral: "outline",
  info: "secondary",
  success: "default",
  warning: "secondary",
  danger: "destructive",
};

type Props<S extends string> = {
  status: S;
  map: StatusMap<S>;
  className?: string;
};

export function StatusBadge<S extends string>({ status, map, className }: Props<S>) {
  const entry = map[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge variant={VARIANT[entry.tone]} data-tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}
