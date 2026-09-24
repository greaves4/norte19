import { describe, expect, it } from "vitest";
import { crearDatosContratos } from "@/lib/fixtures/contratos";
import { filasCustodia, prestamosVencidos, resumenCustodia } from "@/lib/sim/contratos/custodia";

const HOY = new Date(2026, 8, 24, 10);
const { contratos } = crearDatosContratos(HOY);

describe("custodia", () => {
  it("tres tantos por contrato y un préstamo vencido al iniciar", () => {
    expect(filasCustodia(contratos)).toHaveLength(contratos.length * 3);
    const vencidos = prestamosVencidos(contratos, HOY);
    expect(vencidos).toHaveLength(1);
    expect(vencidos[0].contrato.id).toBe("arr-pue");
  });

  it("el préstamo al corriente vence al avanzar el reloj", () => {
    const en15dias = new Date(HOY.getTime() + 15 * 86_400_000);
    expect(prestamosVencidos(contratos, en15dias)).toHaveLength(2);
  });

  it("resume la custodia", () => {
    expect(resumenCustodia(contratos.find((c) => c.id === "arr-gym")!)).toBe("3 de 3 en resguardo");
    expect(resumenCustodia(contratos.find((c) => c.id === "arr-pue")!)).toBe("2 de 3 en resguardo · 1 prestado");
  });
});
