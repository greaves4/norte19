"use client";

import { Check, Circle, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { isDemo } from "@/lib/demo";
import { cn } from "@/lib/utils";

export type RunnerStep = {
  id: string;
  label: string;
  durationMs: number;
  // Líneas de log que se escriben al terminar el paso.
  log?: string[];
};

export type RunnerStatus = "idle" | "running" | "done";

export type ProgressRunnerHandle = {
  start: () => void;
  reset: () => void;
  status: RunnerStatus;
};

type Props = {
  steps: RunnerStep[];
  onDone?: () => void;
  onStatusChange?: (status: RunnerStatus) => void;
  autoStart?: boolean;
  title?: string;
  ref?: React.Ref<ProgressRunnerHandle>;
  className?: string;
};

type LogLine = { t: number; text: string };

const TICK_MS = 100;

export function ProgressRunner({ steps, onDone, onStatusChange, autoStart = false, title, ref, className }: Props) {
  const [status, setStatus] = useState<RunnerStatus>("idle");
  const [index, setIndex] = useState(0); // paso en curso
  const [stepElapsed, setStepElapsed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const logRef = useRef<HTMLOListElement>(null);

  const callbacks = useRef({ onDone, onStatusChange });
  callbacks.current = { onDone, onStatusChange };

  const total = steps.reduce((sum, s) => sum + s.durationMs, 0);
  const completedMs = steps.slice(0, index).reduce((sum, s) => sum + s.durationMs, 0);
  const percent =
    status === "done" ? 100 : total ? Math.min(((completedMs + stepElapsed) / total) * 100, 100) : 0;

  const changeStatus = useCallback((next: RunnerStatus) => {
    setStatus(next);
    callbacks.current.onStatusChange?.(next);
    if (next === "done") callbacks.current.onDone?.();
  }, []);

  const start = useCallback(() => {
    if (steps.length === 0) return;
    setIndex(0);
    setStepElapsed(0);
    setElapsed(0);
    setLog([{ t: 0, text: `Inicio: ${steps[0].label}` }]);
    changeStatus("running");
  }, [steps, changeStatus]);

  const reset = useCallback(() => {
    setIndex(0);
    setStepElapsed(0);
    setElapsed(0);
    setLog([]);
    changeStatus("idle");
  }, [changeStatus]);

  // Completa todos los pasos al instante (solo demo).
  const skip = useCallback(() => {
    setLog((prev) => [
      ...prev,
      ...steps.slice(index).flatMap((s) => (s.log ?? []).map((text) => ({ t: elapsed, text }))),
      { t: elapsed, text: "Proceso saltado en modo demo" },
    ]);
    setIndex(steps.length);
    changeStatus("done");
  }, [steps, index, elapsed, changeStatus]);

  useImperativeHandle(ref, () => ({ start, reset, status }), [start, reset, status]);

  // Arranque automático una sola vez (StrictMode monta dos veces en desarrollo).
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStarted.current) {
      autoStarted.current = true;
      start();
    }
  }, [autoStart, start]);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      setElapsed((e) => e + TICK_MS);
      setStepElapsed((e) => e + TICK_MS);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status]);

  // Avanza de paso cuando el actual cumple su duración.
  useEffect(() => {
    if (status !== "running") return;
    const step = steps[index];
    if (!step || stepElapsed < step.durationMs) return;

    const next = steps[index + 1];
    setLog((prev) => [
      ...prev,
      ...(step.log ?? []).map((text) => ({ t: elapsed, text })),
      { t: elapsed, text: `Listo: ${step.label} (${formatSeconds(step.durationMs)})` },
      ...(next ? [{ t: elapsed, text: `Inicio: ${next.label}` }] : []),
    ]);
    setStepElapsed(0);
    setIndex(index + 1);
    if (!next) changeStatus("done");
  }, [status, steps, index, stepElapsed, elapsed, changeStatus]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  return (
    <div className={cn("flex flex-col gap-4 border p-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {title && <span className="font-medium">{title}</span>}
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {formatSeconds(elapsed)} / {formatSeconds(total)}
        </span>
        {status === "idle" && (
          <Button size="sm" onClick={start}>
            Iniciar
          </Button>
        )}
        {status === "running" && isDemo && (
          <Button size="sm" variant="outline" onClick={skip}>
            Saltar
          </Button>
        )}
      </div>

      <Progress value={percent} aria-label={title ?? "Progreso"} />

      <ol className="flex flex-col gap-1.5">
        {steps.map((s, i) => {
          const state = status === "done" || i < index ? "done" : status === "running" && i === index ? "running" : "pending";
          return (
            <li key={s.id} className="flex items-center gap-2 text-sm" data-state={state}>
              {state === "done" ? (
                <Check className="size-4 shrink-0" aria-hidden />
              ) : state === "running" ? (
                <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={cn("flex-1", state === "pending" && "text-muted-foreground")}>{s.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {state === "running" ? `${Math.round((stepElapsed / s.durationMs) * 100)}%` : formatSeconds(s.durationMs)}
              </span>
            </li>
          );
        })}
      </ol>

      {log.length > 0 && (
        <ol
          ref={logRef}
          aria-live="polite"
          className="max-h-40 overflow-y-auto bg-muted p-2 font-mono text-xs leading-relaxed"
        >
          {log.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground tabular-nums">{formatSeconds(line.t).padStart(6)}</span>
              <span>{line.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
}
