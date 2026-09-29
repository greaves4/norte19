// Guía de uso del prototipo Contratos para la pantalla de Ayuda. Sigue el guion de validación (sección 7 del documento).
import type { GuiaPrototipo } from "@/lib/ayuda";

export const GUIA_CONTRATOS: GuiaPrototipo = {
  queEs:
    "Un sistema para pedir, analizar, aprobar, firmar y archivar contratos en un solo lugar, sin correos. Cada solicitud llega a Legal con su SLA en días hábiles y avanza por etapas hasta quedar en el repositorio, donde la IA muestra los datos clave de cada contrato y permite buscar en lenguaje natural.",
  simulado: [
    "El acceso con tu usuario de red (Active Directory) se reemplaza por la pantalla \"Entrar como…\" y el selector de perfil de la barra de demo.",
    "Los datos que la IA extrae de cada contrato ya vienen calculados; en producción se leen al cargar el documento.",
    "La búsqueda inteligente trabaja sobre 8 contratos de ejemplo (2 digitalizados por OCR). Las preguntas conocidas tienen respuesta preparada; las demás muestran \"Resultado por texto\".",
    "La firma electrónica es simulada: no hay proveedor real y la huella del sello es ficticia. Los avisos a otras personas se muestran como notificaciones en pantalla.",
    "Todo se guarda en este navegador. Otra computadora no ve tus cambios, y \"Reiniciar demo\" regresa los datos de ejemplo.",
  ],
  orden:
    "Recorre los perfiles en orden (Solicitante, Abogado, Directivo y Admin legal) en el mismo navegador, cambiando de perfil en la barra de demo, porque cada uno continúa lo que dejó el anterior.",
  perfiles: [
    {
      perfil: "solicitante",
      dispositivo: "Escritorio",
      resumen:
        "Persona de un área de Norte 19 (en la demo, Ing. Alejandro Ríos Maldonado, de Desarrollo) que necesita un contrato. Captura la solicitud, sube el expediente y sigue su estatus.",
      secciones: [
        { nombre: "Mis solicitudes", descripcion: "Tus solicitudes con estatus, abogado asignado e historial." },
        { nombre: "Nueva solicitud", descripcion: "Formulario en cuatro pasos que cambia según el tipo de persona y de contrato." },
      ],
      pasos: [
        {
          accion: "En \"Entrar como…\", elige Solicitante. Luego haz clic en \"Nueva solicitud\".",
          resultado: "Aparece el formulario con cuatro pasos: Tipo, Datos, Expediente y Resumen.",
        },
        {
          accion: "Elige \"Persona moral\" y \"Arrendamiento\" y haz clic en \"Siguiente\".",
          resultado: "El paso Datos pide razón social, RFC, representante legal, poder notarial, inmueble, renta y demás campos del arrendamiento.",
        },
        {
          accion: "Haz clic en \"Llenar con datos de ejemplo\".",
          resultado: "Los campos se llenan con los datos de Inmobiliaria Paseo del Bajío, S.A. de C.V.",
        },
        {
          accion: "Arriba del formulario cambia a \"Persona física\". Revisa los campos y regresa a \"Persona moral\".",
          resultado: "Los campos cambian en vivo: aparecen CURP y \"Aval u obligado solidario\" y desaparece el poder notarial. Un aviso indica cuántos datos capturados se conservaron.",
        },
        {
          accion: "Haz clic en \"Siguiente\" y en el Expediente haz clic en \"Cargar ejemplos en todos\".",
          resultado: "Se cargan los documentos de ejemplo y aparece \"Expediente completo\".",
        },
        {
          accion: "Quita el \"Poder notarial del representante\" con la X de su archivo y avanza al Resumen.",
          resultado: "Aparece \"Falta 1 documento obligatorio\" (\"No se puede enviar a Legal sin él.\") y el botón \"Enviar a Legal\" queda deshabilitado.",
        },
        {
          accion: "Regresa con \"Anterior\", haz clic en \"Usar ejemplo\" en el poder notarial y vuelve al Resumen.",
          resultado: "El Resumen indica que se asignará a Lic. Patricia Nieto, la abogada con menor carga, con SLA de análisis de 5 días hábiles.",
        },
        {
          accion: "Haz clic en \"Enviar a Legal\".",
          resultado: "Un aviso confirma \"Asignada a Lic. Patricia Nieto · SLA de análisis: 5 días hábiles\" y regresas a Mis solicitudes con la nueva solicitud en \"En Legal\".",
        },
        {
          accion: "En Mis solicitudes, haz clic en la solicitud que está en ajustes.",
          resultado: "Se abre su historial con el aviso \"Legal pidió ajustes\", el motivo y el botón \"Corregir y reenviar\".",
        },
      ],
    },
    {
      perfil: "abogado",
      dispositivo: "Escritorio",
      resumen:
        "Abogada del equipo legal (en la demo, Lic. Patricia Nieto). Recibe solicitudes por asignación automática, cuida su SLA, escribe el análisis jurídico y las envía a aprobación.",
      secciones: [
        { nombre: "Bandeja", descripcion: "Tablero por etapas con el reloj de SLA de cada solicitud, filtro Mis solicitudes / Todas y vista de lista." },
        { nombre: "Repositorio", descripcion: "Contratos formalizados con los datos extraídos por la IA." },
        { nombre: "Búsqueda", descripcion: "Preguntas en lenguaje natural sobre los contratos." },
      ],
      requisito:
        "Para ver la solicitud nueva, antes el Solicitante debe enviarla en este mismo navegador. Sin ella, la bandeja funciona con las solicitudes de ejemplo.",
      pasos: [
        {
          accion: "En la barra de demo cambia el perfil a Abogado.",
          resultado: "Se abre la \"Bandeja de Legal\" en \"Mis solicitudes\". El número junto a Bandeja son tus pendientes (4 si el Solicitante ya envió la suya) y \"Carga activa\" muestra la carga de cada abogado.",
        },
        {
          accion: "Revisa la columna \"En análisis\" y los relojes de las tarjetas.",
          resultado: "Cada columna se ordena por vencimiento: la tarjeta de arriba es la más urgente. El reloj dice \"Quedan N días\" en verde, ámbar o rojo.",
        },
        {
          accion: "Haz clic en \"+24 h\" en la barra de demo (abajo).",
          resultado: "Los relojes descuentan un día hábil y alguno cambia de color. Las horas de sábado y domingo no cuentan para el SLA.",
        },
        {
          accion: "En la columna \"Nuevas\", haz clic en Inmobiliaria Paseo del Bajío, S.A. de C.V. (la solicitud del Solicitante).",
          resultado: "Se abre el detalle con las pestañas Solicitud, Expediente, Análisis jurídico y Timeline.",
        },
        {
          accion: "En \"Análisis jurídico\", escribe bajo cada encabezado de la plantilla y haz clic en \"Guardar versión\".",
          resultado: "Un aviso confirma la versión 1 del análisis y la solicitud pasa a En análisis.",
        },
        {
          accion: "Haz clic en \"Enviar a aprobación\".",
          resultado: "Un aviso indica que la revisa Lic. Andrés Villaseñor y la solicitud queda en En aprobación.",
        },
        {
          accion: "Regresa a Bandeja. En otra tarjeta de \"Nuevas\" abre el menú de tres puntos y elige \"Reasignar\".",
          resultado: "Se abre \"Reasignar\" con cada abogado y sus solicitudes activas.",
        },
        {
          accion: "Elige a Lic. Mariana Robles en \"Nuevo abogado\" y haz clic en \"Reasignar\".",
          resultado: "Un aviso confirma que ahora la atiende ella (\"El SLA no se reinicia.\") y la carga activa se actualiza.",
        },
      ],
    },
    {
      perfil: "directivo",
      dispositivo: "Escritorio",
      resumen:
        "Director Jurídico (en la demo, Lic. Andrés Villaseñor). Lee el análisis del abogado y aprueba la solicitud o la rechaza a ajustes con un motivo.",
      secciones: [
        { nombre: "Aprobaciones", descripcion: "Solicitudes pendientes de tu decisión y las que ya resolviste." },
        { nombre: "Dashboard", descripcion: "Indicadores y gráficas del proceso, calculados con los datos de la demo." },
      ],
      requisito: "Para rechazar la solicitud recién llegada, antes el Abogado debe enviarla a aprobación en este mismo navegador.",
      pasos: [
        {
          accion: "En la barra de demo cambia el perfil a Directivo.",
          resultado: "Se abre Aprobaciones en la pestaña \"Pendientes\". La solicitud del Abogado aparece primero con la etiqueta \"Recién llegada\".",
        },
        {
          accion: "Haz clic en la solicitud recién llegada.",
          resultado: "Se abre un panel con el monto, el área solicitante y el análisis del abogado, con los botones \"Rechazar a ajustes\" y \"Aprobar\".",
        },
        {
          accion: "Haz clic en \"Rechazar a ajustes\", escribe el motivo (mínimo 10 caracteres) y confirma con \"Rechazar a ajustes\".",
          resultado: "Un aviso confirma \"Regresada a Lic. Patricia Nieto\": vuelve a En análisis con tu motivo, y la abogada la ve marcada como \"Rechazada a ajustes\".",
        },
        {
          accion: "Abre otra solicitud pendiente y haz clic en \"Aprobar\".",
          resultado: "Un aviso confirma la aprobación y que se notificó al abogado para enviarla a firma.",
        },
        {
          accion: "Abre la pestaña \"Resueltas por ti\".",
          resultado: "Aparecen tus dos decisiones con fecha, motivo y estatus actual.",
        },
        {
          accion: "Haz clic en Dashboard.",
          resultado: "Se ven indicadores como \"Cumplimiento de SLA\" y \"Tiempo promedio por etapa\", y gráficas que ya incluyen lo que hiciste en la sesión.",
        },
      ],
    },
    {
      perfil: "admin",
      dispositivo: "Escritorio",
      resumen:
        "Gerente Legal (en la demo, Lic. Sofía Arriaga). Envía a firma lo aprobado, administra el repositorio y la custodia de originales, y consulta los contratos con la búsqueda inteligente.",
      secciones: [
        { nombre: "Firma", descripcion: "Solicitudes aprobadas por enviar, firmas en curso y contratos formalizados." },
        { nombre: "Repositorio", descripcion: "Contratos formalizados con vigencia, datos extraídos por la IA y vencimientos próximos." },
        { nombre: "Búsqueda", descripcion: "Preguntas en lenguaje natural con respuesta y cláusula de origen." },
        { nombre: "Custodia", descripcion: "Ubicación y préstamos de los tres originales de cada contrato." },
        { nombre: "Dashboard", descripcion: "Indicadores y gráficas del proceso." },
        { nombre: "Configuración", descripcion: "Próximamente." },
      ],
      requisito:
        "Funciona con los datos de ejemplo. Si el Directivo aprobó una solicitud en este navegador, también aparece en Firma.",
      pasos: [
        {
          accion: "En la barra de demo cambia el perfil a Admin legal y haz clic en Firma.",
          resultado: "Se abre \"Firma electrónica\" con las solicitudes aprobadas primero, cada una con el botón \"Enviar a firma\".",
        },
        {
          accion: "Haz clic en \"Enviar a firma\" en una solicitud aprobada.",
          resultado: "Corre el \"Proceso de firma\" en 5 pasos, del envío al proveedor hasta Formalizado. \"Saltar\" lo acelera.",
        },
        {
          accion: "Espera a que termine.",
          resultado: "Aparece el aviso de contrato formalizado, el sello con folio y huella SHA-256 (simulada) y el botón \"Ver en repositorio\".",
        },
        {
          accion: "En Repositorio, busca \"Guaymas\" y abre el contrato de Inmobiliaria Bahía de San Carlos, S.A. de C.V.",
          resultado: "Se abre el PDF junto a \"Datos extraídos\", con el aviso \"1 campo pendiente de confirmar\". El fiador, C. Ramón Félix Salazar, aparece en \"Garantía / fiador\".",
        },
        {
          accion: "En \"Penalización por terminación anticipada\" haz clic en \"Ir a la cláusula\" y luego en \"Confirmar\".",
          resultado: "El PDF salta a la página 4 y, al confirmar, aparece \"Todos los campos confirmados\".",
        },
        {
          accion: "En Búsqueda, haz clic en la sugerencia \"¿Qué contratos tienen penalización por terminación anticipada?\".",
          resultado: "En modo \"Inteligente\" responde que 3 arrendamientos tienen penalización (Guaymas, Altamira y Puebla), con la cláusula y página de cada uno.",
        },
        {
          accion: "Cambia a \"Texto exacto\".",
          resultado: "Aparece \"Sin coincidencias\": ninguna cláusula tiene esas palabras tal cual, aunque el tema sí esté en los contratos.",
        },
        {
          accion: "En Custodia, busca \"Bahía de San Carlos\", haz clic en \"Registrar préstamo\" en el tanto 2/3, escribe la notaría en \"A quién\", elige la fecha en \"Hasta\" y confirma.",
          resultado: "Un aviso confirma \"Original 2/3 prestado\" y el original cambia a prestado. Arriba sigue la alerta del préstamo vencido de otro contrato.",
        },
        {
          accion: "Haz clic en Dashboard y revisa \"Cuellos de botella\".",
          resultado: "La gráfica muestra el tiempo promedio en cada columna del Kanban y nombra la más lenta. \"Ver tabla\" muestra los valores.",
        },
      ],
    },
  ],
};
