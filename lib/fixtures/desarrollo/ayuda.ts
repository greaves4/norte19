// Guía de la pantalla de Ayuda de Desarrollo hotelero (/desarrollo/ayuda). Sigue el guion de validación (sección 7 del documento).
import type { GuiaPrototipo } from "@/lib/ayuda";

export const GUIA_DESARROLLO: GuiaPrototipo = {
  queEs:
    "Asistente para el proyecto ejecutivo de un hotel nuevo (City Express Ciudad Juárez, 128 llaves) apoyado en un corpus de 5 hoteles City Express. Detiene el proceso si faltan inputs, arma la Fase de Definición con fuentes (cuadro de áreas, marca, riesgos y CAPEX) y, cuando el despacho carga el paquete ejecutivo, lo audita con score, hallazgos y plan de acción.",
  simulado: [
    "El corpus de 5 hoteles ya viene procesado: documentos, extracciones y consultas están precalculados con datos de ejemplo.",
    "El sistema no genera planos: el paquete ejecutivo siempre lo carga el Proyectista (hay un paquete de ejemplo de 60 archivos).",
    "La auditoría y el clash report son simulados: los hallazgos vienen preparados y la verificación es 2D sobre plantas, sin modelo BIM.",
    "No hay conexión al Drive ni inicio de sesión con usuario de red: el perfil se elige al entrar.",
    "Todo se guarda en este navegador. \"Reiniciar demo\" regresa el proyecto a la Fase 01.",
  ],
  orden:
    "Empieza con Dirección (libera el gate de inputs), sigue con el Revisor hasta aprobar la Fase de Definición, luego el Proyectista carga el paquete y al final el Revisor vuelve para ejecutar la auditoría. Cambia de perfil en la barra de demo, abajo.",
  perfiles: [
    {
      perfil: "direccion",
      dispositivo: "Escritorio",
      resumen: "Dirección de Desarrollo de Norte 19. Emite los estándares, consulta el corpus, destraba el proyecto y revisa el cuadro de áreas y el CAPEX.",
      secciones: [
        { nombre: "Corpus", descripcion: "Los 5 hoteles de referencia con su matriz de cobertura y la consulta del corpus." },
        { nombre: "Proyecto Juárez", descripcion: "Tablero con fases, módulos y bitácora; desde aquí entras a Inputs, Fase de Definición, Catálogos, Semáforo y Auditoría." },
        { nombre: "Reportes", descripcion: "Próximamente." },
      ],
      pasos: [
        {
          accion: "En el selector elige \"Dirección de Desarrollo\". En Corpus revisa la matriz de cada hotel.",
          resultado: "City Express Guaymas dice \"Sin información de Instalaciones\" y Cancún Aeropuerto aparece parcial en Interiores.",
        },
        {
          accion: "Toca \"Consultar el corpus\" y elige la pregunta \"¿Cuál es el m² por llave promedio de BOH?\". Abre una fuente con \"Ver documento\".",
          resultado: "Aparece la respuesta con la etiqueta \"Consulta del corpus\", una tabla por hotel y sus fuentes; el documento abre en la página citada.",
        },
        {
          accion: "Entra a \"Proyecto Juárez\".",
          resultado: "El aviso \"Proceso detenido\" indica que falta la Mecánica de suelos y cuál es su impacto.",
        },
        {
          accion: "Toca \"Resolver en Inputs\" y, en la fila Mecánica de suelos, toca \"Usar ejemplo\".",
          resultado: "Aparece \"Gate de inputs liberado\" y el proyecto pasa a la Fase 02.",
        },
        {
          accion: "Toca \"Ir a la Fase de Definición\" y abre la pestaña \"CAPEX\".",
          resultado: "Cerca de USD 49,800 por llave con rango ±10%, y el aviso \"CAPEX en ámbar: falta el CAPEX objetivo\".",
        },
        {
          accion: "Toca \"Cargar en Inputs\", usa el ejemplo en CAPEX objetivo y vuelve a la pestaña \"CAPEX\".",
          resultado: "\"Contra el objetivo\" marca +8.3% sobre USD 46,000 por llave, en ámbar.",
        },
        {
          accion: "En \"Cuadro de áreas\" ubica la mayor desviación. Toca el lápiz de Áreas públicas, escribe 538 y toca \"Guardar\".",
          resultado: "Áreas públicas pasa de -20.0% en rojo a verde. El CAPEX se recalcula y sube a cerca de +10% contra el objetivo.",
        },
        {
          accion: "Opcional: en \"CAPEX\" cambia el \"Factor de actualización\" y toca \"Aplicar\".",
          resultado: "El CAPEX se recalcula con el nuevo factor.",
        },
        {
          accion: "Cuando el Revisor termine la auditoría, abre el módulo \"Reporte de auditoría\" desde el tablero.",
          resultado: "Ves el score, los hallazgos y el plan de acción en modo consulta.",
        },
      ],
    },
    {
      perfil: "revisor",
      dispositivo: "Escritorio",
      resumen: "Revisor experto de arquitectura e ingenierías. Revisa riesgos, aprueba la Fase de Definición, ejecuta la auditoría y confirma o descarta hallazgos.",
      secciones: [
        { nombre: "Corpus", descripcion: "Los 5 hoteles de referencia y la consulta del corpus." },
        { nombre: "Proyecto Juárez", descripcion: "Tablero con los módulos Fase de Definición, Semáforo y trazabilidad, Auditoría y Reporte de auditoría." },
        { nombre: "Colas de revisión", descripcion: "Próximamente." },
      ],
      requisito: "Dirección debe haber cargado la Mecánica de suelos. Para la auditoría (pasos 5 a 8), el Proyectista debe haber cargado el paquete.",
      pasos: [
        {
          accion: "En el selector elige \"Revisor experto\". En el tablero abre el módulo \"Fase de Definición\".",
          resultado: "Ves las pestañas de la definición y el botón \"Aprobar Fase de Definición\".",
        },
        {
          accion: "Abre \"Mapa de riesgos\". Toca \"Confirmar\" en R-01 y \"Descartar\" en R-10.",
          resultado: "Cada cambio muestra un aviso; R-10 queda tachado y el título dice \"8 pendientes de revisión experta\".",
        },
        {
          accion: "Opcional: en \"Brand standards\" cambia el estatus de algún requisito.",
          resultado: "El conteo de requisitos que cumplen y desvían se actualiza.",
        },
        {
          accion: "Toca \"Aprobar Fase de Definición\", revisa el resumen y toca \"Aprobar y firmar acta\".",
          resultado: "Aparece \"Fase de Definición aprobada\", el proyecto pasa a la Fase 04 y el cuadro de áreas queda bloqueado. Ahora le toca al Proyectista.",
        },
        {
          accion: "Cuando el Proyectista cargue el paquete, abre el módulo \"Auditoría\" y toca \"Ejecutar auditoría\".",
          resultado: "Corren 10 pasos en unos 25 segundos y los hallazgos aparecen por rubro. \"Saltar\" lo termina de inmediato; al final abre el reporte.",
        },
        {
          accion: "Revisa el score y abre la pestaña \"Matriz de hallazgos\". Toca \"Confirmar\" en C-02; en C-03 toca \"Descartar\", escribe el motivo y confirma con \"Descartar\".",
          resultado: "El score empieza en 36.1 en rojo (\"Replantear\"). Confirmar no lo cambia; descartar C-03 lo sube a 43.6.",
        },
        {
          accion: "Abre \"Clash report\" y elige N2.",
          resultado: "El plano del nivel 2 muestra C-03 en el eje E-6, atenuado por estar descartado.",
        },
        {
          accion: "En el tablero abre \"Semáforo y trazabilidad\" y toca \"Aplicar sugerencias\".",
          resultado: "Las calificaciones de los entregables se actualizan y cambia el avance total.",
        },
      ],
    },
    {
      perfil: "proyectista",
      dispositivo: "Tablet",
      resumen: "Despacho externo que hace el proyecto ejecutivo. Consulta criterios y biblioteca, carga el paquete ejecutivo y obtiene los catálogos de obra.",
      secciones: [
        { nombre: "Proyecto Juárez", descripcion: "Tablero del proyecto con fases y módulos." },
        { nombre: "Criterios", descripcion: "Criterios de diseño por disciplina con su fuente." },
        { nombre: "Biblioteca", descripcion: "30 soluciones del corpus para agregar al paquete de criterios." },
        { nombre: "Completitud", descripcion: "Carga del paquete ejecutivo y checklist de entregables." },
        { nombre: "Catálogos", descripcion: "Catálogos de obra por ratio del corpus, exportables a Excel." },
        { nombre: "Reporte de auditoría", descripcion: "Hallazgos y plan de acción para dar seguimiento." },
      ],
      requisito: "El Revisor debe haber aprobado la Fase de Definición; antes, estos módulos dicen \"Se habilita en la Fase 04\".",
      pasos: [
        {
          accion: "En el selector elige \"Proyectista\" y abre \"Criterios\".",
          resultado: "Abre la pestaña \"Estructura\" con criterios del corpus y del sitio, como la cimentación para 18 t/m² de la mecánica de suelos.",
        },
        {
          accion: "Abre \"Biblioteca\" y escribe \"cancelería\" en Buscar.",
          resultado: "Aparecen las soluciones de cancelería con su hotel y clave de origen; \"Ver documento\" abre la lámina.",
        },
        {
          accion: "En \"Cancelería de aluminio en ventana de habitación\" toca \"Agregar al paquete\".",
          resultado: "El botón cambia a \"En el paquete\" y el contador \"Paquete de criterios\" sube a 1.",
        },
        {
          accion: "Abre \"Completitud\" y toca \"Usar paquete de ejemplo (60 archivos)\".",
          resultado: "Faltan 2 entregables críticos: Memoria de cálculo estructural (MEM-ES) y Cuadro de cargas (IE-002). Hay 3 archivos sin identificar.",
        },
        {
          accion: "Toca \"Continuar con nota de supuesto\", escribe la nota y toca \"Continuar\".",
          resultado: "Aparece \"Auditoría habilitada con nota de supuesto · nivel 2\". Avisa al Revisor para que ejecute la auditoría.",
        },
        {
          accion: "Abre \"Catálogos\", elige la pestaña \"Eléctrico\" y toca \"Exportar Eléctrico a Excel\".",
          resultado: "Se descarga el Excel con clave, concepto, unidad, cantidad, P.U. e importe. Los conceptos sin referencia dicen \"Por cotizar\".",
        },
        {
          accion: "Después de la auditoría, abre \"Reporte de auditoría\" y en \"Plan de acción\" cambia la resolución de una acción que confirmó el Revisor.",
          resultado: "La acción cambia a \"En proceso\" o \"Resuelto\" y aparece un aviso.",
        },
      ],
    },
  ],
};
