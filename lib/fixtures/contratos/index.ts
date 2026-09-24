// Estado inicial de Contratos, relativo a `hoy`.
import { crearContratos } from "@/lib/fixtures/contratos/contratos";
import { crearSolicitudes } from "@/lib/fixtures/contratos/solicitudes";
import type { Contrato, Solicitud } from "@/lib/types/contratos";

export type DatosContratos = { solicitudes: Solicitud[]; contratos: Contrato[] };

export function crearDatosContratos(hoy: Date): DatosContratos {
  return { solicitudes: crearSolicitudes(hoy), contratos: crearContratos(hoy) };
}

export { ARCHIVO_CENTRAL } from "@/lib/fixtures/contratos/contratos";
export { ARRENDATARIA, CONTRATOS_CATALOGO, contratoCatalogoPorId } from "@/lib/fixtures/contratos/catalogo";
export { DOCUMENTOS_EJEMPLO, FORMULARIOS, TIPOS_CONTRATO, TIPOS_PERSONA } from "@/lib/fixtures/contratos/formularios";
export { ABOGADOS, SOLICITANTES, USUARIOS_CONTRATOS, abogadoPorId, solicitantePorId } from "@/lib/fixtures/contratos/personas";
export { contraparteDe, venceSla } from "@/lib/fixtures/contratos/solicitudes";
