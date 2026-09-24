// Acceso por código a cada prototipo. Evita que los prototipos sean públicos; no es seguridad.

export const PROTOTIPOS = ["fund", "contratos", "desarrollo"] as const;
export type Prototipo = (typeof PROTOTIPOS)[number];

export const NOMBRE_PROTOTIPO: Record<Prototipo, string> = {
  fund: "Fund · Caja chica hotelera",
  contratos: "Contratos",
  desarrollo: "Desarrollo hotelero",
};

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export function esPrototipo(valor: unknown): valor is Prototipo {
  return typeof valor === "string" && (PROTOTIPOS as readonly string[]).includes(valor);
}

export function nombreCookie(p: Prototipo): string {
  return `proto_${p}`;
}

// Referencias literales para que Next las incluya en el bundle del middleware.
export function codigoEsperado(p: Prototipo): string | undefined {
  switch (p) {
    case "fund":
      return process.env.PROTO_CODE_FUND;
    case "contratos":
      return process.env.PROTO_CODE_CONTRATOS;
    case "desarrollo":
      return process.env.PROTO_CODE_DESARROLLO;
  }
}
