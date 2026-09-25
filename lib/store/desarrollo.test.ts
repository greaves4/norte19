import { beforeEach, describe, expect, it } from "vitest";
import { obligatoriosFaltantes, useDesarrollo } from "@/lib/store/desarrollo";

const store = () => useDesarrollo.getState();
const p = () => store().proyecto;
const PDF = { nombre: "mecanica-suelos-juarez.pdf", src: "/fixtures/desarrollo/inputs/mecanica-suelos-juarez.pdf", tipo: "pdf" as const };

beforeEach(() => store().reset());

describe("store de Desarrollo", () => {
  it("el gate de inputs se libera al cargar la mecánica de suelos y se cierra si se retira", () => {
    expect(obligatoriosFaltantes(p()).map((i) => i.id)).toEqual(["mecanica_suelos"]);
    store().cargarInput("mecanica_suelos", PDF, "Arq. Lorena Esquivel");
    expect(p().fase).toBe(2);
    expect(p().bitacora.at(-1)!.titulo).toBe("Gate de inputs liberado");
    store().cargarInput("mecanica_suelos", null, "Arq. Lorena Esquivel");
    expect(p().fase).toBe(1);
  });

  it("no aprueba la definición con el gate de inputs detenido; sí después, y pasa a fase 4 con acta", () => {
    expect(store().aprobarGateDefinicion("Ing. Héctor Garza", [])).toBe(false);
    store().cargarInput("mecanica_suelos", PDF, "x");
    expect(store().aprobarGateDefinicion("Ing. Héctor Garza", ["Cuadro de áreas revisado"])).toBe(true);
    expect(p().fase).toBe(4);
    expect(p().definicion.acta?.aprobadoPor).toBe("Ing. Héctor Garza");
  });

  it("ajusta el cuadro de áreas conservando el valor original", () => {
    const antes = p().definicion.cuadroAreas.find((z) => z.zona === "areas_publicas")!;
    store().ajustarCuadroAreas("areas_publicas", antes.m2 + 100, "x");
    const despues = p().definicion.cuadroAreas.find((z) => z.zona === "areas_publicas")!;
    expect(despues.m2).toBe(antes.m2 + 100);
    expect(despues.m2Original).toBe(antes.m2);
  });

  it("riesgos, marca, biblioteca, paquete y semáforo", () => {
    store().setEstatusRiesgo("R-01", "confirmado", "x");
    store().setEstatusRiesgo("R-10", "descartado", "x");
    expect(p().definicion.riesgos.find((r) => r.id === "R-01")!.estatus).toBe("confirmado");
    store().setEstatusMarca("MK-03", "cumple", "x");
    expect(p().definicion.marca.find((m) => m.id === "MK-03")!.estatus).toBe("cumple");
    store().agregarABiblioteca("BIB-01");
    store().agregarABiblioteca("BIB-01");
    expect(p().bibliotecaAgregada).toEqual(["BIB-01"]);
    store().cargarPaquete([{ nombre: "100-AQ-101 Planta baja.pdf" }], "x");
    expect(p().paquete).toHaveLength(1);
    store().calificarEntregable("capex", "verde", "x");
    expect(p().semaforo.find((e) => e.id === "capex")!.semaforo).toBe("verde");
  });

  it("auditoría: guarda hallazgos pendientes y permite descartarlos con motivo", () => {
    store().ejecutarAuditoria(
      [{ id: "C-03", rubro: "coordinacion", disciplina: "HVAC", nivel: 2, descripcion: "x", severidad: "critico", impacto: ["costo"], accion: "x", responsable: "x", prioridad: "alta", estatus: "confirmado" }],
      "Ing. Héctor Garza",
    );
    expect(p().fase).toBe(5);
    expect(p().auditoria!.hallazgos[0].estatus).toBe("pendiente");
    store().setEstatusHallazgo("C-03", "descartado", "Ing. Héctor Garza", "Ya resuelto en la revisión 2");
    expect(p().auditoria!.hallazgos[0]).toMatchObject({ estatus: "descartado", motivo: "Ya resuelto en la revisión 2" });
  });

  it("reset deja el proyecto en fase 1 con el gate bloqueado", () => {
    store().cargarInput("mecanica_suelos", PDF, "x");
    store().reset();
    expect(p().fase).toBe(1);
    expect(obligatoriosFaltantes(p())).toHaveLength(1);
  });
});
