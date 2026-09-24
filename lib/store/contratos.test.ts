import { beforeEach, describe, expect, it } from "vitest";
import { useContratos } from "@/lib/store/contratos";
import { restarDiasHabiles, diasHabilesTranscurridos, sumarDiasHabiles } from "@/lib/sim/contratos/sla";

const store = () => useContratos.getState();
const sol = (id: string) => store().solicitudes.find((s) => s.id === id)!;

beforeEach(() => store().reset());

describe("días hábiles", () => {
  it("no cuentan el fin de semana", () => {
    const viernes = new Date(2026, 8, 25, 12, 0);
    const lunes = new Date(2026, 8, 28, 12, 0);
    expect(diasHabilesTranscurridos(viernes, lunes)).toBeCloseTo(1, 5);
    expect(restarDiasHabiles(lunes, 1).getTime()).toBe(viernes.getTime());
    expect(sumarDiasHabiles(viernes, 1).getTime()).toBe(lunes.getTime());
  });
});

describe("store de Contratos", () => {
  it("crea, asigna al de menor carga y recorre el flujo hasta formalizar", () => {
    const { id, abogadoId } = store().crearSolicitud(
      { tipoPersona: "moral", tipoContrato: "arrendamiento", campos: { razonSocial: "Prueba, S.A. de C.V.", rentaMensual: 100000, vigenciaMeses: 60, fechaInicio: "2027-01-01" }, expediente: [], solicitanteId: "desarrollo" },
      "Ing. Alejandro Ríos Maldonado",
    );
    expect(abogadoId).toBe("ab-nieto"); // carga 3, la menor
    expect(sol(id).estatus).toBe("nueva");

    expect(store().enviarAAprobacion(id, "Lic. Patricia Nieto")).toBe(false); // aún no está en análisis
    expect(store().iniciarAnalisis(id, "Lic. Patricia Nieto")).toBe(true);
    expect(store().enviarAAprobacion(id, "Lic. Patricia Nieto")).toBe(false); // sin análisis
    store().guardarAnalisis(id, "Objeto: ok", "Lic. Patricia Nieto");
    expect(store().enviarAAprobacion(id, "Lic. Patricia Nieto")).toBe(true);

    expect(store().rechazarAAjustes(id, "Falta garantía", "Lic. Andrés Villaseñor")).toBe(true);
    expect(sol(id).estatus).toBe("en_analisis");
    expect(sol(id).motivoRechazo).toBe("Falta garantía");
    store().enviarAAprobacion(id, "Lic. Patricia Nieto");
    expect(store().aprobar(id, "Lic. Andrés Villaseñor")).toBe(true);
    expect(store().enviarAFirma(id, "Lic. Sofía Arriaga")).toBe(true);
    for (const paso of ["enviado", "firmante_1", "firmante_2", "constancia"] as const) expect(store().avanzarFirma(id, paso)).toBe(true);

    const contratoId = store().formalizar(id)!;
    expect(sol(id).estatus).toBe("formalizada");
    const c = store().contratos.find((x) => x.id === contratoId)!;
    expect(c.contraparte).toBe("Prueba, S.A. de C.V.");
    expect(c.sello?.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(store().contratos).toHaveLength(9);
    expect(Object.keys(sol(id).etapas)).toEqual(expect.arrayContaining(["nueva", "en_analisis", "en_aprobacion", "aprobada", "en_firma", "formalizada"]));
  });

  it("regresa al solicitante y reenvía", () => {
    const s = store().solicitudes.find((x) => x.estatus === "en_analisis")!;
    expect(store().regresarASolicitante(s.id, "Falta la constancia fiscal", "Lic. Mariana Robles")).toBe(true);
    expect(sol(s.id).estatus).toBe("en_ajustes");
    expect(store().reenviar(s.id, { campos: { ...s.campos, rfc: "XAXX010101000" } }, "Ing. Alejandro Ríos Maldonado")).toBe(true);
    expect(sol(s.id).estatus).toBe("en_analisis");
    expect(sol(s.id).campos.rfc).toBe("XAXX010101000");
  });

  it("reasigna y confirma campos extraídos", () => {
    const s = store().solicitudes.find((x) => x.abogadoId === "ab-robles" && x.estatus === "nueva")!;
    expect(store().reasignar(s.id, "ab-nieto", "Lic. Mariana Robles")).toBe(true);
    expect(sol(s.id).abogadoId).toBe("ab-nieto");

    expect(store().confirmarCampo("arr-gym", "penalizacion", undefined, "Lic. Sofía Arriaga")).toBe(true);
    const pena = store().contratos.find((c) => c.id === "arr-gym")!.extraccion.find((x) => x.clave === "penalizacion")!;
    expect(pena.confirmado).toBe(true);
    store().confirmarCampo("arr-ens", "incremento", "4% anual fijo", "Lic. Sofía Arriaga");
    expect(store().contratos.find((c) => c.id === "arr-ens")!.extraccion.find((x) => x.clave === "incremento")!.valor).toBe("4% anual fijo");
  });

  it("presta y devuelve originales, e inicia renovaciones", () => {
    expect(store().registrarPrestamo("arr-gym", 2, "Notaría 23 de la CDMX", "2026-10-15T00:00:00.000Z", "Lic. Sofía Arriaga")).toBe(true);
    expect(store().registrarPrestamo("arr-gym", 2, "Otra", "2026-10-15T00:00:00.000Z", "Lic. Sofía Arriaga")).toBe(false);
    const tanto = () => store().contratos.find((c) => c.id === "arr-gym")!.custodia[1];
    expect(tanto().estatus).toBe("prestado");
    expect(store().registrarDevolucion("arr-gym", 2, "Lic. Sofía Arriaga")).toBe(true);
    expect(tanto().estatus).toBe("en_resguardo");
    expect(tanto().historialPrestamos[0].devuelto).toBeTruthy();

    const id = store().iniciarRenovacion("arr-ens", "Lic. Sofía Arriaga")!;
    expect(sol(id).renovacionDe).toBe("arr-ens");
    expect(sol(id).campos.razonSocial).toBe("Desarrollos Costa Pacífico, S.A. de C.V.");
    // Se precargan RFC, representante y renta; la nueva vigencia empieza al día siguiente del fin.
    expect(sol(id).campos.rfc).toBeTruthy();
    expect(sol(id).campos.representanteLegal).toBeTruthy();
    expect(sol(id).campos.rentaMensual).toBe(142500);
    expect(sol(id).campos.fechaInicio).toBe("2026-12-01");
  });

  it("reset restaura 24 solicitudes, 8 contratos y las extracciones pendientes", () => {
    store().confirmarCampo("arr-gym", "penalizacion", undefined, "x");
    store().reset();
    expect(store().solicitudes).toHaveLength(24);
    expect(store().contratos).toHaveLength(8);
    expect(store().contratos.find((c) => c.id === "arr-gym")!.extraccion.find((x) => x.clave === "penalizacion")!.confirmado).toBe(false);
  });
});
