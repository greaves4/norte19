// Proyecto City Express Ciudad Juárez al iniciar la demo: fase 1 con el gate de inputs bloqueado.
import { cuadroAnteproyecto, LLAVES_JUAREZ, NIVELES_JUAREZ } from "@/lib/fixtures/desarrollo/anteproyecto";
import { crearDecisiones, crearRiesgos } from "@/lib/fixtures/desarrollo/definicion";
import { crearEntregables } from "@/lib/fixtures/desarrollo/entregables";
import { crearInputs } from "@/lib/fixtures/desarrollo/inputs";
import { crearRequisitosMarca } from "@/lib/fixtures/desarrollo/marca";
import { ORIGEN_TERRENO, SUPERFICIE_TERRENO_M2 } from "@/lib/fixtures/desarrollo/terreno";
import type { Proyecto, ZonaProyecto } from "@/lib/types/desarrollo";

export { LLAVES_JUAREZ, promedioCorpus } from "@/lib/fixtures/desarrollo/anteproyecto";

function cuadroAreasJuarez(): ZonaProyecto[] {
  return cuadroAnteproyecto().map(({ zona, m2 }) => {
    return {
      zona,
      m2,
      m2Original: m2,
      fuentes: [{ tipo: "input", inputId: "anteproyecto", documento: "Anteproyecto arquitectónico Juárez", pagina: 1, clavePlano: "A-01 Cuadro de áreas" }],
    };
  });
}

export function crearProyecto(hoy: Date): Proyecto {
  return {
    id: "juarez",
    nombre: "City Express Ciudad Juárez",
    ciudad: "Ciudad Juárez, Chihuahua",
    segmento: "Select-service",
    llaves: LLAVES_JUAREZ,
    niveles: NIVELES_JUAREZ,
    terreno: { superficieM2: Math.round(SUPERFICIE_TERRENO_M2), direccion: "Blvd. Tomás Fernández 7815, Ciudad Juárez, Chih.", lat: ORIGEN_TERRENO.lat, lng: ORIGEN_TERRENO.lng },
    fase: 1,
    inputs: crearInputs(),
    definicion: { cuadroAreas: cuadroAreasJuarez(), marca: crearRequisitosMarca(), decisiones: crearDecisiones(), riesgos: crearRiesgos() },
    bibliotecaAgregada: [],
    paquete: null,
    factorActualizacion: 1.24,
    semaforo: crearEntregables(),
    bitacora: [
      { fecha: new Date(hoy.getTime() - 3 * 86_400_000).toISOString(), titulo: "Proyecto creado", actor: "Dirección de Desarrollo", descripcion: "128 llaves, select-service." },
      { fecha: new Date(hoy.getTime() - 3 * 86_400_000 + 3_600_000).toISOString(), titulo: "Gate de inputs detenido", actor: "Sistema", descripcion: "Falta Mecánica de suelos." },
    ],
  };
}
