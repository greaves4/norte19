// Contenido de la pantalla de Ayuda de cada prototipo (/<prototipo>/ayuda). Los datos viven en lib/fixtures/<prototipo>/ayuda.ts.

export type PasoGuia = {
  // Qué hace el usuario, con los nombres exactos de botones y secciones.
  accion: string;
  // Qué debe pasar en pantalla.
  resultado: string;
};

export type SeccionGuia = { nombre: string; descripcion: string };

export type RecorridoPerfil = {
  // Valor del perfil en la DemoBar (p. ej. "hotel").
  perfil: string;
  // Dispositivo sugerido para probarlo.
  dispositivo: "Escritorio" | "Tablet" | "Tablet o celular";
  // Quién es en Norte 19 y qué hace en el sistema.
  resumen: string;
  // Lo que ve en su navegación.
  secciones: SeccionGuia[];
  // Qué necesita que otro perfil haya hecho antes, si aplica.
  requisito?: string;
  pasos: PasoGuia[];
};

export type GuiaPrototipo = {
  // Qué resuelve el prototipo, en dos o tres frases.
  queEs: string;
  // Qué está simulado y qué no.
  simulado: string[];
  // Orden sugerido para recorrer los perfiles.
  orden: string;
  perfiles: RecorridoPerfil[];
};
