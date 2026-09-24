// Formatos de México compartidos por los prototipos.
import { format } from "date-fns";
import { es } from "date-fns/locale";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function mxn(monto: number) {
  return moneda.format(monto);
}

export function fecha(valor: Date | string, patron = "d MMM yyyy") {
  return format(typeof valor === "string" ? new Date(valor) : valor, patron, { locale: es });
}

export function fechaHora(valor: Date | string) {
  return fecha(valor, "d MMM yyyy, HH:mm");
}

// "hace 3 h", "hace 2 d": para tiempos en bandeja y SLA.
export function duracionCorta(ms: number) {
  const horas = ms / 3_600_000;
  if (horas < 1) return `${Math.max(Math.round(horas * 60), 0)} min`;
  if (horas < 48) return `${Math.round(horas)} h`;
  return `${Math.round(horas / 24)} d`;
}
