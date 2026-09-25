// Contadores del panel "Estado del corpus" (resultado precomputado del procesamiento de los 5 hoteles).
import type { EstadoCorpus } from "../../../types/desarrollo.ts";

export const ESTADO_CORPUS: EstadoCorpus = {
  documentosProcesados: 1248,
  paginasOcr: 3412,
  planosDwg: 512,
  xrefResueltos: 486,
  duplicadosDetectados: 73,
  duplicadosDescartados: 71,
  campos: { alta: 2915, media: 412, baja: 96 },
};
