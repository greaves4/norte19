// Proyecto City Express Ciudad Juárez al iniciar la demo: fase 1 con el gate de inputs bloqueado.
// El cuadro de áreas objetivo del anteproyecto se expresa contra el promedio del corpus para que las desviaciones
// del guion sean estables: áreas públicas −20% (la mayor), BOH +10% y estacionamiento +12% (ámbar).
import { CORPUS } from "@/lib/fixtures/desarrollo/corpus";
import { crearDecisiones, crearRiesgos } from "@/lib/fixtures/desarrollo/definicion";
import { crearEntregables } from "@/lib/fixtures/desarrollo/entregables";
import { crearInputs } from "@/lib/fixtures/desarrollo/inputs";
import { crearRequisitosMarca } from "@/lib/fixtures/desarrollo/marca";
import { ZONAS, type Proyecto, type ZonaId, type ZonaProyecto } from "@/lib/types/desarrollo";

export const LLAVES_JUAREZ = 128;

const FACTOR_ANTEPROYECTO: Record<ZonaId, number> = {
  habitaciones: 1.03,
  areas_publicas: 0.8,
  boh: 1.1,
  circulaciones: 0.97,
  estacionamiento: 1.12,
};

export function promedioCorpus(zona: ZonaId) {
  return CORPUS.reduce((t, h) => t + h.cuadroAreas.find((z) => z.zona === zona)!.m2PorLlave, 0) / CORPUS.length;
}

function cuadroAreasJuarez(): ZonaProyecto[] {
  return ZONAS.map((zona) => {
    const m2 = Math.round(promedioCorpus(zona) * FACTOR_ANTEPROYECTO[zona] * LLAVES_JUAREZ);
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
    niveles: 5,
    terreno: { superficieM2: 5480, direccion: "Blvd. Tomás Fernández 7815, Ciudad Juárez, Chih.", lat: 31.7196, lng: -106.4236 },
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
