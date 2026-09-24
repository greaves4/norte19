"use client";

// Store de Fund: estado de la demo persistido en localStorage (clave "fund").
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoNow } from "@/lib/demo";
import { crearDatosFund, hotelPorId, USUARIOS_DEMO, type DatosFund } from "@/lib/fixtures/fund";
import type {
  Corte,
  EstatusFondeo,
  EstatusMovimiento,
  EventoMovimiento,
  FilaCargaMasiva,
  Fondeo,
  Movimiento,
  NuevoMovimiento,
  ResultadoCargaMasiva,
  TipoEvento,
  TipoFondeo,
} from "@/lib/types/fund";

const TESORERIA = USUARIOS_DEMO.tesoreria.nombre;

// v2: fixtures de F4–F6 (comprobantes iguales al movimiento, fondeos sin periodos vacíos).
// v3: presupuesto de Cancún de 40,000 (F7).
export const VERSION_DATOS = 3;

type EstadoFund = DatosFund & { secuencia: number };

type AccionesFund = {
  crearMovimiento: (datos: NuevoMovimiento, actor: string) => string;
  enviarASupervision: (id: string, actor: string) => boolean;
  aprobar: (id: string, actor: string) => boolean;
  rechazar: (id: string, actor: string, motivo: string) => boolean;
  autorizarRechazado: (id: string, actor: string, motivo: string) => boolean;
  autorizarExtemporaneo: (id: string, actor: string) => boolean;
  solicitarExcepcion: (id: string, categoriaId: string, actor: string) => boolean;
  resolverExcepcion: (id: string, aprobada: boolean, actor?: string) => boolean;
  bloquearCategoria: (tarjetaId: string, categoriaId: string, bloqueada: boolean) => void;
  bloquearTarjeta: (tarjetaId: string, bloqueada: boolean) => void;
  registrarFondeo: (tarjetaId: string, monto: number, tipo: TipoFondeo, actor?: string) => string;
  actualizarEstatusFondeo: (fondeoId: string, estatus: EstatusFondeo) => void;
  configurarCorte: (tarjetaId: string | "global", corte: Corte) => void;
  aplicarCargaMasiva: (filas: FilaCargaMasiva[], actor?: string) => ResultadoCargaMasiva;
  sincronizarConciliacion: () => void;
  reset: () => void;
};

export type FundStore = EstadoFund & AccionesFund;

function estadoInicial(): EstadoFund {
  const datos = crearDatosFund(demoNow());
  return { ...datos, secuencia: datos.movimientos.length };
}

// Registrado fuera de la ventana de 3 días, con autorización solicitada y sin excepción de categoría pendiente.
export function esperaAutorizacion(m: Movimiento | undefined) {
  return Boolean(m && m.estatus === "registrado" && m.extemporaneo && m.excepcionSolicitada?.estatus !== "pendiente");
}

function evento(tipo: TipoEvento, titulo: string, actor: string, descripcion?: string): EventoMovimiento {
  return { fecha: demoNow().toISOString(), tipo, titulo, actor, ...(descripcion ? { descripcion } : {}) };
}

function referenciaAleatoria(prefijo: string, digitos: number) {
  const valores = crypto.getRandomValues(new Uint8Array(digitos));
  return prefijo + Array.from(valores, (v) => String(v % 10)).join("");
}

