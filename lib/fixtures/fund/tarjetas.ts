import { CATEGORIAS_BLOQUEADAS_POR_DEFECTO } from "@/lib/fixtures/fund/categorias";
import { CUENTAS_FONDEADORAS, HOTEL_DEMO_ID, HOTELES } from "@/lib/fixtures/fund/hoteles";
import { redondear, type Rng } from "@/lib/fixtures/fund/semilla";
import type { Corte, Fondeo, Movimiento, Tarjeta } from "@/lib/types/fund";

// Hoteles cuya tarjeta arranca bloqueada, para que el panel de Tesorería muestre el caso.
const BLOQUEADAS = new Set(["ce-gym"]);

// Cuenta fondeadora por región.
const CUENTA_POR_ESTADO: Record<string, string> = {
  "Quintana Roo": "cf-bbva-02",
  Yucatán: "cf-bbva-02",
  Veracruz: "cf-bbva-02",
  Tabasco: "cf-bbva-02",
  Puebla: "cf-bbva-02",
  Querétaro: "cf-banorte-01",
  Guanajuato: "cf-banorte-01",
  Aguascalientes: "cf-banorte-01",
  "Estado de México": "cf-banorte-01",
};

// Tarjetas sin saldo: el saldo depende de fondeos y movimientos (ver calcularSaldos).
// El PAN nunca se genera: solo un token opaco y los últimos cuatro dígitos.
export function crearTarjetas(rng: Rng): Tarjeta[] {
  const usados = new Set<string>();
  return HOTELES.map((hotel) => {
    let ultimosCuatro = rng.digits(4);
    while (usados.has(ultimosCuatro)) ultimosCuatro = rng.digits(4);
    usados.add(ultimosCuatro);

    const corte: Corte =
      hotel.id === HOTEL_DEMO_ID ? "semanal" : rng.pick<Corte>(["semanal", "quincenal", "quincenal", "mensual"]);

    return {
      id: `tj-${hotel.id}`,
      hotelId: hotel.id,
      token: `tok_${rng.hex(24)}`,
      ultimosCuatro,
      cuentaFondeadoraId: CUENTA_POR_ESTADO[hotel.estado] ?? CUENTAS_FONDEADORAS[0].id,
      // Cancún: holgura para que los pendientes sembrados y lo que registre Recepción en la sesión no agoten el saldo.
      presupuesto: hotel.id === HOTEL_DEMO_ID ? 40_000 : rng.int(30, 120) * 500, // 15,000–60,000
      saldo: 0,
      corte,
      estatus: BLOQUEADAS.has(hotel.id) ? "bloqueada" : "activa",
      categoriasBloqueadas: [...CATEGORIAS_BLOQUEADAS_POR_DEFECTO],
      ultimoFondeo: null,
    };
  });
}

// Saldo coherente: tras cada fondeo la tarjeta vuelve a su presupuesto y baja con cada cargo posterior.
export function calcularSaldos(tarjetas: Tarjeta[], movimientos: Movimiento[], fondeos: Fondeo[]): Tarjeta[] {
  return tarjetas.map((t) => {
    const ultimo = fondeos
      .filter((f) => f.tarjetaId === t.id && f.estatus === "depositado")
      .reduce<string | null>((max, f) => (max === null || f.fecha > max ? f.fecha : max), null);
    const gastado = movimientos
      .filter((m) => m.tarjetaId === t.id && (ultimo === null || m.fecha > ultimo))
      .reduce((sum, m) => sum + m.total, 0);
    return { ...t, ultimoFondeo: ultimo, saldo: Math.max(redondear(t.presupuesto - gastado), 0) };
  });
}
