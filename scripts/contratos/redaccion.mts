// Redacción de los 8 contratos de ejemplo (solo la usa scripts/contratos/generar-contratos.mts).
// Cada bloque con `ancla` marca dónde vive un dato que la "extracción por IA" reporta, para calcular su página real.
import { ARRENDATARIA, type ContratoCatalogo } from "../../lib/fixtures/contratos/catalogo.ts";

export type Bloque =
  | { tipo: "titulo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "parrafo"; texto: string; ancla?: string }
  | { tipo: "clausula"; numero: string; encabezado: string; parrafos: string[]; ancla?: string }
  | { tipo: "firmas"; izquierda: string[]; derecha: string[]; testigos?: boolean };

export type CampoRedactado = {
  clave: string;
  etiqueta: string;
  valor: string;
  confianza: "alta" | "media" | "baja";
  confirmado: boolean;
  ancla: string | null; // ancla del bloque donde está la cláusula; null si no aplica
  clausula: string | null;
};

// ---------------------------------------------------------------------------
// Utilidades de redacción

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function fechaLarga(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIÚN", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
const DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

function menorMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (r < 30) partes.push(UNIDADES[r]);
  else partes.push(DECENAS[Math.floor(r / 10)] + (r % 10 ? ` Y ${UNIDADES[r % 10]}` : ""));
  return partes.filter(Boolean).join(" ");
}

export function numeroLetras(n: number): string {
  if (n === 0) return "CERO";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? "UN MILLÓN" : `${menorMil(millones)} MILLONES`);
  if (miles) partes.push(miles === 1 ? "MIL" : `${menorMil(miles)} MIL`);
  if (resto) partes.push(menorMil(resto));
  return partes.join(" ");
}

export function pesos(monto: number) {
  const enteros = Math.floor(monto);
  const centavos = Math.round((monto - enteros) * 100);
  const cifra = monto.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const de = enteros % 1_000_000 === 0 && enteros > 0 ? " DE" : "";
  return `$${cifra} (${numeroLetras(enteros)}${de} PESOS ${String(centavos).padStart(2, "0")}/100 M.N.)`;
}

function mesesLetras(n: number) {
  return `${numeroLetras(n).toLowerCase().replace(/^un$/, "un")} (${n}) ${n === 1 ? "mes" : "meses"}`;
}

function aniosEntre(inicio: string, fin: string) {
  const [a1, m1] = inicio.split("-").map(Number);
  const [a2, m2] = fin.split("-").map(Number);
  return Math.round((a2 * 12 + m2 - (a1 * 12 + m1) + 1) / 12);
}

const ORDINALES = [
  "PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA", "SEXTA", "SÉPTIMA", "OCTAVA", "NOVENA", "DÉCIMA",
  "DÉCIMA PRIMERA", "DÉCIMA SEGUNDA", "DÉCIMA TERCERA", "DÉCIMA CUARTA", "DÉCIMA QUINTA", "DÉCIMA SEXTA",
  "DÉCIMA SÉPTIMA", "DÉCIMA OCTAVA", "DÉCIMA NOVENA", "VIGÉSIMA", "VIGÉSIMA PRIMERA", "VIGÉSIMA SEGUNDA",
  "VIGÉSIMA TERCERA", "VIGÉSIMA CUARTA", "VIGÉSIMA QUINTA",
];

type ClausulaDef = { encabezado: string; parrafos: string[]; ancla?: string };

// Numera las cláusulas en orden y devuelve también el mapa ancla → "DÉCIMA SEGUNDA".
function numerar(defs: (ClausulaDef | null)[]) {
  const clausulas: Bloque[] = [];
  const porAncla: Record<string, string> = {};
  defs.filter((d): d is ClausulaDef => d !== null).forEach((d, i) => {
    clausulas.push({ tipo: "clausula", numero: ORDINALES[i], encabezado: d.encabezado, parrafos: d.parrafos, ancla: d.ancla });
    if (d.ancla) porAncla[d.ancla] = ORDINALES[i];
  });
  return { clausulas, porAncla };
}

function firmasBasicas(c: ContratoCatalogo, rolNorte: string, rolContraparte: string): Bloque {
  return {
    tipo: "firmas",
    izquierda: [rolContraparte, c.contraparte.toUpperCase(), c.contraparteRepresentante, "Representante legal"],
    derecha: [rolNorte, ARRENDATARIA.razonSocial, ARRENDATARIA.representante, "Apoderado legal"],
    testigos: true,
  };
}

// ---------------------------------------------------------------------------
// Arrendamiento

