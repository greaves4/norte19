import { HOTEL_DEMO_ID } from "@/lib/fixtures/fund/hoteles";
import { redondear, sumarDias, type Rng } from "@/lib/fixtures/fund/semilla";
import { DIAS_CORTE, type Fondeo, type Movimiento, type Tarjeta } from "@/lib/types/fund";

const ACTORES_TESORERIA = ["Viviana Torres", "Jaime Vicente Martínez"];
const DIAS_HISTORIAL = 90;
const DIAS_MOVIMIENTOS = 60;

// Fondeos de los últimos 3 meses según el corte de cada tarjeta. El monto repone lo gastado en el periodo
// anterior; si no hubo gasto no hay fondeo. Antes de la ventana de movimientos (60 días) se usa un monto aproximado.
export function crearFondeos(rng: Rng, tarjetas: Tarjeta[], movimientos: Movimiento[], hoy: Date): Fondeo[] {
  const fondeos: Fondeo[] = [];

  for (const t of tarjetas) {
    const periodo = DIAS_CORTE[t.corte];
    // Cancún tuvo fondeo hace 2 días para que el corte en curso sea corto y legible en la demo.
    const desfase = t.hotelId === HOTEL_DEMO_ID ? 2 : rng.int(1, periodo - 1);
    const ultimo = new Date(hoy);
    ultimo.setHours(9, 0, 0, 0);

    const fechas: Date[] = [];
    for (let d = sumarDias(ultimo, -desfase); d >= sumarDias(hoy, -DIAS_HISTORIAL); d = sumarDias(d, -periodo)) {
      fechas.push(d);
    }
    fechas.reverse();

    fechas.forEach((fecha, i) => {
      const desde = i === 0 ? sumarDias(fecha, -periodo) : fechas[i - 1];
      const repuesto = movimientos
        .filter((m) => m.tarjetaId === t.id && new Date(m.fecha) > desde && new Date(m.fecha) <= fecha)
        .reduce((sum, m) => sum + m.total, 0);
      const antesDeLosMovimientos = fecha < sumarDias(hoy, -DIAS_MOVIMIENTOS);
      const aproximado = rng.int(Math.round(t.presupuesto * 0.002), Math.round(t.presupuesto * 0.004)) * 100;
      if (repuesto === 0 && !antesDeLosMovimientos) return;
      const monto = repuesto > 0 ? redondear(repuesto) : aproximado;
      fondeos.push({
        id: "",
        tarjetaId: t.id,
        fecha: fecha.toISOString(),
        monto,
        tipo: rng.next() < 0.8 ? "automatico" : "manual",
        estatus: "depositado",
        referencia: `PC-${fechaCorta(fecha)}-${rng.digits(6)}`,
        actor: rng.pick(ACTORES_TESORERIA),
      });
    });
  }

  return fondeos
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((f, i) => ({ ...f, id: `fon-${String(i + 1).padStart(4, "0")}` }));
}

function fechaCorta(d: Date) {
  return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
