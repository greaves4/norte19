type Props = {
  title: string;
  description?: React.ReactNode;
  // Botones u otras acciones alineadas a la derecha.
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
  return (
    // Las acciones bajan a su propia línea si no caben junto a un título de al menos 20rem.
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-[min(100%,20rem)] flex-1 flex-col gap-1">
        <h1 className="text-xl font-light tracking-[0.125em] uppercase">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
