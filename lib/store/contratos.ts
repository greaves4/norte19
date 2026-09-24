"use client";

// Store de Contratos: estado de la demo persistido en localStorage (clave "contratos").
import { addDays } from "date-fns";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoNow } from "@/lib/demo";
import { abogadoPorId, crearDatosContratos, solicitantePorId, USUARIOS_CONTRATOS, type DatosContratos } from "@/lib/fixtures/contratos";
import { ARCHIVO_CENTRAL } from "@/lib/fixtures/contratos/contratos";
import { contraparteDe } from "@/lib/fixtures/contratos/solicitudes";
import { asignarAbogado } from "@/lib/sim/contratos/asignacion";
import { slaPorTipo } from "@/lib/sim/contratos/sla";
import type {
  CampoExtraido,
  Contrato,
  Documento,
  EstatusSolicitud,
  EventoSolicitud,
  PasoFirma,
  Solicitud,
  TipoContrato,
  TipoEventoSolicitud,
  TipoPersona,
} from "@/lib/types/contratos";

// Subir cuando cambien las fixtures: el estado guardado se descarta y se regenera.
export const VERSION_DATOS_CONTRATOS = 1;

type EstadoContratos = DatosContratos & { secuenciaSolicitud: number; secuenciaContrato: number };

export type NuevaSolicitud = {
  tipoPersona: TipoPersona;
  tipoContrato: TipoContrato;
  campos: Record<string, string | number>;
  expediente: Documento[];
  solicitanteId: string;
  renovacionDe?: string;
};

type AccionesContratos = {
  crearSolicitud: (datos: NuevaSolicitud, actor: string) => { id: string; abogadoId: string };
  iniciarAnalisis: (id: string, actor: string) => boolean;
  guardarAnalisis: (id: string, texto: string, actor: string) => boolean;
  enviarAAprobacion: (id: string, actor: string) => boolean;
  regresarASolicitante: (id: string, motivo: string, actor: string) => boolean;
  reenviar: (id: string, cambios: Partial<Pick<Solicitud, "campos" | "expediente">>, actor: string) => boolean;
  aprobar: (id: string, actor: string) => boolean;
  rechazarAAjustes: (id: string, motivo: string, actor: string) => boolean;
  reasignar: (id: string, abogadoId: string, actor: string) => boolean;
  enviarAFirma: (id: string, actor: string) => boolean;
  avanzarFirma: (id: string, paso: PasoFirma) => boolean;
  formalizar: (id: string) => string | null;
  confirmarCampo: (contratoId: string, clave: string, valor: string | undefined, actor: string) => boolean;
  registrarPrestamo: (contratoId: string, numero: 1 | 2 | 3, aQuien: string, hasta: string, actor: string) => boolean;
  registrarDevolucion: (contratoId: string, numero: 1 | 2 | 3, actor: string) => boolean;
  iniciarRenovacion: (contratoId: string, actor: string) => string | null;
  reset: () => void;
};

export type ContratosStore = EstadoContratos & AccionesContratos;

function estadoInicial(): EstadoContratos {
  const datos = crearDatosContratos(demoNow());
  return { ...datos, secuenciaSolicitud: 100 + datos.solicitudes.length, secuenciaContrato: 200 };
}

const ahora = () => demoNow().toISOString();

function evento(tipo: TipoEventoSolicitud, titulo: string, actor: string, descripcion?: string): EventoSolicitud {
  return { fecha: ahora(), tipo, titulo, actor, ...(descripcion ? { descripcion } : {}) };
}

