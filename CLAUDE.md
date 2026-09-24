# norte19-prototipos

Prototipos navegables y semi-funcionales para tres propuestas de Geek Vibes a Norte 19 (operadora de hoteles City Express). Sirven para que usuarios reales validen la experiencia antes de aprobar las propuestas. No hay backend: todo es cliente, con datos simulados persistidos en localStorage.

## Reglas
- Next.js 15 App Router, TypeScript estricto, Tailwind, shadcn/ui, zustand, TanStack Table, recharts.
- Gestor: pnpm. Verificar con `pnpm build` antes de dar por terminada cualquier tarea.
- NO definir colores, tipografías, sombras ni radios en componentes. Usar exclusivamente clases de Tailwind mapeadas a los tokens de `styles/tokens.css` y los componentes de `components/ui` (shadcn ya tematizado). Si un token no existe, usar el neutro por defecto de shadcn y dejar un comentario `// TODO tokens: <qué falta>`. Nunca editar `styles/tokens.css`.
- Español de México en toda la interfaz. Sin emojis. Textos de UI directos y cortos.
- Un route group por prototipo: `(fund)`, `(contratos)`, `(desarrollo)`. No compartir estado entre prototipos.
- Estado en `lib/store/<prototipo>.ts` con zustand + persist. Fixtures en `lib/fixtures/<prototipo>/`. Simulaciones en `lib/sim/<prototipo>/`.
- Todo dato simulado debe parecer real: nombres de hoteles City Express, RFCs con formato válido, montos en MXN con formato es-MX, fechas relativas a "hoy".
- Cada acción del usuario debe tener respuesta visible: toast, cambio de estado, navegación. Nada queda "muerto".
- Responsivo: las vistas de Hotel (Fund) y de Proyectista (Desarrollo) deben funcionar en tablet (1024×768) y móvil (390 de ancho).
- No instalar dependencias fuera de la lista sin justificarlo en el commit. Lista: next, react, typescript, tailwind, shadcn/ui, zustand, @tanstack/react-table, recharts, date-fns, fast-xml-parser, xlsx, react-pdf, lucide-react, @dnd-kit/core, @dnd-kit/sortable, minisearch; en desarrollo: pdf-lib, vitest. Agregada: sonner (toasts de shadcn).
- Componentes compartidos en `components/shared`; si algo se usa en dos prototipos, vive ahí.

