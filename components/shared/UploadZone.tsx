"use client";

import { ChevronDown, FileText, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Archivo de ejemplo servido desde public/fixtures.
export type UploadFixture = {
  id: string;
  name: string;
  src: string;
  size?: number;
  type?: string;
  // Datos que la simulación asocia a este archivo (p. ej. el XML parseado esperado).
  data?: unknown;
};

export type UploadValue = { kind: "file"; file: File } | { kind: "fixture"; fixture: UploadFixture };

type Props = {
  // Igual que el atributo accept de <input type="file">, p. ej. ".pdf,.xml,image/*".
  accept?: string;
  fixtures?: UploadFixture[];
  onFile: (value: UploadValue | null) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

export function UploadZone({
  accept,
  fixtures = [],
  onFile,
  label = "Arrastra un archivo aquí o selecciónalo",
  hint,
  disabled = false,
  className,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<{ name: string; size?: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function select(value: UploadValue) {
    setError(null);
    setCurrent(
      value.kind === "file"
        ? { name: value.file.name, size: value.file.size }
        : { name: value.fixture.name, size: value.fixture.size },
    );
    onFile(value);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!matchesAccept(file, accept)) {
      setError(`Formato no permitido. Usa ${describeAccept(accept)}.`);
      return;
    }
    select({ kind: "file", file });
  }

  function clear() {
    setCurrent(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFile(null);
  }

  if (current) {
    return (
      <div className={cn("flex items-center gap-3 border p-3", className)}>
        <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{current.name}</span>
          {current.size !== undefined && (
            <span className="text-xs text-muted-foreground">{formatBytes(current.size)}</span>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={clear} disabled={disabled} aria-label="Quitar archivo">
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        data-dragging={dragging || undefined}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/50 data-dragging:bg-muted focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Upload className="size-5 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium">{label}</span>
        {(hint || accept) && (
          <span className="text-xs text-muted-foreground">{hint ?? `Formatos: ${describeAccept(accept)}`}</span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {fixtures.length === 1 && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={disabled}
          onClick={() => select({ kind: "fixture", fixture: fixtures[0] })}
        >
          Usar archivo de ejemplo
        </Button>
      )}
      {fixtures.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="self-start" disabled={disabled} />}
          >
            Usar archivo de ejemplo
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fixtures.map((f) => (
              <DropdownMenuItem key={f.id} onClick={() => select({ kind: "fixture", fixture: f })}>
                {f.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function formatBytes(bytes: number) {
  const nf = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${nf.format(bytes / 1024)} KB`;
  return `${nf.format(bytes / (1024 * 1024))} MB`;
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
      return file.type === rule;
    });
}

function describeAccept(accept?: string) {
  if (!accept) return "cualquier archivo";
  return accept
    .split(",")
    .map((a) => a.trim())
    .map((a) => (a.startsWith(".") ? a.slice(1).toUpperCase() : a === "image/*" ? "imagen" : a))
    .join(", ");
}
