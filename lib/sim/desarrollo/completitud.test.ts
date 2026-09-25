import { describe, expect, it } from "vitest";
import { archivoPaquete, PAQUETE_EJEMPLO } from "@/lib/fixtures/desarrollo/paquete";
import { ENTREGABLES_EJECUTIVO, identificar, puedeAuditar, verificar } from "@/lib/sim/desarrollo/completitud";

const paquete = PAQUETE_EJEMPLO.map((n) => ({ nombre: archivoPaquete(n) }));

describe("completitud del paquete ejecutivo", () => {
  it("el paquete de ejemplo tiene 60 archivos", () => {
    expect(PAQUETE_EJEMPLO).toHaveLength(60);
    expect(new Set(PAQUETE_EJEMPLO).size).toBe(60);
  });

  it("detecta los faltantes deliberados y los archivos no identificados", () => {
    const r = verificar(paquete);
    expect(r.faltantes.map((x) => x.id)).toEqual(["MEM-ES", "IE-CARGAS"]);
    expect(r.faltantesCriticos.map((x) => x.id)).toEqual(["MEM-ES", "IE-CARGAS"]);
    expect(r.noIdentificados).toEqual(["Escaneo_0045.pdf", "plano final v3 (copia).pdf", "Documento sin título.pdf"]);
    expect(r.porcentaje).toBeCloseTo((ENTREGABLES_EJECUTIVO.length - 2) / ENTREGABLES_EJECUTIVO.length, 5);
    expect(r.porDisciplina.find((d) => d.disciplina === "estructura")!.presentes).toBe(3);
  });

  it("identifica por clave sin importar mayúsculas ni extensión", () => {
    expect(identificar("mem-es memoria de cálculo.pdf")?.id).toBe("MEM-ES");
    expect(identificar("IE-002 Cuadro de cargas.dwg")?.id).toBe("IE-CARGAS");
    expect(identificar("modelo.ifc")?.id).toBe("BIM");
    expect(identificar("Fachada.pdf")).toBeNull();
  });

  it("gate de auditoría: bloquea con críticos faltantes salvo nota de supuesto", () => {
    expect(puedeAuditar({ fase: 2, paquete }).puede).toBe(false);
    expect(puedeAuditar({ fase: 4, paquete: null }).puede).toBe(false);
    expect(puedeAuditar({ fase: 4, paquete }).puede).toBe(false);
    expect(puedeAuditar({ fase: 4, paquete, notaSupuestoPaquete: "Memoria en revisión" }).puede).toBe(true);
    const completo = [...paquete, { nombre: "MEM-ES Memoria de cálculo.pdf" }, { nombre: "IE-002 Cuadro de cargas.pdf" }];
    expect(puedeAuditar({ fase: 4, paquete: completo }).puede).toBe(true);
  });
});
