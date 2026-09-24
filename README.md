# Prototipos Norte 19

Prototipos navegables para validar con usuarios de Norte 19 tres propuestas de Geek Vibes. No hay backend: los datos son simulados y viven en el navegador (localStorage).

| Prototipo | Ruta | Perfiles |
|---|---|---|
| Fund · Caja chica hotelera | `/fund` | Recepción, Supervisor, Tesorería |
| Contratos | `/contratos` | Solicitante, Abogado, Directivo, Admin legal |
| Desarrollo hotelero | `/desarrollo` | Dirección, Revisor, Proyectista |

`/` es un índice interno; no se comparte con el cliente.

## Ejecución local

Requisitos: Node 20 o superior y pnpm 11 (`corepack enable` lo instala según `packageManager`).

```bash
pnpm install
cp .env.example .env.local   # y llena los códigos
pnpm dev
```

Abre http://localhost:3000/fund?code=<PROTO_CODE_FUND>. Con la liga, el código se guarda en una cookie por 30 días.

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm check` | Lint y build de producción; correr antes de cada deploy |
| `pnpm test` | Pruebas con vitest |

## Variables de entorno

| Variable | Uso |
|---|---|
| `PROTO_CODE_FUND` | Código de acceso a `/fund` |
| `PROTO_CODE_CONTRATOS` | Código de acceso a `/contratos` |
| `PROTO_CODE_DESARROLLO` | Código de acceso a `/desarrollo` |
| `NEXT_PUBLIC_DEMO` | Opcional. `0` oculta la barra de demo |

Si falta el código de un prototipo, ese prototipo queda cerrado. Los códigos no son seguridad: solo evitan que los prototipos sean públicos.

## Ligas para compartir

Una liga por prototipo, cada una con su código:

```
https://<dominio>/fund?code=<PROTO_CODE_FUND>
https://<dominio>/contratos?code=<PROTO_CODE_CONTRATOS>
https://<dominio>/desarrollo?code=<PROTO_CODE_DESARROLLO>
```

Sin código válido, la ruta muestra la página de acceso. Un código no abre los otros prototipos.

## Deploy en Vercel

1. Importar el repositorio en Vercel (framework Next.js; `vercel.json` ya define install y build).
2. Definir las tres variables `PROTO_CODE_*` en Production y Preview.
3. Desplegar y probar cada liga.

`vercel.json` crea el enlace `node_modules → node_modules.nosync` antes de instalar, porque el proyecto instala dependencias en `node_modules.nosync` para que iCloud no las desaloje en local (ver `CLAUDE.md`).

## Demo

La barra inferior de cada prototipo permite cambiar de perfil, acelerar el reloj (x1, x60, x1440, +24 h) y reiniciar los datos. Antes de cada sesión con usuarios, usar "Reiniciar demo".
