// Extracciones precomputadas (generadas por scripts/contratos/generar-contratos.mts y revisadas a mano).
import type { CampoExtraido } from "@/lib/types/contratos";
import arrAlt from "./arr-alt.json";
import arrEns from "./arr-ens.json";
import arrGym from "./arr-gym.json";
import arrMid from "./arr-mid.json";
import arrPue from "./arr-pue.json";
import desQro from "./des-qro.json";
import ndaSitios from "./nda-sitios.json";
import srvEle from "./srv-ele.json";

export type Extraccion = { contratoId: string; pipeline: string; paginas: number; campos: CampoExtraido[] };

export const EXTRACCIONES = Object.fromEntries(
  [arrGym, arrEns, arrAlt, arrMid, arrPue, desQro, srvEle, ndaSitios].map((e) => [e.contratoId, e as Extraccion]),
) as Record<string, Extraccion>;
