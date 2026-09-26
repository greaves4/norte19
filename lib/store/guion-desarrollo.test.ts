// Guion de validación de Desarrollo (sección 7 del documento) recorrido sobre el store y las simulaciones.
import { beforeEach, describe, expect, it } from "vitest";
import { USUARIOS_DESARROLLO } from "@/lib/fixtures/desarrollo";
import { BIBLIOTECA } from "@/lib/fixtures/desarrollo/biblioteca";
import { crearHallazgos } from "@/lib/fixtures/desarrollo/hallazgos";
import { archivoPaquete, PAQUETE_EJEMPLO } from "@/lib/fixtures/desarrollo/paquete";
import { calcularScore } from "@/lib/sim/desarrollo/auditoria";
import { compararCuadro } from "@/lib/sim/desarrollo/benchmark";
import { filasExcel, generarCatalogos } from "@/lib/sim/desarrollo/catalogos";
import { puedeAuditar, verificar } from "@/lib/sim/desarrollo/completitud";
import { evaluarInputs } from "@/lib/sim/desarrollo/gates";
import { sugerencias } from "@/lib/sim/desarrollo/trazabilidad";
import { normalizar } from "@/lib/texto";
import { obligatoriosFaltantes, useDesarrollo } from "@/lib/store/desarrollo";

const store = () => useDesarrollo.getState();
const p = () => store().proyecto;
const direccion = USUARIOS_DESARROLLO.direccion.nombre;
const revisor = USUARIOS_DESARROLLO.revisor.nombre;
const proyectista = USUARIOS_DESARROLLO.proyectista.nombre;

beforeEach(() => store().reset());

describe("guion de validación de Desarrollo", () => {
  it("recorre Dirección → Revisor → Proyectista → Revisor y el reinicio regresa a fase 1", () => {
    // Dirección: el proyecto está detenido por la mecánica de suelos y lo resuelve.
    expect(p().fase).toBe(1);
    expect(evaluarInputs(p().inputs).nivel).toBe(1);
    store().cargarInput("mecanica_suelos", { nombre: "mecanica-suelos-juarez.pdf", src: "/fixtures/desarrollo/inputs/mecanica-suelos-juarez.pdf", tipo: "pdf" }, direccion);
    expect(obligatoriosFaltantes(p())).toHaveLength(0);
    expect(p().fase).toBe(2);

    // Dirección: la zona más desviada es áreas públicas; ajustarla cambia la desviación.
    const cuadro = compararCuadro(p().definicion.cuadroAreas, p().llaves);
    const peor = [...cuadro].sort((a, b) => Math.abs(b.desviacion) - Math.abs(a.desviacion))[0];
    expect(peor.zona).toBe("areas_publicas");
    store().ajustarCuadroAreas("areas_publicas", Math.round(peor.promedio * p().llaves), direccion);
    const ajustada = compararCuadro(p().definicion.cuadroAreas, p().llaves).find((f) => f.zona === "areas_publicas")!;
    expect(Math.abs(ajustada.desviacion)).toBeLessThan(Math.abs(peor.desviacion));

    // Revisor: confirma un riesgo, descarta otro y aprueba la definición.
    store().setEstatusRiesgo("R-01", "confirmado", revisor);
    store().setEstatusRiesgo("R-10", "descartado", revisor);
    expect(store().aprobarGateDefinicion(revisor, ["Cuadro de áreas revisado"])).toBe(true);
    expect(p().fase).toBe(4);

    // Proyectista: biblioteca de cancelería, paquete de ejemplo con faltantes y supuesto.
    const canceleria = BIBLIOTECA.filter((b) => normalizar(`${b.titulo} ${b.descripcion}`).includes("canceleria"));
    expect(canceleria.length).toBeGreaterThan(0);
    store().agregarABiblioteca(canceleria[0].id);
    expect(p().bibliotecaAgregada).toContain(canceleria[0].id);
    store().cargarPaquete(PAQUETE_EJEMPLO.map((n) => ({ nombre: archivoPaquete(n) })), proyectista);
    expect(verificar(p().paquete!).faltantesCriticos.map((f) => f.id)).toEqual(["MEM-ES", "IE-CARGAS"]);
    expect(puedeAuditar(p()).puede).toBe(false);
    store().continuarConSupuesto("Memoria estructural y cuadro de cargas llegan en la revisión 2.", proyectista);
    expect(puedeAuditar(p()).puede).toBe(true);

    // Proyectista: el catálogo eléctrico se exporta con encabezados, conceptos y total.
    const electrico = generarCatalogos(p().definicion.cuadroAreas, p().llaves, p().niveles, p().factorActualizacion).find((c) => c.id === "electrico")!;
    const filas = filasExcel(electrico);
    expect(filas.length).toBeGreaterThan(electrico.conceptos.length);
    expect(filas.flat().some((v) => typeof v === "number" && v > 0)).toBe(true);

    // Revisor: ejecuta la auditoría, descarta C-03 y el score sube.
    store().ejecutarAuditoria(crearHallazgos(), revisor);
    expect(p().fase).toBe(5);
    const antes = calcularScore(p().auditoria!.hallazgos).global;
    store().setEstatusHallazgo("C-03", "descartado", revisor, "El paso en trabe ya está en el detalle estructural.");
    expect(calcularScore(p().auditoria!.hallazgos).global).toBeGreaterThan(antes + 5);
    expect(sugerencias(p()).coordinacion.motivo).toContain("8 hallazgos");

    // Reiniciar demo: fase 1 y gate bloqueado.
    store().reset();
    expect(p().fase).toBe(1);
    expect(evaluarInputs(p().inputs).nivel).toBe(1);
    expect(p().auditoria).toBeUndefined();
  });
});