export const useFund = create<FundStore>()(
  persist(
    (set, get) => {
      // Aplica una transición solo si el movimiento está en uno de los estatus permitidos.
      const transicion = (
        id: string,
        desde: EstatusMovimiento[],
        cambio: (m: Movimiento) => Partial<Movimiento>,
        ev: EventoMovimiento,
      ) => {
        const actual = get().movimientos.find((m) => m.id === id);
        if (!actual || !desde.includes(actual.estatus)) return false;
        set((s) => ({
          movimientos: s.movimientos.map((m) =>
            m.id === id ? { ...m, ...cambio(m), timeline: [...m.timeline, ev] } : m,
          ),
        }));
        return true;
      };

      return {
        ...estadoInicial(),

        crearMovimiento: (datos, actor) => {
          const secuencia = get().secuencia + 1;
          const id = `mov-${String(secuencia).padStart(4, "0")}`;
          const ahora = demoNow().toISOString();
          const timeline: EventoMovimiento[] = [
            { fecha: ahora, tipo: "registrado", titulo: "Movimiento registrado", actor, descripcion: `CFDI ${datos.uuid.slice(0, 8)} de ${datos.proveedor}` },
          ];
          if (datos.extemporaneo) {
            timeline.push({ fecha: ahora, tipo: "autorizacion_solicitada", titulo: "Autorización solicitada", actor, descripcion: "Registro fuera de la ventana de 3 días." });
          }
          const movimiento: Movimiento = {
            ...datos,
            id,
            fecha: ahora,
            estatus: "registrado",
            timeline,
            extemporaneo: Boolean(datos.extemporaneo),
            excepcionSolicitada: null,
            registradoPor: actor,
            referenciaBancaria: referenciaAleatoria("PC", 10),
          };
          // El cargo ya ocurrió en la tarjeta: el saldo baja al registrar.
          set((s) => ({
            secuencia,
            movimientos: [...s.movimientos, movimiento],
            tarjetas: s.tarjetas.map((t) =>
              t.id === datos.tarjetaId ? { ...t, saldo: Math.max(Math.round((t.saldo - datos.total) * 100) / 100, 0) } : t,
            ),
          }));
          return id;
        },

        enviarASupervision: (id, actor) =>
          transicion(id, ["registrado"], () => ({ estatus: "pendiente" }), evento("enviado", "Enviado a supervisión", actor)),

        aprobar: (id, actor) =>
          transicion(id, ["pendiente"], () => ({ estatus: "aprobado" }), evento("aprobado", "Aprobado", actor)),

        // También rechaza un extemporáneo que espera autorización del supervisor.
        rechazar: (id, actor, motivo) => {
          const m = get().movimientos.find((x) => x.id === id);
          if (m?.estatus !== "pendiente" && !esperaAutorizacion(m)) return false;
          return transicion(
            id,
            ["pendiente", "registrado"],
            () => ({ estatus: "rechazado", motivoRechazo: motivo }),
            evento("rechazado", "Rechazado", actor, motivo),
          );
        },

        // Extemporáneo (fuera de la ventana de 3 días) que el supervisor autoriza: queda aprobado.
        autorizarExtemporaneo: (id, actor) =>
          esperaAutorizacion(get().movimientos.find((m) => m.id === id))
            ? transicion(
                id,
                ["registrado"],
                () => ({ estatus: "aprobado" }),
                evento("aprobado", "Aprobado fuera de ventana", actor, "Autorización del supervisor por registro extemporáneo."),
              )
            : false,

        autorizarRechazado: (id, actor, motivo) =>
          transicion(
            id,
            ["rechazado"],
            () => ({ estatus: "autorizado", motivoAutorizacion: motivo }),
            evento("autorizado", "Autorizado tras rechazo", actor, motivo),
          ),

        solicitarExcepcion: (id, categoriaId, actor) =>
          transicion(
            id,
            ["registrado"],
            () => ({ excepcionSolicitada: { categoriaId, estatus: "pendiente", fecha: demoNow().toISOString() } }),
            evento("excepcion_solicitada", "Excepción solicitada a Tesorería", actor),
          ),

        // Aprobada: el movimiento pasa a supervisión. Rechazada: queda rechazado.
        resolverExcepcion: (id, aprobada, actor = TESORERIA) => {
          const m = get().movimientos.find((x) => x.id === id);
          if (!m?.excepcionSolicitada || m.excepcionSolicitada.estatus !== "pendiente") return false;
          const excepcionSolicitada = { ...m.excepcionSolicitada, estatus: aprobada ? "aprobada" : "rechazada" } as const;
          return aprobada
            ? transicion(
                id,
                ["registrado"],
                () => ({ excepcionSolicitada, estatus: "pendiente" }),
                evento("excepcion_aprobada", "Excepción aprobada por Tesorería", actor, "Enviado a supervisión."),
              )
            : transicion(
                id,
                ["registrado"],
                () => ({ excepcionSolicitada, estatus: "rechazado", motivoRechazo: "Excepción rechazada por Tesorería." }),
                evento("excepcion_rechazada", "Excepción rechazada por Tesorería", actor),
              );
        },

        bloquearCategoria: (tarjetaId, categoriaId, bloqueada) =>
          set((s) => ({
            tarjetas: s.tarjetas.map((t) => {
              if (t.id !== tarjetaId) return t;
              const resto = t.categoriasBloqueadas.filter((c) => c !== categoriaId);
              return { ...t, categoriasBloqueadas: bloqueada ? [...resto, categoriaId] : resto };
            }),
          })),

        bloquearTarjeta: (tarjetaId, bloqueada) =>
          set((s) => ({
            tarjetas: s.tarjetas.map((t) => (t.id === tarjetaId ? { ...t, estatus: bloqueada ? "bloqueada" : "activa" } : t)),
          })),

        registrarFondeo: (tarjetaId, monto, tipo, actor = TESORERIA) => {
          const fondeo: Fondeo = {
            id: `fon-${referenciaAleatoria("", 8)}`,
            tarjetaId,
            fecha: demoNow().toISOString(),
            monto: Math.round(monto * 100) / 100,
            tipo,
            estatus: "enviado",
            referencia: `PC-${referenciaAleatoria("", 12)}`,
            actor,
          };
          set((s) => ({ fondeos: [...s.fondeos, fondeo] }));
          return fondeo.id;
        },

        // Al depositarse, el saldo sube y el abono aparece en el estado de cuenta de la tarjeta.
        actualizarEstatusFondeo: (fondeoId, estatus) => {
          const fondeo = get().fondeos.find((f) => f.id === fondeoId);
          if (!fondeo || fondeo.estatus === "depositado") return;
          const deposito = estatus === "depositado";
          const ahora = demoNow().toISOString();
          set((s) => ({
            fondeos: s.fondeos.map((f) => (f.id === fondeoId ? { ...f, estatus } : f)),
            tarjetas: deposito
              ? s.tarjetas.map((t) =>
                  t.id === fondeo.tarjetaId
                    ? { ...t, saldo: Math.round((t.saldo + fondeo.monto) * 100) / 100, ultimoFondeo: ahora }
                    : t,
                )
              : s.tarjetas,
            estadoCuenta: deposito
              ? [
                  ...s.estadoCuenta,
                  {
                    id: `ban-${referenciaAleatoria("", 6)}`,
                    tarjetaId: fondeo.tarjetaId,
                    fecha: ahora,
                    referencia: fondeo.referencia,
                    concepto: "ABONO DISPERSION NORTE 19",
                    tipo: "abono",
                    monto: fondeo.monto,
                  },
                ]
              : s.estadoCuenta,
          }));
        },

        configurarCorte: (tarjetaId, corte) =>
          set((s) => ({
            tarjetas: s.tarjetas.map((t) => (tarjetaId === "global" || t.id === tarjetaId ? { ...t, corte } : t)),
          })),

        // Fondeos desde Excel: cada fila se valida contra las tarjetas y se deposita al aplicar.
        aplicarCargaMasiva: (filas, actor = TESORERIA) => {
          const resultado: ResultadoCargaMasiva = { aplicadas: [], errores: [] };
          filas.forEach((fila, i) => {
            const numero = i + 2; // fila 1 es el encabezado de la plantilla
            const candidatas = get().tarjetas.filter((t) => t.ultimosCuatro === String(fila.ultimosCuatro).trim());
            const tarjeta = fila.hotel
              ? candidatas.find((t) => hotelPorId(t.hotelId)?.nombre.toLowerCase() === fila.hotel!.trim().toLowerCase()) ??
                (candidatas.length === 1 ? candidatas[0] : undefined)
              : candidatas[0];
            if (!tarjeta) return void resultado.errores.push({ fila: numero, motivo: "No existe una tarjeta con esos últimos cuatro dígitos." });
            if (tarjeta.estatus === "bloqueada") return void resultado.errores.push({ fila: numero, motivo: "La tarjeta está bloqueada." });
            if (!(fila.monto > 0)) return void resultado.errores.push({ fila: numero, motivo: "El monto debe ser mayor a cero." });
            if (!String(fila.referencia ?? "").trim()) return void resultado.errores.push({ fila: numero, motivo: "Falta la referencia." });

            const id = get().registrarFondeo(tarjeta.id, fila.monto, "carga_masiva", actor);
            get().actualizarEstatusFondeo(id, "depositado");
            resultado.aplicadas.push({ fila: numero, tarjetaId: tarjeta.id, monto: fila.monto });
          });
          return resultado;
        },

        // Simula la sincronización con Pay Connect: vincula el cargo pendiente sembrado; el de monto distinto persiste.
        sincronizarConciliacion: () => {
          const { sinVincular } = get().discrepancias;
          set((s) => ({
            movimientos: s.movimientos.map((m) =>
              m.id === sinVincular.movimientoId ? { ...m, referenciaBancaria: sinVincular.referencia } : m,
            ),
            conciliacion: {
              ultimaSincronizacion: demoNow().toISOString(),
              sincronizaciones: s.conciliacion.sincronizaciones + 1,
            },
          }));
        },

        reset: () => set(estadoInicial()),
      };
    },
    {
      name: "fund",
      // Subir VERSION_DATOS cuando cambien las fixtures: el estado guardado se descarta y se regenera.
      version: VERSION_DATOS,
      migrate: () => estadoInicial(),
      storage: createJSONStorage(() => localStorage),
      partialize: ({ tarjetas, movimientos, fondeos, estadoCuenta, conciliacion, discrepancias, secuencia }) => ({
        tarjetas,
        movimientos,
        fondeos,
        estadoCuenta,
        conciliacion,
        discrepancias,
        secuencia,
      }),
    },
  ),
);

// true cuando el store ya leyó localStorage; antes de eso el HTML del servidor no coincide con el del navegador.
export function useFundHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useFund.persist.onFinishHydration(cb),
    () => useFund.persist.hasHydrated(),
    () => false,
  );
}
