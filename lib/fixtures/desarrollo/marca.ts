// Checklist de 20 requisitos de marca para Juárez, con estatus precomputado y origen (manual de marca o inferido del corpus).
import type { EstatusMarca, Fuente, RequisitoMarca } from "@/lib/types/desarrollo";

const manual = (pagina: number): Fuente => ({ tipo: "input", inputId: "brand_standards", documento: "Brand standards City Express 2024", pagina });
const ante = (pagina: number, clavePlano: string): Fuente => ({ tipo: "input", inputId: "anteproyecto", documento: "Anteproyecto arquitectónico Juárez", pagina, clavePlano });
const corpus = (hotelId: string, disciplina: string, pagina: number): Fuente => ({ tipo: "corpus", hotelId, documento: `${hotelId}-${disciplina}`, pagina });

type Fila = [id: string, categoria: string, requisito: string, estatus: EstatusMarca, evidencia: string, origen: "manual" | "inferido", fuentes: Fuente[]];

const FILAS: Fila[] = [
  ["MK-01", "Habitación", "Habitación tipo de 24 a 28 m² con baño", "cumple", "Habitación tipo de 26.4 m² en A-02.", "manual", [manual(12), ante(2, "A-02")]],
  ["MK-02", "Habitación", "Escritorio de trabajo con contactos y USB al alcance", "cumple", "Mueble de trabajo indicado en la habitación tipo.", "manual", [manual(14), ante(2, "A-02")]],
  ["MK-03", "Habitación", "Aislamiento acústico entre habitaciones STC ≥ 50", "sin_dato", "El anteproyecto no especifica el muro divisorio.", "manual", [manual(15)]],
  ["MK-04", "Habitación", "Cortinas black-out en todas las habitaciones", "cumple", "Nota de especificación en A-02.", "manual", [manual(16), ante(2, "A-02")]],
  ["MK-05", "Baño", "Regadera con mezcladora termostática y cancel de cristal", "cumple", "Baño tipo con regadera de 90×120 cm.", "manual", [manual(18), ante(2, "A-02")]],
  ["MK-06", "Accesibilidad", "3% de habitaciones accesibles, mínimo 2", "desvia", "El anteproyecto muestra 2 accesibles; con 128 llaves se requieren 4.", "manual", [manual(22), ante(2, "A-02")]],
  ["MK-07", "Lobby", "Lobby con recepción visible desde el acceso y área de estar", "cumple", "Recepción frente al acceso en planta baja.", "manual", [manual(26), ante(1, "A-01")]],
  ["MK-08", "Lobby", "Business center integrado al lobby", "cumple", "Business center anexo al lobby.", "manual", [manual(27), ante(1, "A-01")]],
  ["MK-09", "Desayunador", "Desayunador para el 35% de la ocupación", "desvia", "Capacidad para 32 personas; al 35% de 128 llaves con 1.4 huéspedes por llave se requieren 63.", "manual", [manual(30), ante(1, "A-01")]],
  ["MK-10", "Desayunador", "Cocina de desayunos con acceso de servicio independiente", "cumple", "Cocina con puerta al pasillo de servicio.", "manual", [manual(31), ante(1, "A-01")]],
  ["MK-11", "Gimnasio", "Gimnasio de al menos 30 m² con vista al exterior", "cumple", "Gimnasio de 34 m² en planta baja.", "manual", [manual(34), ante(1, "A-01")]],
  ["MK-12", "Estacionamiento", "0.45 cajones por llave o lo que exija la norma local, lo que sea mayor", "cumple", "71 cajones (0.55 por llave) en el anteproyecto.", "manual", [manual(38), ante(1, "A-01")]],
  ["MK-13", "Estacionamiento", "Cajón de carga y descarga junto al andén de servicio", "cumple", "Andén en fachada posterior.", "inferido", [corpus("altamira", "arquitectonico", 3), ante(1, "A-01")]],
  ["MK-14", "Fachada", "Señalética de marca en fachada principal y pórtico de acceso", "cumple", "Pórtico y anuncio de azotea en fachada norte.", "manual", [manual(42), ante(3, "A-03")]],
  ["MK-15", "Fachada", "Ventanería con doble vidrio en climas extremos", "sin_dato", "El anteproyecto no define la ventanería.", "inferido", [corpus("ensenada", "arquitectonico", 3)]],
  ["MK-16", "BOH", "Almacén de blancos en cada nivel de habitaciones", "cumple", "Blancos junto al núcleo de servicio en cada nivel.", "inferido", [corpus("cancun-aeropuerto", "arquitectonico", 2), ante(2, "A-02")]],
  ["MK-17", "BOH", "Lavandería de blancos en planta baja con acceso de servicio", "cumple", "Lavandería de 58 m² en planta baja.", "inferido", [corpus("tijuana-florido", "arquitectonico", 1), ante(1, "A-01")]],
  ["MK-18", "Circulaciones", "Pasillos de habitaciones de 1.80 m libres", "desvia", "Pasillos de 1.60 m en niveles 2 a 5.", "manual", [manual(46), ante(2, "A-02")]],
  ["MK-19", "Sustentabilidad", "Iluminación LED y tarjetero ahorrador en habitaciones", "cumple", "Indicado en notas generales del anteproyecto.", "manual", [manual(50), ante(1, "A-01")]],
  ["MK-20", "Seguridad", "Control de acceso con tarjeta en elevadores y accesos de servicio", "cumple", "Indicado en notas de seguridad.", "manual", [manual(54), ante(1, "A-01")]],
];

export function crearRequisitosMarca(): RequisitoMarca[] {
  return FILAS.map(([id, categoria, requisito, estatus, evidencia, origen, fuentes]) => ({ id, categoria, requisito, estatus, evidencia, origen, fuentes }));
}