// Hash ficticio con apariencia de SHA-256 para el sello de la firma.
function hashFicticio() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Extracción genérica para un contrato formalizado en la demo: los datos vienen de la solicitud, con confianza alta.
function extraccionDeSolicitud(s: Solicitud): CampoExtraido[] {
  const c = s.campos;
  const monto = Number(c.rentaMensual ?? c.contraprestacionMensual ?? c.montoTotal ?? c.penaConvencional ?? 0);
  const campo = (clave: string, etiqueta: string, valor: string, pagina: number | null, clausula: string | null): CampoExtraido => ({
    clave, etiqueta, valor, confianza: "alta", pagina, clausula, confirmado: true,
  });
  return [
    campo("partes", "Partes", `Norte 19 Operadora Hotelera, S.A. de C.V. y ${contraparteDe(c)} (${c.rfc ?? "RFC por confirmar"}).`, 1, "DECLARACIONES"),
    campo("objeto", "Objeto", String(c.inmueble ?? c.proyecto ?? c.servicio ?? c.proposito ?? "Según solicitud"), 2, "PRIMERA"),
    campo("vigencia", "Vigencia", c.vigenciaMeses ? `${c.vigenciaMeses} meses a partir del ${c.fechaInicio}` : String(c.vigenciaAnios ?? c.plazoMeses ?? "Según solicitud"), 2, "TERCERA"),
    campo("renta", "Monto", monto ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(monto) : "No aplica", 2, "CUARTA"),
    campo("incremento", "Incremento anual", String(c.incrementoAnual ?? "No aplica"), 3, "QUINTA"),
    campo("deposito", "Depósito en garantía", String(c.deposito ?? c.anticipo ?? "No aplica"), 3, "SEXTA"),
    campo("penalizacion", "Penalización", c.penaConvencional ? `Pena convencional de ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(c.penaConvencional))}` : "Conforme al modelo institucional", 4, "DÉCIMA SEGUNDA"),
    campo("garantia", "Garantía", String(c.aval ?? c.garantias ?? "Depósito en garantía"), 4, null),
    campo("causales", "Causales de rescisión", "Conforme al modelo institucional de Norte 19.", 4, "DÉCIMA TERCERA"),
    campo("jurisdiccion", "Jurisdicción", "Tribunales de la Ciudad de México.", 5, null),
  ];
}