## Convenciones
- Rutas en español y en minúsculas: `/fund/hotel/registro`, `/contratos/legal/bandeja`.
- Estados de registros como union types en `lib/types/<prototipo>.ts`.
- Cada pantalla es un archivo `page.tsx` delgado que compone componentes de `components/<prototipo>/`.
- Fechas con `date-fns` y locale `es`.
- Formato de moneda: `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.

## Demo
- `lib/demo.ts` (store zustand persistido en la clave `demo`) expone `useDemo()` con `isDemo`, `profile`, `setProfile`, `clockSpeed` (1 | 60 | 1440), `setClockSpeed`, `now()`, `advanceHours(n)` y `reset()`.
- Toda fecha "actual" sale del reloj simulado: `now()` en handlers y `useNow(intervalMs)` para re-renderizar (SLAs, timers). Nunca `new Date()` directo.
- `useDemoHydrated()` indica que ya se leyó localStorage; úsalo antes de pintar algo que dependa del perfil para evitar errores de hidratación.
- `DemoBar` (`components/shared/DemoBar.tsx`) recibe `profiles` y `onReset`. Se monta en el AppShell de cada prototipo.
- "Reiniciar demo" llama a `onReset` (reset del store del prototipo: restaura fixtures) y a `reset()` de demo (regresa el reloj al tiempo real; conserva el perfil).
- `NEXT_PUBLIC_DEMO=0` oculta la DemoBar.

## Shell
- `components/shared/AppShell.tsx` (sidebar de shadcn): expandido desde 1024 px, solo iconos en tablet, drawer en móvil. El item activo es el `href` más largo que coincide con la ruta.
- Cada prototipo tiene `components/<prototipo>/<Nombre>Shell.tsx` ("use client", define perfiles, navegación y reset) y lo monta su `layout.tsx`. Los íconos son componentes de lucide, por eso la navegación se define en cliente.
- `PageHeader` y `EmptyState` para el encabezado y los estados vacíos de cada pantalla.
- La DemoBar publica su altura en `--demo-bar-h`; el área de contenido ya deja ese espacio al final.

## DataGrid
- `components/shared/DataGrid.tsx` usa TanStack Table **v9** (`useTable` + `tableFeatures`; no `useReactTable` de v8). Documentación de la versión instalada en `node_modules/@tanstack/react-table/skills` y `node_modules/.pnpm/node_modules/@tanstack/table-core/skills`.
- Columnas: `const col = dataGridColumns<T>(); const columns = col.columns([col.accessor("monto", { header: "Monto", meta: {...} })])`. Definirlas fuera del componente o con `useMemo`.
- `meta`: `filter` (`{type: "text"}` o `{type: "select", options?}`; con select usar `filterFn: "equalsString"`), `hideOnMobile`, `align: "end"` para montos, `label` y `exportValue` para Excel.
- Fechas: accessor con `Date` y `sortFn: "datetime"`. Excel exporta el valor crudo; el PDF imprime lo renderizado.

## Componentes de documento y proceso
- `SplitViewer` recibe `document={{type: "pdf" | "image", src, title?}}` y los datos como children; necesita un alto definido (className). El visor (`DocumentViewer`) se carga solo en cliente.
- El worker de PDF.js se copia a `public/pdf.worker.min.mjs` con `scripts/copy-pdf-worker.mjs` (postinstall, predev, prebuild). Si el visor no carga, correr `node scripts/copy-pdf-worker.mjs`.
- `UploadZone` devuelve `{kind: "file", file}` o `{kind: "fixture", fixture}` (o `null` al quitar). Los fixtures viven en `public/fixtures/<prototipo>/` y pueden traer `data` con lo que la simulación debe "extraer".
- `StatusBadge` con un `StatusMap` por tipo de registro, definido en `lib/types/<prototipo>.ts`. `GateBanner` para bloqueos y pendientes; `Timeline` para historial.
- `ProgressRunner` para procesos simulados (lectura con IA, auditoría): `steps` con `durationMs` y `log`; `ref.start()` o `autoStart`; "Saltar" visible en demo.

## Estructura base
- Estilos globales en `styles/globals.css` (tema shadcn) y `styles/tokens.css` (design system). Ambos se importan en `app/layout.tsx`.
- El design system de Claude Design vive en `../norte19-design-system/` (tokens.css, tokens.json, README con reglas de marca, assets). Se integra en el prompt B8.
- Componentes shadcn con preset `base-nova` (Base UI). Agregar componentes con `pnpm dlx shadcn@latest add <componente>`.
- Pruebas con vitest: `pnpm test`.

## Deploy
- Coolify con el `Dockerfile` (standalone con `NEXT_OUTPUT=standalone`, puerto 3000). Los códigos `PROTO_CODE_*` se leen en runtime.
- No hay Docker en la Mac de desarrollo: para validar cambios al Dockerfile, reproducir sus pasos en una carpeta limpia fuera de iCloud y correr `node server.js`.

## iCloud
El proyecto vive en ~/Documents, que se sincroniza con iCloud. Para que iCloud no desaloje dependencias ni artefactos de build:
- pnpm instala en `node_modules.nosync` (`modulesDir` en pnpm-workspace.yaml) y `node_modules` es un enlace simbólico a esa carpeta.
- `.next` es un enlace simbólico a `.next.nosync`.
- Si se borra `node_modules`, recrear el enlace: `ln -s node_modules.nosync node_modules`.

## Acceso
- `middleware.ts` protege /fund, /contratos y /desarrollo con PROTO_CODE_FUND, PROTO_CODE_CONTRATOS y PROTO_CODE_DESARROLLO (ver .env.example). Configuración compartida en `lib/acceso.ts`.
- Liga para compartir: `/<prototipo>?code=<valor>`. Guarda una cookie httpOnly `proto_<prototipo>` por 30 días y redirige a la ruta limpia.
- Sin cookie válida redirige a `/acceso?p=<prototipo>&next=<ruta>`. Si la variable no está definida, el prototipo queda cerrado.
- Local: `.env.local` trae los códigos `fund-local`, `contratos-local`, `desarrollo-local`.

## Prototipo Fund (/fund)
Plataforma de gestión de caja chica hotelera. Tres perfiles (`PerfilFund`): hotel (recepción), supervisor (gerente del hotel), tesoreria (corporativo). Documento completo: `../01-prototipo-fund.md`.
- Tipos en `lib/types/fund.ts` (Hotel, Tarjeta, Movimiento, Fondeo, MovimientoBancario, Categoria, CentroCostos) y los `StatusMap` de movimiento, tarjeta y fondeo.
- Estatus de Movimiento: 'registrado' | 'pendiente' | 'aprobado' | 'rechazado' | 'autorizado'.
- El PAN de tarjeta NUNCA existe en el código ni en fixtures; solo token y ultimosCuatro (hay prueba que lo verifica).
- Hotel de la demo: City Express Cancún Aeropuerto (hotelId 'ce-cun-apt', tarjeta 'tj-ce-cun-apt'). Usuarios por perfil en `USUARIOS_DEMO`.
- Fixtures en `lib/fixtures/fund/`: generadas con semilla fija (`crearDatosFund(hoy)`), relativas al reloj de demo. Cambiar una fixture puede mover las invariantes de `fixtures.test.ts` (120 movimientos, 6 pendientes en Cancún, 40 movimientos bancarios con 2 discrepancias).
- Store `lib/store/fund.ts` (zustand + persist, clave 'fund'). Toda transición pasa por sus acciones y agrega evento a la timeline con `demoNow()`. Usar `useFundHydrated()` antes de pintar datos del store.
- Comprobantes estáticos en `public/fixtures/fund/`: `comprobantes/<slug>.{xml,pdf,jpg}` por proveedor y `ejemplos/<id>.{pdf,jpg}` por CFDI de ejemplo. Se regeneran con `pnpm gen:fund` (Node + pdf-lib + `sips` de macOS) y se versionan.
- Los 5 CFDI de ejemplo (`lib/fixtures/fund/cfdiEjemplos.ts`) NO son archivos: el XML se construye en el navegador con el reloj de demo (`crearXmlEjemplo`, `leerXmlDeUpload` en `lib/sim/fund/ejemplos.ts`) para que "hoy", "hace 2 días" y "hace 6 días" sigan siendo ciertos. En UploadZone usar `FIXTURES_XML` y `FIXTURES_COMPROBANTE`.
- `lib/sim/fund/cfdi.ts` (`parseCfdi`, `fechaEmision`) y `lib/sim/fund/validaciones.ts` (ventana de 3 días, categoría, RFC receptor, documental; cada una devuelve `{nivel, titulo, detalle}` para el semáforo).
- `cfdiXml.ts`, `cfdiEjemplos.ts` y `proveedores.ts` no pueden usar el alias `@/` ni imports de valores con alias: los importa el script de Node.
- El parser de CFDI debe leer XML reales de CFDI 4.0 (namespace cfdi y tfd).
- Las vistas bajo /fund/hotel deben funcionar en tablet 1024×768 y móvil 390.
- `components/fund/FundShell.tsx`: navegación por perfil (`INICIO_PERFIL`), redirige a /fund sin perfil y a la sección del perfil si la ruta no coincide (cambiar de perfil en la DemoBar lleva a su inicio). /fund (selector) se muestra sin barra lateral.
- `MovimientosGrid` + `MovimientoDetalle` (sheet con timeline) se reutilizan en las vistas de movimientos. Tablet: columnas con `hideBelow: "xl"`; móvil: la celda de proveedor muestra fecha y estatus.
- Toasts con `toast` de sonner (Toaster en app/layout.tsx, arriba a la derecha por la DemoBar).
- Supervisor (`lib/sim/fund/supervision.ts`): la bandeja incluye pendientes y extemporáneos con autorización solicitada (`enBandeja`, `esperaAutorizacion`); las validaciones al revisar se evalúan contra la fecha de registro. Los 8 movimientos de Cancún que revisa el Supervisor (pendientes, rechazado y autorizado) tienen los mismos montos y UUID que su comprobante estático; hay prueba que lo verifica.
- Vistas de Tesorería aún son `EnConstruccion` (F5–F6).
