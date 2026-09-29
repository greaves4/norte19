// Guía de la pantalla de Ayuda de Fund (/fund/ayuda). Sigue el guion de validación (sección 7 del documento) y lib/store/guion-fund.test.ts.
import type { GuiaPrototipo } from "@/lib/ayuda";

export const GUIA_FUND: GuiaPrototipo = {
  queEs:
    "Fund es la plataforma de caja chica de los hoteles City Express. Recepción registra cada gasto con su factura (CFDI) y comprobante, el gerente del hotel lo aprueba o rechaza y Tesorería re-fondea las tarjetas y concilia contra el banco. El prototipo recorre ese ciclo completo con el hotel City Express Cancún Aeropuerto.",
  simulado: [
    "No hay servidor: los datos de ejemplo y todo lo que hagas se guardan en este navegador. Otro navegador o dispositivo no ve tus cambios.",
    "Las 5 facturas de \"Usar archivo de ejemplo\" son CFDI 4.0 generados con la fecha de hoy; también puedes cargar un XML real.",
    "La dispersión y el estado de cuenta de Pay Connect son simulados: no se mueve dinero ni se consulta ningún banco.",
    "El acceso es con \"Entrar como…\"; en producción sería con tu usuario de red (Active Directory).",
    "\"Reiniciar demo\", en la barra de demo, regresa todos los datos de ejemplo a su estado inicial.",
  ],
  orden:
    "Recorre los perfiles en orden, Recepción, Supervisor y Tesorería, en el mismo navegador y sin reiniciar la demo entre ellos: cada perfil ve lo que hizo el anterior.",
  perfiles: [
    {
      perfil: "hotel",
      dispositivo: "Tablet o celular",
      resumen:
        "Personal de recepción o administración del hotel (Mariana Cruz Pech). Registra los gastos pagados con la tarjeta de caja chica, con su factura y comprobante.",
      secciones: [
        { nombre: "Registro", descripcion: "Saldo de la tarjeta, gasto del corte y todos los movimientos del hotel." },
        { nombre: "Mis movimientos", descripcion: "Los movimientos que registraste, con conteo por estatus y su historial." },
      ],
      pasos: [
        {
          accion: "En la pantalla de inicio elige \"Entrar como Recepción\".",
          resultado: "Abre \"Registro de movimientos\" con el saldo disponible, el presupuesto del corte ($40,000.00) y el grid de movimientos del hotel.",
        },
        {
          accion:
            "Toca \"Nuevo movimiento\". En \"1. Factura (XML)\" toca \"Usar archivo de ejemplo\" y elige \"Limpieza Peninsular · factura de ayer\".",
          resultado:
            "Se llenan solos razón social, RFC emisor, fecha de emisión, UUID, subtotal, IVA, total ($3,688.80) y los conceptos con su clave. El centro de costos queda en Limpieza.",
        },
        {
          accion: "En \"2. Comprobante\" toca \"Usar archivo de ejemplo\" y elige el de Limpieza Peninsular. Revisa \"Validaciones\" y toca \"Enviar a supervisión\".",
          resultado:
            "Las cuatro validaciones quedan en verde (\"Coincidencia verificada\" en la documental). Aparece el aviso \"Movimiento enviado a supervisión\" y regresas al registro.",
        },
        {
          accion: "Toca \"Nuevo movimiento\" y carga el XML y el comprobante de ejemplo \"Aeroméxico · boleto de avión\".",
          resultado:
            "Aparece \"Categoría bloqueada: Aerolíneas\" y el botón \"Enviar a supervisión\" se desactiva: ese gasto necesita una excepción de Tesorería.",
        },
        {
          accion: "En el aviso de la categoría bloqueada toca \"Solicitar excepción\".",
          resultado: "Aparece \"Excepción solicitada a Tesorería\". El movimiento queda como Registrado y no llega al Supervisor hasta que Tesorería lo apruebe.",
        },
        {
          accion: "Toca \"Nuevo movimiento\" y carga el XML y el comprobante de ejemplo \"Papelería Tulum · hace 6 días\".",
          resultado: "Aparece \"Fuera de la ventana de registro\": la factura tiene 6 días y el límite es de 3.",
        },
        {
          accion: "En ese aviso toca \"Solicitar autorización\".",
          resultado: "Aparece \"Autorización solicitada al supervisor\". El movimiento queda como Registrado extemporáneo y llega a la bandeja del Supervisor.",
        },
        {
          accion: "Ve a \"Mis movimientos\" y toca el de LIMPIEZA PENINSULAR por $3,688.80.",
          resultado:
            "Está en \"Pendiente de aprobación\". Se abre su detalle con el historial (registrado y enviado) y sus archivos. En \"Registro\", el saldo disponible ya bajó por los tres cargos.",
        },
      ],
    },
    {
      perfil: "supervisor",
      dispositivo: "Escritorio",
      resumen:
        "Gerente del hotel (Ricardo Salas Uc). Revisa cada gasto comparando la factura con los datos, y lo aprueba, lo rechaza con motivo o autoriza excepciones.",
      secciones: [
        { nombre: "Bandeja", descripcion: "Movimientos por aprobar, con horas en bandeja y aprobación en lote." },
        { nombre: "Rechazados", descripcion: "Movimientos rechazados que se pueden autorizar con una segunda justificación." },
        { nombre: "Historial", descripcion: "Todos los movimientos del hotel con su historial." },
      ],
      requisito:
        "Haz antes los pasos de Recepción en este mismo navegador. Sin ellos la bandeja solo tiene los 6 pendientes de ejemplo.",
      pasos: [
        {
          accion: "Cambia el perfil a Supervisor en la barra de demo (o entra con \"Entrar como Supervisor\").",
          resultado:
            "Abre \"Bandeja de supervisión\" con 8 pendientes: 6 de ejemplo, el de Limpieza Peninsular que envió Recepción y Papelería Tulum con la etiqueta \"Fuera de ventana · autorización\".",
        },
        {
          accion: "Abre el de LIMPIEZA PENINSULAR por $3,688.80, el que envió Recepción (el de $3,671.40 es de ejemplo).",
          resultado:
            "Se abre la revisión con el visor dividido: la factura a un lado y \"Validaciones automáticas\", \"Datos del CFDI\", \"Conceptos\" e \"Historial\" al otro. Las validaciones están en verde.",
        },
        {
          accion: "Toca \"Aprobar\" y confirma con \"Aprobar\".",
          resultado: "Aparece \"Movimiento aprobado\" y regresas a la bandeja con un pendiente menos; \"Aprobados hoy\" sube en uno.",
        },
        {
          accion: "Abre el de Ferretería del Caribe ($3,509.00), toca \"Rechazar\", escribe el motivo (al menos 10 caracteres) y confirma con \"Rechazar\".",
          resultado: "Aparece \"Movimiento rechazado\". Sale de la bandeja y Recepción verá el motivo en su historial.",
        },
        {
          accion: "Abre el de Papelería Tulum y toca \"Autorizar y aprobar\"; confirma.",
          resultado:
            "La validación de ventana está en rojo, pero puedes autorizarlo. Aparece \"Movimiento autorizado y aprobado\" y la bandeja queda con 5 pendientes.",
        },
        {
          accion: "Ve a \"Rechazados\" y en Ferretería del Caribe toca \"Autorizar\". Escribe la justificación y confirma con \"Autorizar\".",
          resultado:
            "Aparece \"Movimiento autorizado\": pasa a Autorizado y cuenta para el re-fondeo. Su historial muestra el rechazo y la autorización.",
        },
        {
          accion: "Opcional: en \"Bandeja\" marca varios movimientos y toca \"Aprobar seleccionados\".",
          resultado: "Pide confirmación con el total y aprueba todos a la vez.",
        },
      ],
    },
    {
      perfil: "tesoreria",
      dispositivo: "Escritorio",
      resumen:
        "Tesorería corporativa (Viviana Torres). Administra las tarjetas de los 20 hoteles: saldos, re-fondeos con Pay Connect, categorías bloqueadas, conciliación bancaria y reportes.",
      secciones: [
        { nombre: "Panel", descripcion: "Tarjetas de todos los hoteles con saldo, aprobado del corte, re-fondeo, carga masiva y corte global." },
        { nombre: "Monitor", descripcion: "Conciliación del estado de cuenta Pay Connect contra los registros de Fund." },
        { nombre: "Reportes", descripcion: "Reporte general, SLA de aprobación, gastos por centro de costos e historial de fondeos." },
        { nombre: "Próximamente", descripcion: "Cuentas fondeadoras, Catálogos y Seguridad aparecen en la navegación pero no están en el prototipo." },
      ],
      requisito:
        "Haz antes los pasos de Recepción y Supervisor en este mismo navegador: el aprobado del corte, la excepción de Aeroméxico y el SLA dependen de ellos.",
      pasos: [
        {
          accion: "Cambia el perfil a Tesorería en la barra de demo.",
          resultado: "Abre \"Panel de tarjetas\". \"Excepciones por autorizar\" muestra 3: dos de ejemplo y la de Aeroméxico de Recepción.",
        },
        {
          accion: "En el grid busca Cancún Aeropuerto y abre su tarjeta.",
          resultado:
            "Ves \"Saldo disponible\" y \"Movimientos del corte\". En \"Re-fondeo automático\" la línea de aprobados suma lo que aprobó y autorizó el Supervisor ($8,581.10 si hiciste todos sus pasos).",
        },
        {
          accion: "En \"Excepciones de categoría\" toca \"Aprobar excepción\" en el boleto de Aeroméxico.",
          resultado: "Aparece \"Excepción aprobada\". El movimiento pasa a la bandeja del Supervisor con la etiqueta \"Excepción aprobada\".",
        },
        {
          accion: "En \"Re-fondeo automático\" revisa el \"= Monto propuesto\" y toca \"Dispersar\".",
          resultado:
            "Se abre \"Dispersión Pay Connect\" con tres pasos: solicitud enviada, aceptada y depositado. Al terminar aparece \"Fondeo depositado\" y la tarjeta queda en el presupuesto más lo aprobado.",
        },
        {
          accion: "En \"Categorías bloqueadas\" busca Restaurantes y activa su interruptor.",
          resultado: "Aparece \"Restaurantes bloqueada\". Si Recepción carga ahora la factura de Restaurante Marisol, la verá bloqueada.",
        },
        {
          accion: "Ve a \"Monitor\" (la tarjeta de Cancún ya está elegida) y toca \"Sincronizar ahora\".",
          resultado:
            "Corre la sincronización paso a paso. Al terminar aparece \"Conciliación actualizada\": \"Sin registro\" baja a 0 y queda 1 en \"No cuadrados\" con $30.00 de diferencia.",
        },
        {
          accion: "Opcional: en \"Panel\" toca \"Carga masiva\", luego \"Usar archivo de ejemplo\" y \"Aplicar 5 fondeos\".",
          resultado: "El Excel de ejemplo trae 7 filas: 5 válidas y 2 con error explicado. Aparece \"5 fondeos aplicados\".",
        },
        {
          accion: "Ve a \"Reportes\" y abre la pestaña \"SLA de aprobación\".",
          resultado:
            "La fila de Cancún Aeropuerto muestra a Ricardo Salas Uc con su promedio de horas de aprobación, que ya incluye las aprobaciones de esta sesión.",
        },
      ],
    },
  ],
};
