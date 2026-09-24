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
https://norte19.geekvibes.digital/fund?code=<PROTO_CODE_FUND>
https://norte19.geekvibes.digital/contratos?code=<PROTO_CODE_CONTRATOS>
https://norte19.geekvibes.digital/desarrollo?code=<PROTO_CODE_DESARROLLO>
```

Sin código válido, la ruta muestra la página de acceso. Un código no abre los otros prototipos.

## Deploy en Coolify

El repositorio trae un `Dockerfile` (Next.js standalone, Node 22, puerto 3000).

1. En Coolify, crear un recurso desde el repositorio con build pack **Dockerfile**.
2. Puerto expuesto: `3000`. La imagen incluye un healthcheck sobre `/`.
3. Variables de entorno (runtime): `PROTO_CODE_FUND`, `PROTO_CODE_CONTRATOS`, `PROTO_CODE_DESARROLLO`.
4. Opcional: `NEXT_PUBLIC_DEMO=0` como build argument oculta la barra de demo (se fija al compilar).
5. Asignar el dominio con HTTPS, desplegar y probar cada liga.

Las redirecciones del acceso son relativas y la cookie se marca `Secure` según `X-Forwarded-Proto`, así que funcionan detrás del proxy de Coolify.

En la imagen, pnpm instala en `node_modules` normal: el Dockerfile quita `modulesDir` de `pnpm-workspace.yaml`, que solo existe para que iCloud no desaloje dependencias en local (ver `CLAUDE.md`).

Para probar la imagen en local:

```bash
docker build -t norte19-prototipos .
docker run --rm -p 3000:3000 --env-file .env.local norte19-prototipos
```

## Demo

La barra inferior de cada prototipo permite cambiar de perfil, acelerar el reloj (x1, x60, x1440, +24 h) y reiniciar los datos. Antes de cada sesión con usuarios, usar "Reiniciar demo".
