// Corpus de referencia: 5 hoteles City Express select-service (lista según el estándar; se confirma con Norte 19).
import type { HotelCorpus } from "../../../types/desarrollo.ts";
import { altamira } from "./altamira.ts";
import { cancunAeropuerto } from "./cancun-aeropuerto.ts";
import { ensenada } from "./ensenada.ts";
import { guaymas } from "./guaymas.ts";
import { tijuanaFlorido } from "./tijuana-florido.ts";

export const CORPUS: HotelCorpus[] = [tijuanaFlorido, cancunAeropuerto, guaymas, ensenada, altamira];

export function hotelPorId(id: string | undefined) {
  return CORPUS.find((h) => h.id === id);
}
