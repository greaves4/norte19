// Dispersión simulada con Pay Connect: registra el fondeo y devuelve los pasos para ProgressRunner.
// Solicitud enviada → Aceptada por Pay Connect → Webhook: depositado. Al terminar cada paso se actualiza el fondeo.
import type { RunnerStep } from "@/components/shared/ProgressRunner";
import { hotelPorId } from "@/lib/fixtures/fund";
import { useFund } from "@/lib/store/fund";
import type { TipoFondeo } from "@/lib/types/fund";

const API = "https://api.payconnect.mx/v2";

export type Dispersion = { fondeoId: string; tarjetaId: string; monto: number };

export type DispersionEnCurso = {
  dispersiones: Dispersion[];
  pasos: RunnerStep[];
  alTerminarPaso: (pasoId: string) => void;
  // Completa lo pendiente (p. ej. si se cierra el diálogo antes de terminar: el webhook llega igual).
  finalizar: () => void;
};

function latencia() {
  return 800 + Math.round(Math.random() * 700);
}

function idAleatorio(prefijo: string) {
  return `${prefijo}_${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function dispersar(tarjetaId: string, monto: number, tipo: TipoFondeo): DispersionEnCurso {
  return dispersarLote([{ tarjetaId, monto }], tipo);
}

export function dispersarLote(items: { tarjetaId: string; monto: number }[], tipo: TipoFondeo): DispersionEnCurso {
  const store = useFund.getState();
  const dispersiones = items.map((i) => ({ ...i, fondeoId: store.registrarFondeo(i.tarjetaId, i.monto, tipo) }));
  const datos = dispersiones.map((d) => {
    const tarjeta = useFund.getState().tarjetas.find((t) => t.id === d.tarjetaId)!;
    const fondeo = useFund.getState().fondeos.find((f) => f.id === d.fondeoId)!;
    return { ...d, tarjeta, fondeo, hotel: hotelPorId(tarjeta.hotelId)?.nombre ?? tarjeta.hotelId, dispersionId: idAleatorio("dsp") };
  });
  const varias = datos.length > 1;

  const pasos: RunnerStep[] = [
    {
      id: "enviado",
      label: varias ? `Solicitud enviada (${datos.length} dispersiones)` : "Solicitud enviada",
      durationMs: latencia(),
      log: datos.flatMap((d) => [
        `→ POST ${API}/dispersions ${JSON.stringify({ card_token: `${d.tarjeta.token.slice(0, 12)}…`, amount: d.monto, currency: "MXN", reference: d.fondeo.referencia })}`,
        `← 202 ${JSON.stringify({ dispersion_id: d.dispersionId, status: "received" })}`,
      ]),
    },
    {
      id: "aceptado",
      label: "Aceptada por Pay Connect",
      durationMs: latencia(),
      log: datos.map((d) => `← 200 GET /dispersions/${d.dispersionId} ${JSON.stringify({ status: "accepted", hotel: d.hotel })}`),
    },
    {
      id: "depositado",
      label: "Webhook: depositado",
      durationMs: latencia(),
      log: datos.map(
        (d) => `⇠ webhook dispersion.completed ${JSON.stringify({ dispersion_id: d.dispersionId, status: "deposited", amount: d.monto, card_last4: d.tarjeta.ultimosCuatro })}`,
      ),
    },
  ];

  const alTerminarPaso = (pasoId: string) => {
    if (pasoId !== "aceptado" && pasoId !== "depositado") return;
    for (const d of dispersiones) useFund.getState().actualizarEstatusFondeo(d.fondeoId, pasoId);
  };

  return {
    dispersiones,
    pasos,
    alTerminarPaso,
    finalizar: () => {
      alTerminarPaso("aceptado");
      alTerminarPaso("depositado");
    },
  };
}
