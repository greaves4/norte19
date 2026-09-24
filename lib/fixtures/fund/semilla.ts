// Generador pseudoaleatorio determinista: la misma semilla produce siempre los mismos datos.

export type Rng = {
  next: () => number; // [0, 1)
  int: (min: number, max: number) => number; // inclusivo
  pick: <T>(items: readonly T[]) => T;
  money: (min: number, max: number) => number; // 2 decimales
  hex: (length: number) => string;
  digits: (length: number) => string;
};

export function crearRng(semilla: number): Rng {
  let a = semilla >>> 0;
  const next = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: (items) => items[Math.floor(next() * items.length)],
    money: (min, max) => redondear(min + next() * (max - min)),
    hex: (length) => Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join(""),
    digits: (length) => Array.from({ length }, () => String(int(0, 9))).join(""),
  };
}

export function redondear(n: number) {
  return Math.round(n * 100) / 100;
}

// UUID con formato v4 (como el del TimbreFiscalDigital), en mayúsculas como lo emite el SAT.
export function uuid(rng: Rng) {
  const h = rng.hex(32).split("");
  h[12] = "4";
  h[16] = "89ab"[rng.int(0, 3)];
  const s = h.join("").toUpperCase();
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export function sumarHoras(fecha: Date, horas: number) {
  return new Date(fecha.getTime() + horas * 3_600_000);
}

export function sumarDias(fecha: Date, dias: number) {
  return sumarHoras(fecha, dias * 24);
}