function arrendamiento(c: ContratoCatalogo): { bloques: Bloque[]; campos: CampoRedactado[] } {
  const anios = aniosEntre(c.vigenciaInicio, c.vigenciaFin);
  const inpc = c.incremento?.tipo === "inpc";
  const fijo = c.incremento?.tipo === "fijo" ? c.incremento.porcentaje : null;
  const deposito = c.depositoMeses ?? 1;
  const pena = c.penalizacionMeses;

  // Redacción de la terminación anticipada: tres formas distintas para que la búsqueda exacta no las encuentre todas.
  const terminacion: string[] = pena
    ? c.id === "arr-gym"
      ? [
          `Las partes convienen en que el plazo forzoso de este contrato es de cinco (5) años contados a partir de la fecha de inicio de vigencia. Si "LA ARRENDATARIA" decide dar por terminado el presente contrato antes de que concluya dicho plazo forzoso, deberá notificarlo por escrito a "EL ARRENDADOR" con una anticipación mínima de ciento ochenta (180) días naturales.`,
          `En tal supuesto, "LA ARRENDATARIA" pagará a "EL ARRENDADOR", por concepto de pena convencional, una cantidad equivalente a ${mesesLetras(pena)} de la renta mensual vigente al momento de la terminación, sin perjuicio de cubrir las rentas devengadas hasta la fecha efectiva de desocupación del inmueble.`,
          `Concluido el plazo forzoso, "LA ARRENDATARIA" podrá terminar el contrato en cualquier momento mediante el mismo aviso, sin que resulte aplicable la pena convencional señalada en el párrafo anterior.`,
        ]
      : c.id === "arr-alt"
        ? [
            `En caso de que "LA ARRENDATARIA" dé por terminado este contrato antes de la fecha de vencimiento pactada en la cláusula de vigencia, deberá dar aviso por escrito con noventa (90) días naturales de anticipación y cubrirá una penalización por terminación anticipada equivalente a ${mesesLetras(pena)} de renta.`,
            `La penalización deberá pagarse en una sola exhibición dentro de los diez (10) días hábiles siguientes a la fecha efectiva de terminación, y podrá compensarse contra el depósito en garantía si así lo acuerdan las partes por escrito.`,
          ]
        : [
            `"LA ARRENDATARIA" podrá dar por terminado el presente contrato de manera anticipada mediante aviso por escrito entregado con ciento veinte (120) días naturales de anticipación. En este caso, "LA ARRENDATARIA" cubrirá a "EL ARRENDADOR" una indemnización equivalente a ${mesesLetras(pena)} de la renta mensual vigente, por concepto de daños y perjuicios.`,
            `No procederá la indemnización señalada si la terminación obedece a caso fortuito, fuerza mayor o a cualquier incumplimiento de "EL ARRENDADOR" que impida el uso normal del inmueble.`,
          ]
    : [
        `"LA ARRENDATARIA" podrá dar por terminado el presente contrato en cualquier momento, sin responsabilidad ni pena alguna a su cargo, mediante aviso por escrito entregado a "EL ARRENDADOR" con noventa (90) días naturales de anticipación a la fecha en que pretenda desocupar el inmueble.`,
        `En este supuesto, "LA ARRENDATARIA" únicamente estará obligada a cubrir las rentas devengadas hasta la fecha efectiva de entrega del inmueble y los servicios consumidos hasta esa fecha.`,
      ];

  const defs: (ClausulaDef | null)[] = [
    {
      encabezado: "OBJETO",
      ancla: "objeto",
      parrafos: [
        `Por medio del presente contrato, "EL ARRENDADOR" otorga en arrendamiento a "LA ARRENDATARIA", quien lo recibe a su entera satisfacción, el inmueble ubicado en ${c.inmueble} (en lo sucesivo "EL INMUEBLE"), cuyas medidas, colindancias y características se describen en el Anexo A del presente instrumento.`,
        `"EL INMUEBLE" se entrega libre de todo gravamen, limitación de dominio, ocupantes y adeudos por concepto de contribuciones, servicios o cuotas de cualquier naturaleza, con las instalaciones y el estado físico descritos en el acta de entrega que se agrega como Anexo B.`,
      ],
    },
    {
      encabezado: "DESTINO",
      parrafos: [
        `"LA ARRENDATARIA" destinará "EL INMUEBLE" exclusivamente a la construcción, instalación y operación de un hotel de la marca City Express, incluyendo las áreas de estacionamiento, servicios, oficinas administrativas y demás usos complementarios propios de la actividad hotelera.`,
        `"EL ARRENDADOR" declara que el uso de suelo de "EL INMUEBLE" es compatible con dicho destino y se obliga a coadyuvar en la obtención de las licencias, permisos y autorizaciones que "LA ARRENDATARIA" requiera para ese fin, sin costo adicional para esta última.`,
      ],
    },
    {
      encabezado: "VIGENCIA",
      ancla: "vigencia",
      parrafos: [
        `La vigencia del presente contrato será de ${numeroLetras(anios).toLowerCase()} (${anios}) años forzosos para "EL ARRENDADOR" y voluntarios para "LA ARRENDATARIA", contados a partir del ${fechaLarga(c.vigenciaInicio)} y hasta el ${fechaLarga(c.vigenciaFin)}.`,
        `Al término de la vigencia, "LA ARRENDATARIA" tendrá derecho a prorrogar el contrato por periodos adicionales de cinco (5) años, en las mismas condiciones aquí pactadas, siempre que notifique su intención por escrito con al menos ciento ochenta (180) días naturales de anticipación al vencimiento.`,
      ],
    },
    {
      encabezado: "RENTA",
      ancla: "renta",
      parrafos: [
        `"LA ARRENDATARIA" pagará a "EL ARRENDADOR" por concepto de renta mensual la cantidad de ${pesos(c.monto)}, más el Impuesto al Valor Agregado correspondiente.`,
        `La renta se pagará por mensualidades adelantadas dentro de los primeros cinco (5) días hábiles de cada mes, mediante transferencia electrónica de fondos a la cuenta bancaria que "EL ARRENDADOR" designe por escrito, contra la entrega del Comprobante Fiscal Digital por Internet (CFDI) que cumpla con los requisitos fiscales vigentes.`,
        `El pago tardío de la renta causará intereses moratorios a razón del uno por ciento (1%) mensual sobre saldos insolutos, calculados por días naturales transcurridos desde la fecha de vencimiento y hasta la fecha de pago total.`,
      ],
    },
    {
      encabezado: "INCREMENTO ANUAL DE LA RENTA",
      ancla: "incremento",
      parrafos: inpc
        ? [
            `La renta mensual se actualizará anualmente en cada aniversario de la fecha de inicio de vigencia, en la misma proporción en que se haya incrementado el Índice Nacional de Precios al Consumidor (INPC) publicado por el Instituto Nacional de Estadística y Geografía (INEGI) durante los doce (12) meses inmediatos anteriores.`,
            `En ningún caso la actualización podrá ser negativa. Si el INPC dejara de publicarse, las partes aplicarán el índice que lo sustituya oficialmente o, a falta de este, el que acuerden por escrito.`,
          ]
        : [
            `La renta mensual se incrementará anualmente en un ${fijo}% (${numeroLetras(fijo ?? 0).toLowerCase()} por ciento) fijo en cada aniversario de la fecha de inicio de vigencia, con independencia de la variación que registren los índices de precios durante el periodo.`,
            `El incremento se aplicará de manera automática, sin necesidad de requerimiento previo, a partir de la primera renta que se devengue después de cada aniversario.`,
          ],
    },
    {
      encabezado: "DEPÓSITO EN GARANTÍA",
      ancla: "deposito",
      parrafos: [
        `A la firma del presente contrato, "LA ARRENDATARIA" entrega a "EL ARRENDADOR" la cantidad equivalente a ${mesesLetras(deposito)} de renta, por concepto de depósito en garantía del cumplimiento de sus obligaciones, sin que dicho depósito pueda aplicarse al pago de rentas.`,
        `"EL ARRENDADOR" devolverá el depósito dentro de los treinta (30) días naturales siguientes a la desocupación y entrega de "EL INMUEBLE", una vez deducidas, en su caso, las cantidades que resulten a cargo de "LA ARRENDATARIA" conforme a este contrato, debidamente justificadas.`,
      ],
    },
    {
      encabezado: "OBRAS DE ADECUACIÓN Y PERIODO DE GRACIA",
      parrafos: [
        `"EL ARRENDADOR" autoriza a "LA ARRENDATARIA" a realizar en "EL INMUEBLE" las obras de construcción, adecuación y equipamiento necesarias para la operación del hotel, conforme al proyecto ejecutivo que esta le presente, sin que para ello requiera autorización adicional.`,
        `Las partes acuerdan un periodo de gracia de seis (6) meses contados a partir de la fecha de inicio de vigencia, durante el cual no se causará renta, a fin de que "LA ARRENDATARIA" ejecute dichas obras. Las mejoras que no puedan retirarse sin detrimento de "EL INMUEBLE" quedarán en beneficio de este al término del arrendamiento, sin costo para "EL ARRENDADOR".`,
      ],
    },
    {
      encabezado: "MANTENIMIENTO Y REPARACIONES",
      parrafos: [
        `"LA ARRENDATARIA" será responsable del mantenimiento ordinario de "EL INMUEBLE" y de las instalaciones que construya, conservándolos en buen estado de uso, salvo el desgaste natural por el transcurso del tiempo.`,
        `Corresponderán a "EL ARRENDADOR" las reparaciones estructurales y aquellas derivadas de vicios ocultos del terreno o de las construcciones existentes a la fecha de firma. Si "EL ARRENDADOR" no las realiza dentro de los quince (15) días naturales siguientes a que se le requieran por escrito, "LA ARRENDATARIA" podrá efectuarlas y descontar su costo de las rentas subsecuentes.`,
      ],
    },
    {
      encabezado: "CONTRIBUCIONES Y SERVICIOS",
      parrafos: [
        `El impuesto predial y las demás contribuciones que graven la propiedad de "EL INMUEBLE" serán a cargo de "EL ARRENDADOR". Los derechos por suministro de agua, energía eléctrica, gas, telefonía y demás servicios que "LA ARRENDATARIA" contrate para la operación del hotel serán a su cargo.`,
      ],
    },
    {
      encabezado: "SEGUROS",
      parrafos: [
        `"LA ARRENDATARIA" contratará y mantendrá vigente durante el arrendamiento un seguro de daños sobre las construcciones e instalaciones del hotel y un seguro de responsabilidad civil general con una suma asegurada no menor a $20,000,000.00 (VEINTE MILLONES DE PESOS 00/100 M.N.), en el que se designe a "EL ARRENDADOR" como beneficiario adicional respecto de los daños a "EL INMUEBLE".`,
      ],
    },
    {
      encabezado: "CESIÓN Y SUBARRENDAMIENTO",
      parrafos: [
        `"LA ARRENDATARIA" podrá ceder los derechos del presente contrato o subarrendar total o parcialmente "EL INMUEBLE" a sociedades que formen parte de su mismo grupo empresarial, o a la sociedad que resulte de una fusión o escisión, bastando para ello la notificación por escrito a "EL ARRENDADOR". Para cualquier otra cesión o subarrendamiento se requerirá el consentimiento previo y por escrito de "EL ARRENDADOR", que no podrá negarse sin causa justificada.`,
      ],
    },
    { encabezado: "TERMINACIÓN ANTICIPADA", ancla: "penalizacion", parrafos: terminacion },
    {
      encabezado: "RESCISIÓN",
      ancla: "causales",
      parrafos: [
        `Serán causas de rescisión del presente contrato, sin necesidad de declaración judicial, las siguientes: (a) la falta de pago de tres (3) o más mensualidades de renta consecutivas; (b) destinar "EL INMUEBLE" a un uso distinto del pactado; (c) el incumplimiento de cualquiera de las obligaciones esenciales de las partes que no sea subsanado dentro de los treinta (30) días naturales siguientes a la notificación por escrito de la parte afectada; y (d) la pérdida de la posesión de "EL INMUEBLE" por causas imputables a "EL ARRENDADOR".`,
        `La parte que incurra en causa de rescisión responderá de los daños y perjuicios ocasionados a la otra, en los términos de la legislación civil aplicable.`,
      ],
    },
    c.fiador
      ? {
          encabezado: "FIADOR Y OBLIGADO SOLIDARIO",
          ancla: "garantia",
          parrafos: [
            `Para garantizar el cumplimiento de las obligaciones de "EL ARRENDADOR" respecto de la posesión pacífica de "EL INMUEBLE", comparece a la firma del presente contrato ${c.fiador.nombre}, con domicilio en ${c.fiador.domicilio}, quien se constituye en fiador y obligado solidario, renunciando expresamente a los beneficios de orden, excusión y división.`,
            `El fiador señala como bien suficiente para responder de la fianza la ${c.fiador.inmuebleGarantia}, y se obliga a no enajenarlo ni gravarlo mientras subsistan las obligaciones garantizadas. La fianza subsistirá hasta que "EL INMUEBLE" sea entregado y se liquiden las obligaciones derivadas del contrato, aun cuando este se prorrogue.`,
          ],
        }
      : null,
    {
      encabezado: "DERECHO DE PREFERENCIA",
      parrafos: [
        `En caso de que "EL ARRENDADOR" decida enajenar "EL INMUEBLE" durante la vigencia del presente contrato, "LA ARRENDATARIA" gozará del derecho de preferencia por el tanto, para lo cual "EL ARRENDADOR" deberá notificarle por escrito las condiciones de la oferta. "LA ARRENDATARIA" contará con treinta (30) días naturales para manifestar su interés. En cualquier caso, el adquirente quedará obligado a respetar el arrendamiento en sus términos.`,
      ],
    },
    {
      encabezado: "CONFIDENCIALIDAD",
      parrafos: [
        `Las partes se obligan a mantener en estricta confidencialidad los términos económicos del presente contrato y la información que se proporcionen con motivo de su celebración y ejecución, salvo que su divulgación sea requerida por autoridad competente o por disposición legal.`,
      ],
    },
    {
      encabezado: "AVISOS Y NOTIFICACIONES",
      parrafos: [
        `Todos los avisos y notificaciones entre las partes deberán hacerse por escrito y entregarse en los domicilios señalados en las declaraciones del presente contrato, o por correo electrónico con acuse de recibo a las direcciones que las partes designen. Cualquier cambio de domicilio deberá notificarse con al menos diez (10) días naturales de anticipación.`,
      ],
    },
    {
      encabezado: "CASO FORTUITO Y FUERZA MAYOR",
      parrafos: [
        `Ninguna de las partes será responsable por el incumplimiento de sus obligaciones cuando este derive de caso fortuito o fuerza mayor debidamente acreditados. Si por dichas causas "LA ARRENDATARIA" se viera impedida total o parcialmente para usar "EL INMUEBLE" por más de treinta (30) días naturales, la renta se reducirá en la misma proporción durante el tiempo que dure el impedimento, conforme a lo dispuesto por la legislación civil aplicable.`,
      ],
    },
    {
      encabezado: "ANTICORRUPCIÓN Y CUMPLIMIENTO",
      parrafos: [
        `Las partes manifiestan que conocen y se obligan a cumplir con la Ley General de Responsabilidades Administrativas y demás disposiciones en materia de combate a la corrupción y prevención de operaciones con recursos de procedencia ilícita. El incumplimiento comprobado de esta cláusula será causa de rescisión sin responsabilidad para la parte afectada.`,
      ],
    },
    {
      encabezado: "LEY APLICABLE Y JURISDICCIÓN",
      ancla: "jurisdiccion",
      parrafos: [
        `Para la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes aplicables en el Estado de ${c.estado} y a la jurisdicción de los tribunales competentes de la ciudad de ${c.jurisdiccion}, renunciando expresamente a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.`,
      ],
    },
  ];
  const { clausulas, porAncla } = numerar(defs);

  const bloques: Bloque[] = [
    { tipo: "titulo", texto: `CONTRATO DE ARRENDAMIENTO QUE CELEBRAN, POR UNA PARTE, ${c.contraparte.toUpperCase()}, REPRESENTADA EN ESTE ACTO POR ${c.contraparteRepresentante.toUpperCase()}, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ "EL ARRENDADOR", Y POR LA OTRA, ${ARRENDATARIA.razonSocial}, REPRESENTADA EN ESTE ACTO POR ${ARRENDATARIA.representante.toUpperCase()}, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ "LA ARRENDATARIA", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:` },
    { tipo: "subtitulo", texto: "DECLARACIONES" },
    { tipo: "parrafo", texto: `I. Declara "EL ARRENDADOR", por conducto de su representante legal, que:` },
    { tipo: "parrafo", texto: `a) Es una sociedad mercantil legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos, según consta en la escritura pública correspondiente, debidamente inscrita en el Registro Público de Comercio de su domicilio.`, ancla: "partes" },
    { tipo: "parrafo", texto: `b) Su representante, ${c.contraparteRepresentante}, cuenta con las facultades suficientes para obligarla en los términos del presente contrato, mismas que no le han sido revocadas ni limitadas en forma alguna.` },
    { tipo: "parrafo", texto: `c) Es legítima propietaria de "EL INMUEBLE" que se describe en la cláusula PRIMERA, lo cual acredita con la escritura pública de adquisición inscrita en el Registro Público de la Propiedad, y que este se encuentra al corriente en el pago del impuesto predial y de los derechos por servicios.` },
    { tipo: "parrafo", texto: `d) Su Registro Federal de Contribuyentes es ${c.contraparteRfc} y su domicilio para efectos de este contrato es el ubicado en ${c.contraparteDomicilio}.` },
    { tipo: "parrafo", texto: `II. Declara "LA ARRENDATARIA", por conducto de su apoderado, que:` },
    { tipo: "parrafo", texto: `a) Es una sociedad anónima de capital variable constituida conforme a las leyes mexicanas, cuyo objeto social comprende la operación y administración de hoteles bajo la marca City Express y la celebración de toda clase de contratos relacionados con dicho objeto.` },
    { tipo: "parrafo", texto: `b) Su apoderado, ${ARRENDATARIA.representante}, cuenta con facultades suficientes para celebrar el presente contrato, las cuales no le han sido revocadas ni limitadas.` },
    { tipo: "parrafo", texto: `c) Su Registro Federal de Contribuyentes es ${ARRENDATARIA.rfc} y señala como domicilio para efectos de este contrato el ubicado en ${ARRENDATARIA.domicilio}.` },
    { tipo: "parrafo", texto: `d) Conoce el estado físico y jurídico de "EL INMUEBLE" y es su deseo tomarlo en arrendamiento para el destino que se señala en el presente contrato.` },
    { tipo: "parrafo", texto: `III. Declaran ambas partes que se reconocen la personalidad con la que comparecen y que en la celebración de este contrato no existe error, dolo, mala fe, lesión ni ningún otro vicio del consentimiento, por lo que convienen en sujetarse a las siguientes:` },
    { tipo: "subtitulo", texto: "CLÁUSULAS" },
    ...clausulas,
    { tipo: "parrafo", texto: `Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por duplicado en la ciudad de ${c.ciudad}, ${c.estado}, el ${fechaLarga(c.fechaFirma)}.` },
    {
      tipo: "firmas",
      izquierda: ['"EL ARRENDADOR"', c.contraparte.toUpperCase(), c.contraparteRepresentante, "Representante legal"],
      derecha: ['"LA ARRENDATARIA"', ARRENDATARIA.razonSocial, ARRENDATARIA.representante, "Apoderado legal"],
      testigos: !c.fiador,
    },
    ...(c.fiador
      ? [{ tipo: "firmas" as const, izquierda: ['"EL FIADOR Y OBLIGADO SOLIDARIO"', c.fiador.nombre, "Por su propio derecho", ""], derecha: ["TESTIGO", "Lic. Adriana Solís Medina", "", ""] }]
      : []),
  ];

  // Confianza por contrato: 1–2 campos quedan pendientes de revisión.
  const pendientes: Record<string, Partial<Record<string, "media" | "baja">>> = {
    "arr-gym": { penalizacion: "media" },
    "arr-ens": { incremento: "media" },
    "arr-alt": { renta: "baja", causales: "media" },
    "arr-mid": { deposito: "media" },
    "arr-pue": { penalizacion: "baja" },
  };
  const conf = (clave: string) => pendientes[c.id]?.[clave] ?? "alta";
  const campo = (clave: string, etiqueta: string, valor: string, ancla: string | null): CampoRedactado => ({
    clave,
    etiqueta,
    valor,
    confianza: conf(clave),
    confirmado: conf(clave) === "alta",
    ancla,
    clausula: ancla && porAncla[ancla] ? porAncla[ancla] : ancla === "partes" ? "DECLARACIONES" : null,
  });

  const campos: CampoRedactado[] = [
    campo("partes", "Partes", `Arrendador: ${c.contraparte} (${c.contraparteRfc}). Arrendataria: Norte 19 Operadora Hotelera, S.A. de C.V.`, "partes"),
    campo("objeto", "Objeto", `Arrendamiento de ${c.inmueble} para la operación de un hotel City Express.`, "objeto"),
    campo("vigencia", "Vigencia", `${anios} años: del ${fechaLarga(c.vigenciaInicio)} al ${fechaLarga(c.vigenciaFin)}, con prórroga de 5 años a solicitud de la arrendataria.`, "vigencia"),
    campo("renta", "Renta mensual", `${pesos(c.monto).split(" (")[0]} más IVA, pagadera en los primeros 5 días hábiles de cada mes.`, "renta"),
    campo(
      "incremento",
      "Incremento anual",
      inpc ? "Actualización anual conforme al INPC de los 12 meses anteriores; nunca negativa." : `${fijo}% fijo en cada aniversario.`,
      "incremento",
    ),
    campo("deposito", "Depósito en garantía", `${deposito} ${deposito === 1 ? "mes" : "meses"} de renta; se devuelve 30 días después de la entrega del inmueble.`, "deposito"),
    campo(
      "penalizacion",
      "Penalización por terminación anticipada",
      pena
        ? c.id === "arr-gym"
          ? `Pena convencional de ${pena} meses de renta si se termina dentro del plazo forzoso de 5 años; aviso de 180 días.`
          : c.id === "arr-alt"
            ? `${pena} meses de renta; aviso de 90 días.`
            : `Indemnización de ${pena} meses de renta; aviso de 120 días.`
        : "Sin penalización; aviso de 90 días.",
      "penalizacion",
    ),
    campo(
      "garantia",
      "Garantía / fiador",
      c.fiador ? `Fiador y obligado solidario: ${c.fiador.nombre}. Bien en garantía: ${c.fiador.inmuebleGarantia}.` : `Depósito en garantía de ${deposito} ${deposito === 1 ? "mes" : "meses"}; sin fiador.`,
      c.fiador ? "garantia" : "deposito",
    ),
    campo("causales", "Causales de rescisión", "Falta de pago de 3 rentas, uso distinto al pactado, incumplimiento no subsanado en 30 días, pérdida de la posesión.", "causales"),
    campo("jurisdiccion", "Jurisdicción", `Tribunales de ${c.jurisdiccion}; leyes del Estado de ${c.estado}.`, "jurisdiccion"),
  ];

  return { bloques, campos };
}