export const useContratos = create<ContratosStore>()(
  persist(
    (set, get) => {
      // Aplica una transición solo desde los estatus permitidos; registra el evento y la fecha de la nueva etapa.
      const transicion = (id: string, desde: EstatusSolicitud[], hacia: EstatusSolicitud | null, cambio: (s: Solicitud) => Partial<Solicitud>, ev: EventoSolicitud) => {
        const actual = get().solicitudes.find((s) => s.id === id);
        if (!actual || !desde.includes(actual.estatus)) return false;
        set((st) => ({
          solicitudes: st.solicitudes.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...cambio(s),
                  ...(hacia ? { estatus: hacia, etapas: { ...s.etapas, [hacia]: ev.fecha } } : {}),
                  timeline: [...s.timeline, ev],
                }
              : s,
          ),
        }));
        return true;
      };

      const actualizarContrato = (id: string, cambio: (c: Contrato) => Contrato) => {
        if (!get().contratos.some((c) => c.id === id)) return false;
        set((st) => ({ contratos: st.contratos.map((c) => (c.id === id ? cambio(c) : c)) }));
        return true;
      };

      return {
        ...estadoInicial(),

        crearSolicitud: (datos, actor) => {
          const secuencia = get().secuenciaSolicitud + 1;
          const fecha = ahora();
          const abogadoId = asignarAbogado(get().solicitudes);
          const sla = slaPorTipo(datos.tipoContrato);
          const id = `sol-${String(secuencia).padStart(4, "0")}`;
          const solicitud: Solicitud = {
            ...datos,
            id,
            folio: `SOL-${new Date(fecha).getFullYear()}-${String(secuencia).padStart(4, "0")}`,
            abogadoId,
            estatus: "nueva",
            slaDiasHabiles: sla,
            creadaEn: fecha,
            versionesAnalisis: [],
            etapas: { nueva: fecha },
            timeline: [
              { fecha, tipo: "creada", titulo: datos.renovacionDe ? "Solicitud de renovación creada" : "Solicitud creada", actor },
              { fecha, tipo: "asignada", titulo: `Asignada a ${abogadoPorId(abogadoId)?.nombre}`, actor: "Asignación automática", descripcion: `SLA de análisis: ${sla} días hábiles.` },
            ],
          };
          set((st) => ({ secuenciaSolicitud: secuencia, solicitudes: [...st.solicitudes, solicitud] }));
          return { id, abogadoId };
        },

        iniciarAnalisis: (id, actor) =>
          transicion(id, ["nueva"], "en_analisis", () => ({}), evento("en_analisis", "En análisis", actor)),

        // Guarda una nueva versión del análisis (historial simple).
        guardarAnalisis: (id, texto, actor) =>
          transicion(
            id,
            ["nueva", "en_analisis", "en_ajustes"],
            null,
            (s) => ({ analisis: texto, versionesAnalisis: [...s.versionesAnalisis, { fecha: ahora(), autor: actor, texto }] }),
            evento("analisis_guardado", "Análisis jurídico guardado", actor, `Versión ${get().solicitudes.find((s) => s.id === id)!.versionesAnalisis.length + 1}`),
          ),

        enviarAAprobacion: (id, actor) => {
          const s = get().solicitudes.find((x) => x.id === id);
          if (!s?.analisis?.trim()) return false;
          return transicion(id, ["en_analisis"], "en_aprobacion", () => ({ motivoRechazo: undefined }), evento("enviada_aprobacion", "Enviada a aprobación", actor));
        },

        regresarASolicitante: (id, motivo, actor) =>
          transicion(id, ["nueva", "en_analisis"], "en_ajustes", () => ({ motivoRechazo: motivo }), evento("regresada", "Regresada al solicitante para ajustes", actor, motivo)),

        reenviar: (id, cambios, actor) =>
          transicion(
            id,
            ["en_ajustes"],
            "en_analisis",
            (s) => ({ campos: cambios.campos ?? s.campos, expediente: cambios.expediente ?? s.expediente, motivoRechazo: undefined }),
            evento("reenviada", "Corregida y reenviada", actor),
          ),

        aprobar: (id, actor) => transicion(id, ["en_aprobacion"], "aprobada", () => ({}), evento("aprobada", "Aprobada", actor)),

        // El directivo regresa la solicitud al abogado (en análisis) con el motivo.
        rechazarAAjustes: (id, motivo, actor) =>
          transicion(id, ["en_aprobacion"], "en_analisis", () => ({ motivoRechazo: motivo }), evento("rechazada_ajustes", "Rechazada a ajustes", actor, motivo)),

        reasignar: (id, abogadoId, actor) => {
          const s = get().solicitudes.find((x) => x.id === id);
          if (!s || s.abogadoId === abogadoId || !abogadoPorId(abogadoId)) return false;
          return transicion(
            id,
            ["nueva", "en_analisis", "en_ajustes", "en_aprobacion", "aprobada", "en_firma"],
            null,
            () => ({ abogadoId }),
            evento("reasignada", `Reasignada a ${abogadoPorId(abogadoId)!.nombre}`, actor, `Antes: ${abogadoPorId(s.abogadoId)?.nombre}`),
          );
        },

        enviarAFirma: (id, actor) =>
          transicion(id, ["aprobada"], "en_firma", () => ({ firma: { pasos: {} } }), evento("enviada_firma", "Enviada a firma electrónica", actor)),

        avanzarFirma: (id, paso) => {
          const s = get().solicitudes.find((x) => x.id === id);
          if (!s || s.estatus !== "en_firma" || s.firma?.pasos[paso]) return false;
          const etiqueta: Record<PasoFirma, string> = {
            enviado: "Documento enviado al proveedor de firma",
            firmante_1: "Firmó el representante de Norte 19",
            firmante_2: "Firmó la contraparte",
            constancia: "Constancia de conservación generada",
            formalizado: "Firma completada",
          };
          return transicion(id, ["en_firma"], null, (x) => ({ firma: { pasos: { ...x.firma?.pasos, [paso]: ahora() } } }), evento("firma", etiqueta[paso], "Proveedor de firma"));
        },

        // Crea el contrato en el repositorio a partir de la solicitud firmada.
        formalizar: (id) => {
          const s = get().solicitudes.find((x) => x.id === id);
          if (!s || s.estatus !== "en_firma") return null;
          const secuencia = get().secuenciaContrato + 1;
          const fecha = demoNow();
          const contratoId = `ctr-${secuencia}`;
          const meses = Number(s.campos.vigenciaMeses ?? s.campos.plazoMeses ?? 12) || 12;
          const inicio = String(s.campos.fechaInicio ?? fecha.toISOString().slice(0, 10));
          const contrato: Contrato = {
            id: contratoId,
            folio: `CTR-${fecha.getFullYear()}-${String(secuencia).padStart(4, "0")}`,
            solicitudId: s.id,
            tipo: s.tipoContrato,
            titulo: `Contrato de ${s.tipoContrato === "confidencialidad" ? "confidencialidad" : s.tipoContrato} · ${contraparteDe(s.campos)}`,
            contraparte: contraparteDe(s.campos),
            objeto: String(s.campos.inmueble ?? s.campos.proyecto ?? s.campos.servicio ?? s.campos.proposito ?? ""),
            area: s.solicitanteId,
            vigenciaInicio: inicio,
            vigenciaFin: addDays(new Date(`${inicio}T12:00:00`), Math.round(meses * 30.4)).toISOString().slice(0, 10),
            monto: Number(s.campos.rentaMensual ?? s.campos.contraprestacionMensual ?? s.campos.montoTotal ?? 0),
            periodicidadMonto: s.campos.montoTotal ? "total" : "mensual",
            pdf: `/fixtures/contratos/modelos/${s.tipoContrato}.pdf`,
            pdfTexto: `/fixtures/contratos/modelos/${s.tipoContrato}.pdf`,
            paginas: 6,
            ocr: false,
            extraccion: extraccionDeSolicitud(s),
            custodia: [
              { numero: 1, ubicacion: ARCHIVO_CENTRAL, responsable: USUARIOS_CONTRATOS.admin.nombre, estatus: "en_resguardo", historialPrestamos: [] },
              { numero: 2, ubicacion: ARCHIVO_CENTRAL, responsable: USUARIOS_CONTRATOS.admin.nombre, estatus: "en_resguardo", historialPrestamos: [] },
              { numero: 3, ubicacion: `Contraparte · ${contraparteDe(s.campos)}`, responsable: "Contraparte", estatus: "en_resguardo", historialPrestamos: [] },
            ],
            historial: [{ fecha: fecha.toISOString(), titulo: "Formalizado con firma electrónica", actor: "Proveedor de firma", descripcion: `Solicitud ${s.folio}.` }],
            sello: { hash: hashFicticio(), fecha: fecha.toISOString() },
          };
          const ok = transicion(
            id,
            ["en_firma"],
            "formalizada",
            (x) => ({ contratoId, firma: { pasos: { ...x.firma?.pasos, formalizado: x.firma?.pasos.formalizado ?? fecha.toISOString() } } }),
            evento("formalizada", "Formalizado", "Firma electrónica", `Contrato ${contrato.folio} en el repositorio.`),
          );
          if (!ok) return null;
          set((st) => ({ secuenciaContrato: secuencia, contratos: [...st.contratos, contrato] }));
          return contratoId;
        },

        confirmarCampo: (contratoId, clave, valor, actor) =>
          actualizarContrato(contratoId, (c) => {
            const campo = c.extraccion.find((x) => x.clave === clave);
            if (!campo) return c;
            const corregido = valor !== undefined && valor.trim() !== "" && valor !== campo.valor;
            return {
              ...c,
              extraccion: c.extraccion.map((x) => (x.clave === clave ? { ...x, confirmado: true, valor: corregido ? valor!.trim() : x.valor } : x)),
              historial: [
                ...c.historial,
                { fecha: ahora(), titulo: corregido ? `Campo corregido: ${campo.etiqueta}` : `Campo confirmado: ${campo.etiqueta}`, actor, descripcion: corregido ? `Antes: ${campo.valor}` : undefined },
              ],
            };
          }),

        registrarPrestamo: (contratoId, numero, aQuien, hasta, actor) => {
          const c = get().contratos.find((x) => x.id === contratoId);
          const tanto = c?.custodia[numero - 1];
          if (!tanto || tanto.estatus === "prestado" || !aQuien.trim()) return false;
          const prestamo = { aQuien: aQuien.trim(), desde: ahora(), hasta };
          return actualizarContrato(contratoId, (x) => ({
            ...x,
            custodia: x.custodia.map((t) => (t.numero === numero ? { ...t, estatus: "prestado" as const, prestamo, historialPrestamos: [...t.historialPrestamos, prestamo] } : t)) as Contrato["custodia"],
            historial: [...x.historial, { fecha: prestamo.desde, titulo: `Préstamo del original ${numero}/3`, actor, descripcion: `A ${prestamo.aQuien}, hasta el ${hasta.slice(0, 10)}.` }],
          }));
        },

        registrarDevolucion: (contratoId, numero, actor) => {
          const c = get().contratos.find((x) => x.id === contratoId);
          const tanto = c?.custodia[numero - 1];
          if (!tanto || tanto.estatus !== "prestado" || !tanto.prestamo) return false;
          const devuelto = ahora();
          return actualizarContrato(contratoId, (x) => ({
            ...x,
            custodia: x.custodia.map((t) =>
              t.numero === numero
                ? {
                    ...t,
                    estatus: "en_resguardo" as const,
                    prestamo: undefined,
                    historialPrestamos: t.historialPrestamos.map((p, i) => (i === t.historialPrestamos.length - 1 ? { ...p, devuelto } : p)),
                  }
                : t,
            ) as Contrato["custodia"],
            historial: [...x.historial, { fecha: devuelto, titulo: `Devolución del original ${numero}/3`, actor, descripcion: `Devuelto por ${tanto.prestamo!.aQuien}.` }],
          }));
        },

        // Crea una solicitud precargada con los datos del contrato que vence.
        iniciarRenovacion: (contratoId, actor) => {
          const c = get().contratos.find((x) => x.id === contratoId);
          if (!c) return null;
          const campos: Record<string, string | number> = {
            razonSocial: c.contraparte,
            ...(c.tipo === "arrendamiento"
              ? { inmueble: c.objeto, rentaMensual: c.monto, vigenciaMeses: 60, fechaInicio: addDays(new Date(`${c.vigenciaFin}T12:00:00`), 1).toISOString().slice(0, 10) }
              : c.tipo === "servicios"
                ? { servicio: c.objeto, contraprestacionMensual: c.monto, vigenciaMeses: 36 }
                : { proyecto: c.objeto }),
          };
          const { id } = get().crearSolicitud(
            { tipoPersona: "moral", tipoContrato: c.tipo, campos, expediente: [], solicitanteId: solicitantePorId(c.area)?.id ?? "desarrollo", renovacionDe: c.id },
            actor,
          );
          actualizarContrato(contratoId, (x) => ({ ...x, historial: [...x.historial, { fecha: ahora(), titulo: "Renovación iniciada", actor, descripcion: `Solicitud ${get().solicitudes.find((s) => s.id === id)?.folio}.` }] }));
          return id;
        },

        reset: () => set(estadoInicial()),
      };
    },
    {
      name: "contratos",
      version: VERSION_DATOS_CONTRATOS,
      migrate: () => estadoInicial(),
      storage: createJSONStorage(() => localStorage),
      partialize: ({ solicitudes, contratos, secuenciaSolicitud, secuenciaContrato }) => ({ solicitudes, contratos, secuenciaSolicitud, secuenciaContrato }),
    },
  ),
);

export function useContratosHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useContratos.persist.onFinishHydration(cb),
    () => useContratos.persist.hasHydrated(),
    () => false,
  );
}
