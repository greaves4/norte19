// Consultas "inteligentes" precomputadas sobre los 8 contratos de ejemplo. Las respuestas se escribieron
// contra el texto real de cada cláusula; la página y el fragmento se toman del índice en tiempo de ejecución.
// `claves`: grupos de raíces normalizadas (sin acentos, minúsculas); la pregunta debe tocar cada grupo.
export type FuenteConsulta = { contratoId: string; clausula: string; resaltar: string[] };

export type Consulta = {
  id: string;
  pregunta: string;
  variantes: string[];
  claves: string[][];
  respuesta: string;
  fuentes: FuenteConsulta[];
  // Consultas que dependen del reloj de demo (vencimientos): la respuesta y las fuentes se calculan al buscar.
  dinamica?: "vencen_6_meses";
};

export const CONSULTAS: Consulta[] = [
  {
    id: "penalizacion",
    pregunta: "¿Qué contratos tienen penalización por terminación anticipada?",
    variantes: ["contratos con pena por terminar antes", "cuánto cuesta salirse antes de un arrendamiento", "penalidad por rescindir anticipadamente", "indemnización por terminación anticipada"],
    claves: [["penaliz", "pena", "penalidad", "indemniz", "cuesta", "multa"], ["terminacion", "terminar", "salir", "anticip", "antes", "rescind"]],
    respuesta:
      "3 arrendamientos tienen penalización por terminación anticipada: Guaymas (6 meses de renta, dentro del plazo forzoso de 5 años), Altamira (4 meses de renta) y Puebla (3 meses de renta como indemnización). Ensenada y Mérida permiten terminar sin pena con 90 días de aviso.",
    fuentes: [
      { contratoId: "arr-gym", clausula: "DÉCIMA SEGUNDA", resaltar: ["pena convencional", "seis (6) meses"] },
      { contratoId: "arr-alt", clausula: "DÉCIMA SEGUNDA", resaltar: ["penalización por terminación anticipada", "cuatro (4) meses"] },
      { contratoId: "arr-pue", clausula: "DÉCIMA SEGUNDA", resaltar: ["indemnización", "tres (3) meses"] },
      { contratoId: "arr-ens", clausula: "DÉCIMA SEGUNDA", resaltar: ["sin responsabilidad ni pena alguna"] },
      { contratoId: "arr-mid", clausula: "DÉCIMA SEGUNDA", resaltar: ["sin responsabilidad ni pena alguna"] },
    ],
  },
  {
    id: "vencen",
    pregunta: "Arrendamientos que vencen en los próximos 6 meses",
    variantes: ["qué contratos de renta terminan pronto", "arrendamientos por vencer", "contratos que expiran este semestre", "vencimientos próximos de arrendamientos"],
    claves: [["vence", "vencen", "vencer", "vencimiento", "expira", "terminan", "caduc"], ["arrend", "renta", "contrato", "pronto", "proxim", "semestre", "meses"]],
    respuesta: "",
    fuentes: [],
    dinamica: "vencen_6_meses",
  },
  {
    id: "inpc",
    pregunta: "Contratos con incremento anual ligado al INPC",
    variantes: ["qué rentas se actualizan con la inflación", "incremento por índice de precios", "actualización anual por INPC", "contratos indexados a inflación"],
    claves: [["inpc", "inflacion", "indice", "index", "precios"], ["increment", "actualiz", "aument", "renta", "contrato", "anual", "ligad"]],
    respuesta:
      "4 contratos se actualizan cada año con el INPC: los arrendamientos de Guaymas, Altamira y Mérida, y el servicio de elevadores. Ensenada (4%) y Puebla (5%) tienen incremento fijo.",
    fuentes: [
      { contratoId: "arr-gym", clausula: "QUINTA", resaltar: ["Índice Nacional de Precios al Consumidor (INPC)"] },
      { contratoId: "arr-alt", clausula: "QUINTA", resaltar: ["INPC"] },
      { contratoId: "arr-mid", clausula: "QUINTA", resaltar: ["INPC"] },
      { contratoId: "srv-ele", clausula: "SÉPTIMA", resaltar: ["Índice Nacional de Precios al Consumidor (INPC)"] },
    ],
  },
  {
    id: "fiador-guaymas",
    pregunta: "¿Quién es el fiador en el contrato de Guaymas?",
    variantes: ["obligado solidario de Guaymas", "quién garantiza el arrendamiento de Guaymas", "fiador del hotel en Sonora"],
    claves: [["fiador", "obligado", "garantiz", "aval"], ["guaymas", "sonora", "san carlos"]],
    respuesta:
      "El fiador y obligado solidario en Guaymas es C. Ramón Félix Salazar. Garantiza con la casa habitación de Calle Miramar 22, San Carlos (folio real 44718), y renuncia a los beneficios de orden, excusión y división.",
    fuentes: [{ contratoId: "arr-gym", clausula: "DÉCIMA CUARTA", resaltar: ["C. Ramón Félix Salazar", "fiador y obligado solidario", "folio real 44718"] }],
  },
  {
    id: "fiadores",
    pregunta: "¿Qué contratos tienen fiador u obligado solidario?",
    variantes: ["arrendamientos con aval", "contratos con garantía personal", "lista de fiadores"],
    claves: [["fiador", "obligado", "aval", "garantia personal"]],
    respuesta: "2 arrendamientos tienen fiador y obligado solidario: Guaymas (C. Ramón Félix Salazar) y Ensenada (C. Laura Beltrán Osuna), ambos con un inmueble en garantía.",
    fuentes: [
      { contratoId: "arr-gym", clausula: "DÉCIMA CUARTA", resaltar: ["C. Ramón Félix Salazar", "fiador y obligado solidario"] },
      { contratoId: "arr-ens", clausula: "DÉCIMA CUARTA", resaltar: ["C. Laura Beltrán Osuna", "fiador y obligado solidario"] },
    ],
  },
  {
    id: "deposito",
    pregunta: "¿Cuánto es el depósito en garantía de cada arrendamiento?",
    variantes: ["depósitos de los contratos de renta", "cuántos meses de depósito dimos", "garantía en efectivo de los arrendamientos"],
    claves: [["deposito", "garantia en efectivo"], ["arrend", "renta", "contrato", "cada", "meses", "cuanto"]],
    respuesta: "Los depósitos van de 1 a 3 meses de renta: Mérida 3 meses; Guaymas, Ensenada y Puebla 2 meses; Altamira 1 mes. Todos se devuelven dentro de los 30 días siguientes a la entrega del inmueble.",
    fuentes: [
      { contratoId: "arr-mid", clausula: "SEXTA", resaltar: ["tres (3) meses"] },
      { contratoId: "arr-gym", clausula: "SEXTA", resaltar: ["dos (2) meses"] },
      { contratoId: "arr-ens", clausula: "SEXTA", resaltar: ["dos (2) meses"] },
      { contratoId: "arr-pue", clausula: "SEXTA", resaltar: ["dos (2) meses"] },
      { contratoId: "arr-alt", clausula: "SEXTA", resaltar: ["un (1) mes"] },
    ],
  },
  {
    id: "jurisdiccion",
    pregunta: "¿Qué jurisdicción aplica en cada contrato?",
    variantes: ["tribunales competentes de los contratos", "dónde se resuelven las controversias", "fuero pactado en los contratos"],
    claves: [["jurisdic", "tribunal", "fuero", "controversi", "juzgad"]],
    respuesta:
      "Los arrendamientos se someten a tribunales locales: Hermosillo (Guaymas), Tijuana (Ensenada), Tampico (Altamira), Mérida y Puebla. La obra de Querétaro, el servicio de elevadores y el NDA se someten a la Ciudad de México.",
    fuentes: [
      { contratoId: "arr-gym", clausula: "VIGÉSIMA", resaltar: ["Hermosillo, Sonora"] },
      { contratoId: "arr-ens", clausula: "VIGÉSIMA", resaltar: ["Tijuana"] },
      { contratoId: "arr-alt", clausula: "DÉCIMA NOVENA", resaltar: ["Tampico"] },
      { contratoId: "arr-mid", clausula: "DÉCIMA NOVENA", resaltar: ["Mérida"] },
      { contratoId: "arr-pue", clausula: "DÉCIMA NOVENA", resaltar: ["Puebla"] },
      { contratoId: "des-qro", clausula: "VIGÉSIMA PRIMERA", resaltar: ["Ciudad de México"] },
      { contratoId: "srv-ele", clausula: "VIGÉSIMA TERCERA", resaltar: ["Ciudad de México"] },
      { contratoId: "nda-sitios", clausula: "VIGÉSIMA TERCERA", resaltar: ["Ciudad de México"] },
    ],
  },
  {
    id: "penas-obra",
    pregunta: "¿Cuáles son las penas por atraso en la obra de Querétaro?",
    variantes: ["qué pasa si la constructora se atrasa", "penas convencionales de la obra", "multa por retraso en la construcción"],
    claves: [["pena", "multa", "penaliz", "qué pasa"], ["atras", "retras", "demora"], ["obra", "construc", "queretaro", "constructora"]],
    respuesta: "Constructora Bajío Integral paga 0.1% del precio por cada día natural de atraso imputable, con tope de 10% del precio. Se descuenta de las estimaciones o se cobra con la fianza de cumplimiento.",
    fuentes: [{ contratoId: "des-qro", clausula: "DÉCIMA PRIMERA", resaltar: ["cero punto uno por ciento (0.1%)", "diez por ciento (10%)"] }],
  },
  {
    id: "sla-elevadores",
    pregunta: "¿Qué niveles de servicio tiene el contrato de elevadores?",
    variantes: ["tiempos de respuesta del mantenimiento de elevadores", "SLA del proveedor de elevadores", "deducciones por falla de elevadores"],
    claves: [["nivel", "sla", "respuesta", "tiempo", "deduccion", "disponibilidad"], ["elevador", "ascensor", "verticales"]],
    respuesta:
      "Personas atrapadas: 45 minutos; equipo fuera de servicio: 4 horas; fallas menores: 24 horas. Disponibilidad mínima de 98% por equipo. Cada incumplimiento descuenta 5% de la mensualidad del hotel afectado, hasta 20% al mes.",
    fuentes: [{ contratoId: "srv-ele", clausula: "QUINTA", resaltar: ["cuarenta y cinco (45) minutos", "noventa y ocho por ciento (98%)", "cinco por ciento (5%)"] }],
  },
  {
    id: "no-competencia",
    pregunta: "¿El NDA con Meridiano incluye no competencia?",
    variantes: ["restricciones de la consultora en los sitios evaluados", "no competencia en el convenio de confidencialidad", "puede Meridiano asesorar a otros hoteleros"],
    claves: [["competencia", "compet", "asesor", "restric", "solicit"], ["nda", "confidencial", "meridiano", "consultora", "convenio"]],
    respuesta:
      "Sí, limitada: mientras el convenio esté vigente, Meridiano no puede asesorar a otros operadores hoteleros sobre los predios que Norte 19 le identificó por escrito. Además, ninguna parte puede contratar a personal de la otra que haya participado, durante la vigencia y 12 meses después.",
    fuentes: [
      { contratoId: "nda-sitios", clausula: "QUINTA", resaltar: ["se abstendrá de asesorar a terceros operadores hoteleros"] },
      { contratoId: "nda-sitios", clausula: "DÉCIMA SÉPTIMA", resaltar: ["doce (12) meses siguientes"] },
    ],
  },
];

export const PREGUNTAS_SUGERIDAS = [
  "¿Qué contratos tienen penalización por terminación anticipada?",
  "Arrendamientos que vencen en los próximos 6 meses",
  "Contratos con incremento anual ligado al INPC",
  "¿Quién es el fiador en el contrato de Guaymas?",
];