// ---------------------------------------------------------------------------
// Desarrollo y supervisión de obra

function desarrollo(c: ContratoCatalogo): { bloques: Bloque[]; campos: CampoRedactado[] } {
  const defs: ClausulaDef[] = [
    {
      encabezado: "OBJETO",
      ancla: "objeto",
      parrafos: [
        `"LA CONSTRUCTORA" se obliga a ejecutar para "LA DESARROLLADORA", bajo la modalidad de precio alzado y tiempo determinado, el desarrollo del proyecto ejecutivo, la construcción, el equipamiento básico y la supervisión técnica del hotel City Express Querétaro Norte, de ciento veintiocho (128) habitaciones, a ubicarse en ${c.inmueble} (en lo sucesivo "LA OBRA").`,
        `Los alcances, especificaciones, planos y catálogo de conceptos de "LA OBRA" se detallan en los Anexos 1 (Alcance), 2 (Especificaciones técnicas), 3 (Programa de obra) y 4 (Catálogo de conceptos), que firmados por las partes forman parte integrante del presente contrato.`,
      ],
    },
    {
      encabezado: "PRECIO",
      ancla: "renta",
      parrafos: [
        `El precio total y alzado de "LA OBRA" es de ${pesos(c.monto)}, más el Impuesto al Valor Agregado, e incluye materiales, mano de obra, herramienta, equipo, indirectos, utilidad, licencias a cargo de "LA CONSTRUCTORA" y todos los costos necesarios para la entrega de "LA OBRA" terminada y en condiciones de operación.`,
        `El precio no estará sujeto a ajuste por variación de costos, salvo que las partes acuerden por escrito modificaciones al alcance conforme a la cláusula de órdenes de cambio.`,
      ],
    },
    {
      encabezado: "FORMA DE PAGO",
      parrafos: [
        `"LA DESARROLLADORA" pagará un anticipo equivalente al treinta por ciento (30%) del precio dentro de los diez (10) días hábiles siguientes a la entrega de la fianza de anticipo. El saldo se pagará mediante estimaciones mensuales de avance de obra, validadas por la supervisión, dentro de los veinte (20) días naturales siguientes a su autorización y contra la entrega del CFDI correspondiente.`,
        `De cada estimación se amortizará el anticipo en la misma proporción y se retendrá un cinco por ciento (5%) como fondo de garantía, que se liberará a la recepción definitiva de "LA OBRA".`,
      ],
    },
    {
      encabezado: "PLAZO Y PROGRAMA DE OBRA",
      ancla: "vigencia",
      parrafos: [
        `"LA CONSTRUCTORA" iniciará los trabajos el ${fechaLarga(c.vigenciaInicio)} y se obliga a entregar "LA OBRA" terminada a más tardar el ${fechaLarga(c.vigenciaFin)}, conforme al programa de obra del Anexo 3. El presente contrato estará vigente hasta la recepción definitiva de "LA OBRA" y la liberación de las garantías.`,
        `Cualquier desviación mayor a quince (15) días naturales respecto del programa deberá ser notificada por escrito con un plan de recuperación que la supervisión deberá aprobar.`,
      ],
    },
    {
      encabezado: "GARANTÍAS",
      ancla: "garantia",
      parrafos: [
        `"LA CONSTRUCTORA" entregará, expedidas por institución afianzadora autorizada y a favor de "LA DESARROLLADORA": (a) fianza por el cien por ciento (100%) del anticipo; (b) fianza de cumplimiento por el diez por ciento (10%) del precio; y (c) fianza de vicios ocultos por el diez por ciento (10%) del precio, vigente durante doce (12) meses posteriores a la recepción definitiva.`,
      ],
    },
    {
      encabezado: "PROYECTO EJECUTIVO",
      parrafos: [
        `"LA CONSTRUCTORA" elaborará el proyecto ejecutivo arquitectónico, estructural y de instalaciones de "LA OBRA" con base en el proyecto conceptual y en los estándares de diseño de la marca City Express que "LA DESARROLLADORA" le entregue. El proyecto se presentará en tres etapas (anteproyecto, proyecto básico y proyecto ejecutivo) y cada una requerirá la aprobación por escrito de "LA DESARROLLADORA" antes de continuar con la siguiente.`,
        `Las observaciones de "LA DESARROLLADORA" a cada etapa deberán atenderse dentro de los diez (10) días hábiles siguientes a su notificación. Los retrasos atribuibles a la falta de aprobación oportuna por parte de "LA DESARROLLADORA" ampliarán el programa de obra en la misma proporción.`,
      ],
    },
    {
      encabezado: "LICENCIAS Y PERMISOS",
      parrafos: [
        `"LA CONSTRUCTORA" gestionará, a nombre de "LA DESARROLLADORA" y con cargo al precio, la licencia de construcción, el dictamen de uso de suelo, el visto bueno de protección civil, la factibilidad de servicios y las demás autorizaciones necesarias para ejecutar "LA OBRA". Los derechos y contribuciones que se causen por dichos trámites serán cubiertos por "LA DESARROLLADORA" contra la presentación de los recibos oficiales.`,
        `"LA CONSTRUCTORA" responderá de las multas y sanciones que se impongan por ejecutar trabajos sin las autorizaciones correspondientes o en contravención a ellas.`,
      ],
    },
    {
      encabezado: "SEGURIDAD EN OBRA Y MEDIO AMBIENTE",
      parrafos: [
        `"LA CONSTRUCTORA" implementará un programa de seguridad e higiene conforme a las normas oficiales mexicanas aplicables, dotará a su personal del equipo de protección necesario y mantendrá señalizada y delimitada el área de trabajo. Asimismo, dará cumplimiento a la normatividad ambiental en materia de residuos de la construcción, ruido y emisiones, y a las condicionantes de la autorización de impacto ambiental del proyecto.`,
      ],
    },
    {
      encabezado: "SUPERVISIÓN",
      parrafos: [
        `"LA DESARROLLADORA" designará un supervisor de obra que tendrá acceso irrestricto a "LA OBRA", validará estimaciones, llevará la bitácora y podrá ordenar la corrección de trabajos defectuosos. La supervisión no releva a "LA CONSTRUCTORA" de su responsabilidad por la correcta ejecución de los trabajos.`,
      ],
    },
    {
      encabezado: "ÓRDENES DE CAMBIO",
      parrafos: [
        `Cualquier modificación al alcance, especificaciones o programa deberá formalizarse mediante orden de cambio firmada por los representantes de ambas partes, en la que se establezcan el impacto en precio y plazo. Sin orden de cambio firmada no procederá pago adicional alguno.`,
      ],
    },
    {
      encabezado: "PENAS CONVENCIONALES POR ATRASO",
      ancla: "penalizacion",
      parrafos: [
        `Si "LA CONSTRUCTORA" no entrega "LA OBRA" en la fecha pactada por causas que le sean imputables, pagará a "LA DESARROLLADORA" una pena convencional equivalente al cero punto uno por ciento (0.1%) del precio por cada día natural de atraso, sin que el total de las penas exceda del diez por ciento (10%) del precio.`,
        `Las penas se descontarán de las estimaciones pendientes de pago o, en su caso, se harán efectivas con cargo a la fianza de cumplimiento.`,
      ],
    },
    {
      encabezado: "VICIOS OCULTOS Y CALIDAD",
      parrafos: [
        `"LA CONSTRUCTORA" responderá por los defectos de los trabajos, los vicios ocultos y cualquier otra responsabilidad en que incurra, en los términos señalados en el presente contrato y en la legislación aplicable, durante los doce (12) meses siguientes a la recepción definitiva, y durante diez (10) años por lo que hace a la estructura.`,
      ],
    },
    {
      encabezado: "PROPIEDAD INTELECTUAL",
      parrafos: [
        `Los planos, memorias de cálculo, renders y demás entregables del proyecto ejecutivo serán propiedad exclusiva de "LA DESARROLLADORA", quien podrá utilizarlos, modificarlos y reproducirlos para cualquier fin relacionado con el hotel, sin pago adicional alguno.`,
      ],
    },
    {
      encabezado: "SEGUROS",
      parrafos: [
        `"LA CONSTRUCTORA" contratará un seguro de obra civil en construcción (todo riesgo) por el valor total de "LA OBRA" y un seguro de responsabilidad civil por un monto no menor a $30,000,000.00 (TREINTA MILLONES DE PESOS 00/100 M.N.), vigentes hasta la recepción definitiva.`,
      ],
    },
    {
      encabezado: "RELACIONES LABORALES",
      parrafos: [
        `"LA CONSTRUCTORA", como patrón del personal que ocupe con motivo de los trabajos, será la única responsable de las obligaciones derivadas de las disposiciones en materia de trabajo y seguridad social, y se obliga a responder de las reclamaciones que sus trabajadores presenten en contra de "LA DESARROLLADORA". Asimismo, se obliga a cumplir con las disposiciones en materia de subcontratación de servicios especializados.`,
      ],
    },
    {
      encabezado: "SUSPENSIÓN Y TERMINACIÓN ANTICIPADA",
      parrafos: [
        `"LA DESARROLLADORA" podrá suspender temporalmente los trabajos o dar por terminado anticipadamente el contrato por razones de interés general del proyecto, mediante aviso por escrito con treinta (30) días naturales de anticipación. En ese caso pagará los trabajos ejecutados y los gastos no recuperables debidamente comprobados, sin que proceda indemnización adicional.`,
      ],
    },
    {
      encabezado: "RESCISIÓN",
      ancla: "causales",
      parrafos: [
        `"LA DESARROLLADORA" podrá rescindir administrativamente el contrato si "LA CONSTRUCTORA": (a) no inicia los trabajos en la fecha pactada; (b) suspende injustificadamente los trabajos por más de diez (10) días naturales; (c) acumula un atraso superior al quince por ciento (15%) del programa; (d) no repara los trabajos rechazados por la supervisión; o (e) subcontrata la totalidad de "LA OBRA" sin autorización.`,
      ],
    },
    {
      encabezado: "RECEPCIÓN DE LA OBRA",
      parrafos: [
        `Concluidos los trabajos, "LA CONSTRUCTORA" lo notificará por escrito y las partes realizarán un recorrido conjunto dentro de los cinco (5) días hábiles siguientes, del que se levantará acta de recepción provisional con la lista de pendientes. "LA CONSTRUCTORA" corregirá los pendientes dentro de los treinta (30) días naturales siguientes, tras lo cual se levantará el acta de recepción definitiva.`,
        `Con la recepción definitiva, "LA CONSTRUCTORA" entregará los planos actualizados conforme a obra, las memorias, los manuales de operación y mantenimiento de los equipos, las garantías de los fabricantes y la fianza de vicios ocultos.`,
      ],
    },
    {
      encabezado: "CONFIDENCIALIDAD",
      parrafos: [
        `"LA CONSTRUCTORA" mantendrá en confidencialidad la información del proyecto, los costos y la estrategia de expansión de "LA DESARROLLADORA" durante la vigencia del contrato y los tres (3) años siguientes a su terminación.`,
      ],
    },
    {
      encabezado: "AVISOS",
      parrafos: [
        `Los avisos entre las partes se harán por escrito en los domicilios señalados en las declaraciones o mediante la bitácora de obra, cuando se trate de asuntos técnicos relacionados con la ejecución de los trabajos.`,
      ],
    },
    {
      encabezado: "JURISDICCIÓN",
      ancla: "jurisdiccion",
      parrafos: [
        `Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ${c.jurisdiccion}, renunciando al fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.`,
      ],
    },
  ];
  const { clausulas, porAncla } = numerar(defs);
  const bloques: Bloque[] = [
    { tipo: "titulo", texto: `CONTRATO DE DESARROLLO, CONSTRUCCIÓN Y SUPERVISIÓN DE OBRA A PRECIO ALZADO Y TIEMPO DETERMINADO QUE CELEBRAN, POR UNA PARTE, ${ARRENDATARIA.razonSocial}, REPRESENTADA POR ${ARRENDATARIA.representante.toUpperCase()}, A QUIEN SE DENOMINARÁ "LA DESARROLLADORA", Y POR LA OTRA, ${c.contraparte.toUpperCase()}, REPRESENTADA POR ${c.contraparteRepresentante.toUpperCase()}, A QUIEN SE DENOMINARÁ "LA CONSTRUCTORA", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:` },
    { tipo: "subtitulo", texto: "DECLARACIONES" },
    { tipo: "parrafo", texto: `I. Declara "LA DESARROLLADORA" que es una sociedad mercantil constituida conforme a las leyes mexicanas, con Registro Federal de Contribuyentes ${ARRENDATARIA.rfc}, que tiene la posesión legítima del predio donde se ejecutará "LA OBRA" y que cuenta con los recursos para cubrir el precio pactado.`, ancla: "partes" },
    { tipo: "parrafo", texto: `II. Declara "LA CONSTRUCTORA" que es una sociedad mercantil constituida conforme a las leyes mexicanas, con Registro Federal de Contribuyentes ${c.contraparteRfc}, inscrita en el Registro de Prestadoras de Servicios Especializados u Obras Especializadas, con domicilio en ${c.contraparteDomicilio}, y que cuenta con la experiencia, capacidad técnica, personal y equipo necesarios para ejecutar "LA OBRA".` },
    { tipo: "parrafo", texto: `III. Declara "LA CONSTRUCTORA" que conoce el predio, el proyecto conceptual, las normas de diseño de la marca City Express y la reglamentación de construcción aplicable en el municipio de Querétaro, y que ha considerado todos esos factores en la integración de su precio.` },
    { tipo: "parrafo", texto: `IV. Declaran ambas partes que se reconocen la personalidad con que comparecen y que es su voluntad obligarse conforme a las siguientes:` },
    { tipo: "subtitulo", texto: "CLÁUSULAS" },
    ...clausulas,
    { tipo: "parrafo", texto: `Enteradas las partes del contenido y alcance del presente contrato, lo firman en la Ciudad de México el ${fechaLarga(c.fechaFirma)}.` },
    firmasBasicas(c, '"LA DESARROLLADORA"', '"LA CONSTRUCTORA"'),
  ];
  const confianza = (clave: string) => (clave === "penalizacion" ? "media" : "alta") as CampoRedactado["confianza"];
  const campo = (clave: string, etiqueta: string, valor: string, ancla: string | null): CampoRedactado => ({
    clave, etiqueta, valor, confianza: confianza(clave), confirmado: confianza(clave) === "alta", ancla,
    clausula: ancla && porAncla[ancla] ? porAncla[ancla] : ancla === "partes" ? "DECLARACIONES" : null,
  });
  const campos = [
    campo("partes", "Partes", `Desarrolladora: Norte 19 Operadora Hotelera, S.A. de C.V. Constructora: ${c.contraparte} (${c.contraparteRfc}).`, "partes"),
    campo("objeto", "Objeto", "Proyecto ejecutivo, construcción, equipamiento básico y supervisión del hotel City Express Querétaro Norte (128 habitaciones), a precio alzado.", "objeto"),
    campo("vigencia", "Vigencia / plazo", `Inicio ${fechaLarga(c.vigenciaInicio)}; entrega a más tardar el ${fechaLarga(c.vigenciaFin)}.`, "vigencia"),
    campo("renta", "Precio", `${pesos(c.monto).split(" (")[0]} más IVA, precio alzado sin ajuste de costos.`, "renta"),
    campo("incremento", "Incremento", "No aplica: precio alzado sin ajuste por variación de costos.", "renta"),
    campo("deposito", "Anticipo y retenciones", "Anticipo del 30% contra fianza; retención del 5% como fondo de garantía.", null),
    campo("penalizacion", "Penalización", "Penas por atraso: 0.1% del precio por día, tope 10%. La terminación anticipada por la desarrolladora no genera indemnización adicional.", "penalizacion"),
    campo("garantia", "Garantías", "Fianzas de anticipo (100%), cumplimiento (10%) y vicios ocultos (10%, 12 meses).", "garantia"),
    campo("causales", "Causales de rescisión", "No iniciar a tiempo, suspender más de 10 días, atraso mayor al 15%, no reparar trabajos rechazados, subcontratar sin autorización.", "causales"),
    campo("jurisdiccion", "Jurisdicción", `Tribunales de la ${c.jurisdiccion}.`, "jurisdiccion"),
  ];
  return { bloques, campos };
}

// ---------------------------------------------------------------------------
// Prestación de servicios

function servicios(c: ContratoCatalogo): { bloques: Bloque[]; campos: CampoRedactado[] } {
  const hoteles = ["Ciudad de México Santa Fe", "Ciudad de México Insurgentes", "Toluca", "Querétaro", "León", "Puebla", "Monterrey Universidad", "Saltillo", "Guadalajara Expo", "Aguascalientes", "Mérida", "Cancún Aeropuerto"];
  const defs: ClausulaDef[] = [
    {
      encabezado: "OBJETO",
      ancla: "objeto",
      parrafos: [
        `"EL PRESTADOR" se obliga a prestar a "EL CLIENTE" los servicios de mantenimiento preventivo y correctivo de los elevadores de pasajeros y de servicio instalados en los doce (12) hoteles que se enlistan en el Anexo A (en lo sucesivo "LOS SERVICIOS"), a saber: ${hoteles.map((h) => `City Express ${h}`).join(", ")}.`,
        `"LOS SERVICIOS" comprenden la inspección mensual, lubricación, ajuste y limpieza de maquinaria, cabinas y cubos; la atención de fallas; el suministro de refacciones de desgaste incluidas en el Anexo B, y la emisión de los dictámenes que exija la normatividad aplicable.`,
      ],
    },
    {
      encabezado: "MANTENIMIENTO PREVENTIVO",
      parrafos: [
        `El mantenimiento preventivo se realizará conforme al calendario anual que "EL PRESTADOR" entregue a cada hotel dentro de los primeros quince (15) días de vigencia, y comprenderá como mínimo: revisión y ajuste de frenos, cables, poleas y paracaídas; revisión de controladores y tableros; limpieza de fosos, cubos y techos de cabina; verificación de dispositivos de seguridad de puertas; y pruebas de nivelación y de funcionamiento de alarmas e intercomunicadores.`,
        `Las visitas se programarán en horarios de baja ocupación acordados con la gerencia de cada hotel, a fin de minimizar las molestias a los huéspedes, y ningún equipo podrá quedar fuera de servicio por más de cuatro (4) horas por mantenimiento preventivo.`,
      ],
    },
    {
      encabezado: "ATENCIÓN DE EMERGENCIAS",
      parrafos: [
        `"EL PRESTADOR" mantendrá un centro de atención telefónica disponible las veinticuatro (24) horas de los trescientos sesenta y cinco (365) días del año para recibir reportes de emergencia, y contará con técnicos de guardia en cada una de las ciudades donde se ubican los hoteles. Cada reporte generará un número de folio que se comunicará de inmediato al hotel.`,
      ],
    },
    {
      encabezado: "REPORTES Y BITÁCORA",
      parrafos: [
        `Por cada visita, "EL PRESTADOR" registrará en la bitácora del equipo los trabajos realizados, las refacciones sustituidas y las recomendaciones, y la hará firmar por el responsable de mantenimiento del hotel. Dentro de los cinco (5) primeros días de cada mes, entregará a "EL CLIENTE" un reporte consolidado con la disponibilidad de cada equipo, los reportes atendidos y sus tiempos de respuesta.`,
      ],
    },
    {
      encabezado: "NIVELES DE SERVICIO",
      parrafos: [
        `"EL PRESTADOR" atenderá los reportes de falla dentro de los plazos siguientes: (a) elevador con personas atrapadas, cuarenta y cinco (45) minutos; (b) elevador fuera de servicio, cuatro (4) horas; (c) fallas que no impiden la operación, veinticuatro (24) horas. La disponibilidad mensual de cada equipo no podrá ser inferior al noventa y ocho por ciento (98%).`,
        `El incumplimiento de los niveles de servicio dará lugar a una deducción del cinco por ciento (5%) de la contraprestación mensual del hotel afectado por cada evento, sin que las deducciones excedan del veinte por ciento (20%) mensual.`,
      ],
    },
    {
      encabezado: "CONTRAPRESTACIÓN",
      ancla: "renta",
      parrafos: [
        `"EL CLIENTE" pagará a "EL PRESTADOR" por "LOS SERVICIOS" una contraprestación mensual de ${pesos(c.monto)} más el Impuesto al Valor Agregado, por la totalidad de los hoteles, pagadera dentro de los treinta (30) días naturales siguientes a la recepción del CFDI y del reporte mensual de servicios.`,
        `Las refacciones no incluidas en el Anexo B y los trabajos de modernización se cotizarán por separado y requerirán orden de compra previa.`,
      ],
    },
    {
      encabezado: "ACTUALIZACIÓN DE LA CONTRAPRESTACIÓN",
      ancla: "incremento",
      parrafos: [
        `La contraprestación se actualizará en cada aniversario del contrato conforme a la variación del Índice Nacional de Precios al Consumidor (INPC) de los doce (12) meses anteriores.`,
      ],
    },
    {
      encabezado: "VIGENCIA",
      ancla: "vigencia",
      parrafos: [
        `El presente contrato tendrá una vigencia de tres (3) años, del ${fechaLarga(c.vigenciaInicio)} al ${fechaLarga(c.vigenciaFin)}. Salvo aviso en contrario de cualquiera de las partes con sesenta (60) días naturales de anticipación a su vencimiento, se renovará automáticamente por periodos sucesivos de un (1) año en las mismas condiciones.`,
      ],
    },
    {
      encabezado: "PERSONAL Y SEGURIDAD",
      parrafos: [
        `"EL PRESTADOR" asignará técnicos certificados, debidamente identificados y afiliados al régimen de seguridad social, que cumplirán con los reglamentos internos y las políticas de seguridad de los hoteles. "EL PRESTADOR" será el único patrón de dicho personal y responderá de cualquier reclamación laboral.`,
      ],
    },
    {
      encabezado: "GARANTÍA DE LOS TRABAJOS",
      ancla: "garantia",
      parrafos: [
        `"EL PRESTADOR" garantiza los trabajos de mantenimiento correctivo y las refacciones suministradas por un plazo de seis (6) meses. Para asegurar el cumplimiento del contrato entregará una fianza equivalente al diez por ciento (10%) del monto anual de la contraprestación.`,
      ],
    },
    {
      encabezado: "SEGUROS Y RESPONSABILIDAD",
      parrafos: [
        `"EL PRESTADOR" mantendrá vigente un seguro de responsabilidad civil con suma asegurada no menor a $10,000,000.00 (DIEZ MILLONES DE PESOS 00/100 M.N.) y responderá por los daños que cause a los huéspedes, al personal o a las instalaciones de "EL CLIENTE" con motivo de "LOS SERVICIOS".`,
      ],
    },
    {
      encabezado: "TERMINACIÓN ANTICIPADA",
      ancla: "penalizacion",
      parrafos: [
        `Cualquiera de las partes podrá dar por terminado el contrato sin responsabilidad mediante aviso por escrito con noventa (90) días naturales de anticipación, liquidándose únicamente los servicios prestados hasta la fecha efectiva de terminación.`,
      ],
    },
    {
      encabezado: "RESCISIÓN",
      ancla: "causales",
      parrafos: [
        `"EL CLIENTE" podrá rescindir el contrato sin responsabilidad si: (a) la disponibilidad de los equipos es inferior al noventa y cinco por ciento (95%) durante dos (2) meses consecutivos; (b) ocurre un incidente de seguridad imputable a "EL PRESTADOR"; o (c) "EL PRESTADOR" incumple cualquier otra obligación y no la subsana en quince (15) días naturales.`,
      ],
    },
    {
      encabezado: "REFACCIONES",
      parrafos: [
        `Las refacciones que "EL PRESTADOR" instale serán nuevas, originales o de calidad equivalente certificada por el fabricante del equipo, y contarán con la garantía señalada en este contrato. Las piezas retiradas quedarán a disposición de "EL CLIENTE" durante treinta (30) días naturales para su revisión, antes de su disposición final conforme a la normatividad ambiental.`,
        `Cuando una refacción no incluida en el Anexo B sea indispensable para restablecer el servicio de un equipo con personas o carga en riesgo, "EL PRESTADOR" podrá instalarla de inmediato y presentará la cotización para su autorización dentro de las veinticuatro (24) horas siguientes.`,
      ],
    },
    {
      encabezado: "TRABAJOS ADICIONALES Y MODERNIZACIONES",
      parrafos: [
        `Los trabajos que excedan el alcance de "LOS SERVICIOS", incluyendo modernizaciones de controladores, sustitución de máquinas o adecuaciones derivadas de cambios normativos, se cotizarán conforme a la lista de precios unitarios del Anexo C, vigente durante el primer año del contrato y actualizable conforme a la cláusula de actualización de la contraprestación. Ningún trabajo adicional podrá iniciarse sin orden de compra emitida por "EL CLIENTE".`,
        `"EL PRESTADOR" presentará anualmente un diagnóstico del estado de los equipos con las recomendaciones de modernización priorizadas por riesgo, a fin de que "EL CLIENTE" las considere en su presupuesto de inversión.`,
      ],
    },
    {
      encabezado: "OBLIGACIONES DE EL CLIENTE",
      parrafos: [
        `"EL CLIENTE" se obliga a: (a) permitir el acceso del personal técnico a los cuartos de máquinas, fosos y cubos en los horarios acordados; (b) designar en cada hotel a un responsable de mantenimiento como enlace; (c) no permitir que terceros no autorizados intervengan los equipos; y (d) informar a "EL PRESTADOR" cualquier falla o uso indebido de que tenga conocimiento.`,
      ],
    },
    {
      encabezado: "CASO FORTUITO Y FUERZA MAYOR",
      parrafos: [
        `Ninguna de las partes será responsable por el incumplimiento de sus obligaciones derivado de caso fortuito o fuerza mayor. Durante el tiempo que dure el evento no se computarán los niveles de servicio de los equipos afectados, y las partes acordarán las medidas necesarias para restablecer "LOS SERVICIOS" a la brevedad.`,
      ],
    },
    {
      encabezado: "DICTÁMENES E INSPECCIONES",
      parrafos: [
        `"EL PRESTADOR" emitirá anualmente, para cada equipo, el dictamen de funcionamiento y seguridad que exija la autoridad local, y acompañará al personal de "EL CLIENTE" en las inspecciones que realicen las autoridades de protección civil. Las observaciones derivadas de dichas inspecciones que correspondan al alcance de "LOS SERVICIOS" se atenderán sin costo adicional.`,
      ],
    },
    {
      encabezado: "CESIÓN Y SUBCONTRATACIÓN",
      parrafos: [
        `"EL PRESTADOR" no podrá ceder los derechos y obligaciones del presente contrato ni subcontratar la prestación de "LOS SERVICIOS" sin el consentimiento previo y por escrito de "EL CLIENTE". En caso de autorizarse la subcontratación, "EL PRESTADOR" seguirá siendo responsable frente a "EL CLIENTE" por la totalidad de las obligaciones.`,
      ],
    },
    {
      encabezado: "ANTICORRUPCIÓN",
      parrafos: [
        `"EL PRESTADOR" se obliga a no ofrecer, prometer ni entregar pagos, regalos o beneficios indebidos a empleados de "EL CLIENTE" o a servidores públicos con motivo de este contrato, y a cumplir con el código de ética para proveedores de "EL CLIENTE", que declara conocer. El incumplimiento de esta cláusula será causa de rescisión inmediata.`,
      ],
    },
    {
      encabezado: "AVISOS",
      parrafos: [
        `Los avisos entre las partes se harán por escrito en los domicilios señalados en las declaraciones. Los reportes operativos y de emergencia podrán hacerse por teléfono o por los medios electrónicos que las partes acuerden, debiendo confirmarse por escrito cuando impliquen deducciones o penalidades.`,
      ],
    },
    {
      encabezado: "CONFIDENCIALIDAD Y DATOS PERSONALES",
      parrafos: [
        `"EL PRESTADOR" tratará con confidencialidad la información de "EL CLIENTE" y los datos personales a los que tenga acceso, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, y los utilizará únicamente para prestar "LOS SERVICIOS".`,
      ],
    },
    {
      encabezado: "JURISDICCIÓN",
      ancla: "jurisdiccion",
      parrafos: [
        `Para todo lo relativo a la interpretación y cumplimiento del presente contrato, las partes se someten a los tribunales competentes de la ${c.jurisdiccion}, renunciando a cualquier otro fuero.`,
      ],
    },
  ];
  const { clausulas, porAncla } = numerar(defs);
  const bloques: Bloque[] = [
    { tipo: "titulo", texto: `CONTRATO DE PRESTACIÓN DE SERVICIOS DE MANTENIMIENTO DE ELEVADORES QUE CELEBRAN, POR UNA PARTE, ${ARRENDATARIA.razonSocial}, REPRESENTADA POR ${ARRENDATARIA.representante.toUpperCase()}, A QUIEN SE DENOMINARÁ "EL CLIENTE", Y POR LA OTRA, ${c.contraparte.toUpperCase()}, REPRESENTADA POR ${c.contraparteRepresentante.toUpperCase()}, A QUIEN SE DENOMINARÁ "EL PRESTADOR", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:` },
    { tipo: "subtitulo", texto: "DECLARACIONES" },
    { tipo: "parrafo", texto: `I. Declara "EL CLIENTE" que es una sociedad constituida conforme a las leyes mexicanas, con Registro Federal de Contribuyentes ${ARRENDATARIA.rfc}, que opera los hoteles señalados en el Anexo A y que requiere contratar los servicios objeto de este instrumento.`, ancla: "partes" },
    { tipo: "parrafo", texto: `II. Declara "EL PRESTADOR" que es una sociedad constituida conforme a las leyes mexicanas, con Registro Federal de Contribuyentes ${c.contraparteRfc} y domicilio en ${c.contraparteDomicilio}; que se encuentra inscrita en el padrón de prestadoras de servicios especializados, y que cuenta con personal técnico certificado por los fabricantes de los equipos instalados en los hoteles.` },
    { tipo: "parrafo", texto: `III. Declara "EL PRESTADOR" que ha inspeccionado los equipos de los doce (12) hoteles, conoce su estado actual y ha considerado dicha condición al fijar la contraprestación.` },
    { tipo: "parrafo", texto: `IV. Declaran las partes que se reconocen la personalidad con que comparecen y convienen en obligarse conforme a las siguientes:` },
    { tipo: "subtitulo", texto: "CLÁUSULAS" },
    ...clausulas,
    { tipo: "parrafo", texto: `Leído que fue el presente contrato, las partes lo firman en la Ciudad de México el ${fechaLarga(c.fechaFirma)}.` },
    firmasBasicas(c, '"EL CLIENTE"', '"EL PRESTADOR"'),
  ];
  const confianza = (clave: string) => (clave === "vigencia" ? "media" : "alta") as CampoRedactado["confianza"];
  const campo = (clave: string, etiqueta: string, valor: string, ancla: string | null): CampoRedactado => ({
    clave, etiqueta, valor, confianza: confianza(clave), confirmado: confianza(clave) === "alta", ancla,
    clausula: ancla && porAncla[ancla] ? porAncla[ancla] : ancla === "partes" ? "DECLARACIONES" : null,
  });
  const campos = [
    campo("partes", "Partes", `Cliente: Norte 19 Operadora Hotelera, S.A. de C.V. Prestador: ${c.contraparte} (${c.contraparteRfc}).`, "partes"),
    campo("objeto", "Objeto", "Mantenimiento preventivo y correctivo de elevadores en 12 hoteles City Express, con niveles de servicio y disponibilidad mínima del 98%.", "objeto"),
    campo("vigencia", "Vigencia", `3 años (${fechaLarga(c.vigenciaInicio)} al ${fechaLarga(c.vigenciaFin)}) con renovación automática anual salvo aviso con 60 días.`, "vigencia"),
    campo("renta", "Contraprestación mensual", `${pesos(c.monto).split(" (")[0]} más IVA por los 12 hoteles; pago a 30 días.`, "renta"),
    campo("incremento", "Incremento anual", "Actualización anual conforme al INPC.", "incremento"),
    campo("deposito", "Depósito", "No aplica.", null),
    campo("penalizacion", "Penalización por terminación anticipada", "Sin penalización: cualquiera de las partes termina con aviso de 90 días. Deducciones del 5% por incumplir niveles de servicio.", "penalizacion"),
    campo("garantia", "Garantía", "Trabajos y refacciones garantizados 6 meses; fianza de cumplimiento del 10% del monto anual.", "garantia"),
    campo("causales", "Causales de rescisión", "Disponibilidad menor a 95% dos meses seguidos, incidente de seguridad imputable, incumplimiento no subsanado en 15 días.", "causales"),
    campo("jurisdiccion", "Jurisdicción", `Tribunales de la ${c.jurisdiccion}.`, "jurisdiccion"),
  ];
  return { bloques, campos };
}

// ---------------------------------------------------------------------------
// Confidencialidad

function confidencialidad(c: ContratoCatalogo): { bloques: Bloque[]; campos: CampoRedactado[] } {
  const defs: ClausulaDef[] = [
    {
      encabezado: "OBJETO",
      ancla: "objeto",
      parrafos: [
        `El presente convenio tiene por objeto establecer los términos bajo los cuales "LA CONSULTORA" recibirá, resguardará y utilizará la Información Confidencial que "NORTE 19" le proporcione con motivo de la evaluación de sitios, mercados y oportunidades de inversión para el desarrollo de nuevos hoteles en las regiones del Bajío y el Noreste de la República Mexicana (en lo sucesivo "EL PROYECTO").`,
      ],
    },
    {
      encabezado: "DEFINICIONES",
      parrafos: [
        `Para efectos del presente convenio se entenderá por "Información Confidencial" toda la información técnica, financiera, comercial, jurídica, estratégica o de cualquier otra naturaleza, incluyendo de manera enunciativa mas no limitativa: ubicaciones de predios en evaluación, precios y condiciones de adquisición o arrendamiento, proyecciones de ocupación y tarifa, modelos financieros, planes de expansión, información de propietarios y socios, así como cualquier análisis, compilación o estudio que la incorpore, sea que se proporcione de forma escrita, verbal, electrónica o por cualquier otro medio.`,
        `Se entenderá por "Representantes" a los socios, empleados, asesores y subcontratistas de "LA CONSULTORA" que necesiten conocer la Información Confidencial para la ejecución de "EL PROYECTO".`,
      ],
    },
    {
      encabezado: "OBLIGACIONES DE CONFIDENCIALIDAD",
      parrafos: [
        `"LA CONSULTORA" se obliga a: (a) utilizar la Información Confidencial exclusivamente para los fines de "EL PROYECTO"; (b) no divulgarla a terceros sin el consentimiento previo y por escrito de "NORTE 19"; (c) compartirla únicamente con sus Representantes, quienes deberán estar sujetos a obligaciones de confidencialidad al menos tan estrictas como las aquí previstas; (d) protegerla con el mismo grado de cuidado que utiliza para su propia información sensible, y nunca con un grado menor al razonable; y (e) notificar de inmediato a "NORTE 19" cualquier uso o divulgación no autorizados de que tenga conocimiento.`,
        `"LA CONSULTORA" será responsable de cualquier incumplimiento a este convenio en que incurran sus Representantes.`,
      ],
    },
    {
      encabezado: "EXCEPCIONES",
      parrafos: [
        `No se considerará Información Confidencial aquella que: (a) sea del dominio público al momento de su divulgación o que posteriormente lo sea sin culpa de "LA CONSULTORA"; (b) obre en poder de "LA CONSULTORA" con anterioridad a su recepción, según conste en sus registros; (c) sea recibida legítimamente de un tercero sin obligación de confidencialidad; o (d) sea desarrollada de manera independiente por "LA CONSULTORA" sin utilizar la Información Confidencial.`,
        `Si "LA CONSULTORA" es requerida por autoridad competente para revelar Información Confidencial, lo notificará de inmediato a "NORTE 19" y revelará únicamente la porción estrictamente requerida.`,
      ],
    },
    {
      encabezado: "NO COMPETENCIA EN LOS SITIOS EVALUADOS",
      parrafos: [
        `Durante la vigencia del presente convenio, "LA CONSULTORA" se abstendrá de asesorar a terceros operadores hoteleros respecto de los predios específicos que "NORTE 19" le haya identificado por escrito como parte de "EL PROYECTO".`,
      ],
    },
    {
      encabezado: "PROPIEDAD DE LA INFORMACIÓN",
      parrafos: [
        `La Información Confidencial es y seguirá siendo propiedad exclusiva de "NORTE 19". Nada de lo dispuesto en este convenio se interpretará como el otorgamiento de licencia, derecho de propiedad intelectual o derecho de uso sobre dicha información, salvo el uso limitado aquí previsto.`,
      ],
    },
    {
      encabezado: "MEDIDAS DE SEGURIDAD",
      parrafos: [
        `"LA CONSULTORA" almacenará la Información Confidencial en sistemas con control de acceso por usuario, cifrado en reposo y en tránsito, y registro de accesos. No podrá almacenarla en dispositivos personales ni en servicios de almacenamiento en la nube que no hayan sido previamente aprobados por "NORTE 19". Los documentos impresos se resguardarán bajo llave y se destruirán mediante trituración cuando dejen de ser necesarios.`,
        `"NORTE 19" podrá solicitar, con aviso previo de cinco (5) días hábiles, evidencia razonable del cumplimiento de estas medidas, sin que ello implique acceso a información de otros clientes de "LA CONSULTORA".`,
      ],
    },
    {
      encabezado: "INFORMACIÓN DE TERCEROS Y DATOS PERSONALES",
      parrafos: [
        `La Información Confidencial podrá incluir información de propietarios de predios, socios potenciales y otros terceros. "LA CONSULTORA" tratará dicha información con el mismo cuidado y, cuando contenga datos personales, se sujetará a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares en su carácter de encargada, tratándolos únicamente conforme a las instrucciones de "NORTE 19".`,
      ],
    },
    {
      encabezado: "NO CONTACTO CON PROPIETARIOS",
      parrafos: [
        `Salvo instrucción expresa de "NORTE 19", "LA CONSULTORA" se abstendrá de contactar directamente a los propietarios, arrendadores o intermediarios de los predios identificados en la Información Confidencial, y de revelarles el interés de "NORTE 19" en ellos, a fin de no afectar las negociaciones en curso.`,
      ],
    },
    {
      encabezado: "DEVOLUCIÓN Y DESTRUCCIÓN",
      parrafos: [
        `A la terminación de "EL PROYECTO" o a solicitud de "NORTE 19", "LA CONSULTORA" devolverá o destruirá, dentro de los diez (10) días hábiles siguientes, toda la Información Confidencial y sus copias, y entregará constancia por escrito de su cumplimiento, firmada por su representante legal.`,
      ],
    },
    {
      encabezado: "VIGENCIA",
      ancla: "vigencia",
      parrafos: [
        `El presente convenio entrará en vigor en la fecha de su firma, el ${fechaLarga(c.vigenciaInicio)}, y permanecerá vigente durante tres (3) años, hasta el ${fechaLarga(c.vigenciaFin)}. Las obligaciones de confidencialidad subsistirán por tres (3) años adicionales contados a partir de la terminación del convenio, y de manera indefinida respecto de la información que constituya secreto industrial.`,
      ],
    },
    {
      encabezado: "PENA CONVENCIONAL",
      ancla: "penalizacion",
      parrafos: [
        `En caso de incumplimiento de las obligaciones previstas en este convenio, "LA CONSULTORA" pagará a "NORTE 19" una pena convencional de $2,500,000.00 (DOS MILLONES QUINIENTOS MIL PESOS 00/100 M.N.), sin perjuicio del derecho de "NORTE 19" de reclamar los daños y perjuicios adicionales que acredite y de ejercer las acciones que correspondan conforme a la Ley Federal de Protección a la Propiedad Industrial.`,
      ],
    },
    {
      encabezado: "RELACIÓN ENTRE LAS PARTES",
      parrafos: [
        `La celebración del presente convenio no obliga a las partes a celebrar ningún otro contrato ni crea entre ellas relación de sociedad, asociación, agencia o representación. Cualquier contratación de servicios profesionales relacionada con "EL PROYECTO" se regirá por el contrato específico que al efecto se celebre.`,
      ],
    },
    {
      encabezado: "CASO FORTUITO Y FUERZA MAYOR",
      parrafos: [
        `Si por caso fortuito o fuerza mayor la Información Confidencial se viera comprometida, "LA CONSULTORA" lo notificará a "NORTE 19" dentro de las veinticuatro (24) horas siguientes a que tenga conocimiento, describirá la información afectada y las medidas adoptadas para contener el incidente, y colaborará con "NORTE 19" en la mitigación de sus efectos. La pena convencional no será aplicable cuando "LA CONSULTORA" acredite que el incidente no le es imputable y que cumplió con las medidas de seguridad pactadas.`,
      ],
    },
    {
      encabezado: "COMUNICACIÓN DE LA INFORMACIÓN",
      parrafos: [
        `La Información Confidencial se compartirá a través de la sala de datos virtual que "NORTE 19" habilite para "EL PROYECTO", con usuarios nominativos para el personal autorizado de "LA CONSULTORA". Cualquier información entregada por otros medios deberá identificarse como confidencial al momento de su entrega o, si se proporciona de manera verbal, confirmarse por escrito dentro de los cinco (5) días hábiles siguientes.`,
      ],
    },
    {
      encabezado: "PUBLICIDAD",
      parrafos: [
        `"LA CONSULTORA" no podrá mencionar a "NORTE 19", sus marcas ni "EL PROYECTO" en materiales promocionales, listas de clientes, presentaciones, redes sociales o cualquier otro medio de difusión, sin la autorización previa y por escrito de "NORTE 19".`,
      ],
    },
    {
      encabezado: "NO SOLICITACIÓN DE PERSONAL",
      parrafos: [
        `Durante la vigencia de este convenio y los doce (12) meses siguientes a su terminación, ninguna de las partes podrá contratar, directamente o por interpósita persona, a empleados de la otra que hayan participado en "EL PROYECTO", salvo que estos respondan a una convocatoria pública de empleo.`,
      ],
    },
    {
      encabezado: "ENTREGABLES Y ANÁLISIS",
      parrafos: [
        `Los reportes, estudios de mercado, análisis de sitios y demás entregables que "LA CONSULTORA" elabore con base en la Información Confidencial se considerarán también Información Confidencial de "NORTE 19" y quedarán sujetos a las obligaciones de este convenio, aun cuando incorporen metodologías o información propia de "LA CONSULTORA".`,
      ],
    },
    {
      encabezado: "MEDIDAS PRECAUTORIAS",
      parrafos: [
        `"LA CONSULTORA" reconoce que el incumplimiento de este convenio podría causar a "NORTE 19" daños de difícil reparación, por lo que "NORTE 19" podrá solicitar ante la autoridad competente las medidas precautorias que estime necesarias para impedir o hacer cesar la divulgación o el uso indebido de la Información Confidencial, con independencia de la pena convencional y de las demás acciones que le correspondan.`,
      ],
    },
    {
      encabezado: "INTEGRIDAD DEL CONVENIO",
      parrafos: [
        `El presente convenio constituye el acuerdo total entre las partes respecto de su objeto y sustituye cualquier acuerdo previo, verbal o escrito, sobre la misma materia. Cualquier modificación deberá constar por escrito firmado por los representantes de ambas partes. Si alguna disposición fuera declarada inválida, las demás conservarán plena validez.`,
      ],
    },
    {
      encabezado: "CESIÓN",
      parrafos: [
        `"LA CONSULTORA" no podrá ceder los derechos ni las obligaciones derivados de este convenio sin el consentimiento previo y por escrito de "NORTE 19".`,
      ],
    },
    {
      encabezado: "AVISOS",
      parrafos: [
        `Los avisos entre las partes se realizarán por escrito en los domicilios señalados en las declaraciones o por correo electrónico con acuse de recibo a los contactos que cada parte designe.`,
      ],
    },
    {
      encabezado: "JURISDICCIÓN",
      ancla: "jurisdiccion",
      parrafos: [
        `Para la interpretación y cumplimiento de este convenio, las partes se someten a las leyes federales de los Estados Unidos Mexicanos y a la jurisdicción de los tribunales competentes de la ${c.jurisdiccion}, renunciando a cualquier otro fuero.`,
      ],
    },
  ];
  const { clausulas, porAncla } = numerar(defs);
  const bloques: Bloque[] = [
    { tipo: "titulo", texto: `CONVENIO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN QUE CELEBRAN, POR UNA PARTE, ${ARRENDATARIA.razonSocial}, REPRESENTADA POR ${ARRENDATARIA.representante.toUpperCase()}, A QUIEN SE DENOMINARÁ "NORTE 19", Y POR LA OTRA, ${c.contraparte.toUpperCase()}, REPRESENTADA POR ${c.contraparteRepresentante.toUpperCase()}, A QUIEN SE DENOMINARÁ "LA CONSULTORA", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:` },
    { tipo: "subtitulo", texto: "DECLARACIONES" },
    { tipo: "parrafo", texto: `I. Declara "NORTE 19" que es una sociedad constituida conforme a las leyes mexicanas, con Registro Federal de Contribuyentes ${ARRENDATARIA.rfc}, que opera hoteles bajo la marca City Express y que se encuentra evaluando oportunidades de expansión en diversas ciudades del país.`, ancla: "partes" },
    { tipo: "parrafo", texto: `II. Declara "LA CONSULTORA" que es una sociedad civil constituida conforme a las leyes mexicanas, con Registro Federal de Contribuyentes ${c.contraparteRfc} y domicilio en ${c.contraparteDomicilio}, dedicada a la consultoría inmobiliaria, estudios de mercado y evaluación de sitios para proyectos de hospitalidad.` },
    { tipo: "parrafo", texto: `III. Declara "LA CONSULTORA" que para prestar sus servicios en relación con "EL PROYECTO" requiere tener acceso a información sensible y estratégica de "NORTE 19", cuya divulgación podría causarle daños y perjuicios de difícil reparación.` },
    { tipo: "parrafo", texto: `IV. Declaran ambas partes que se reconocen la personalidad con que comparecen, que actúan de buena fe y que es su voluntad celebrar el presente convenio, al tenor de las siguientes:` },
    { tipo: "subtitulo", texto: "CLÁUSULAS" },
    ...clausulas,
    { tipo: "parrafo", texto: `Leído que fue el presente convenio, las partes lo firman en la ciudad de ${c.ciudad}, ${c.estado}, el ${fechaLarga(c.fechaFirma)}.` },
    firmasBasicas(c, '"NORTE 19"', '"LA CONSULTORA"'),
  ];
  const confianza = (clave: string) => (clave === "vigencia" ? "media" : "alta") as CampoRedactado["confianza"];
  const campo = (clave: string, etiqueta: string, valor: string, ancla: string | null): CampoRedactado => ({
    clave, etiqueta, valor, confianza: confianza(clave), confirmado: confianza(clave) === "alta", ancla,
    clausula: ancla && porAncla[ancla] ? porAncla[ancla] : ancla === "partes" ? "DECLARACIONES" : null,
  });
  const campos = [
    campo("partes", "Partes", `Norte 19 Operadora Hotelera, S.A. de C.V. y ${c.contraparte} (${c.contraparteRfc}).`, "partes"),
    campo("objeto", "Objeto", "Confidencialidad de la información para la evaluación de sitios de nuevos hoteles en el Bajío y el Noreste.", "objeto"),
    campo("vigencia", "Vigencia", `3 años (${fechaLarga(c.vigenciaInicio)} al ${fechaLarga(c.vigenciaFin)}); obligaciones subsisten 3 años más tras la terminación.`, "vigencia"),
    campo("renta", "Contraprestación", "No aplica: convenio sin contraprestación.", null),
    campo("incremento", "Incremento", "No aplica.", null),
    campo("deposito", "Depósito", "No aplica.", null),
    campo("penalizacion", "Penalización", "Pena convencional de $2,500,000.00 por incumplimiento de confidencialidad, más daños y perjuicios. Sin penalización por terminación anticipada.", "penalizacion"),
    campo("garantia", "Garantía", "No aplica.", null),
    campo("causales", "Causales de rescisión", "No se pactan causales específicas; el incumplimiento genera la pena convencional.", null),
    campo("jurisdiccion", "Jurisdicción", `Tribunales de la ${c.jurisdiccion}; leyes federales.`, "jurisdiccion"),
  ];
  return { bloques, campos };
}

export function redactar(c: ContratoCatalogo) {
  switch (c.tipo) {
    case "arrendamiento":
      return arrendamiento(c);
    case "desarrollo":
      return desarrollo(c);
    case "servicios":
      return servicios(c);
    case "confidencialidad":
      return confidencialidad(c);
  }
}
