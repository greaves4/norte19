import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_MAX_AGE,
  codigoEsperado,
  esPrototipo,
  nombreCookie,
} from "@/lib/acceso";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const prototipo = pathname.split("/")[1];
  if (!esPrototipo(prototipo)) return NextResponse.next();

  const esperado = codigoEsperado(prototipo);
  const cookie = nombreCookie(prototipo);
  const codigo = searchParams.get("code");

  if (codigo !== null) {
    if (esperado && codigo.trim() === esperado) {
      // Código correcto: guarda la cookie y redirige a la ruta limpia.
      const limpia = request.nextUrl.clone();
      limpia.searchParams.delete("code");
      const response = NextResponse.redirect(limpia);
      response.cookies.set(cookie, esperado, {
        httpOnly: true,
        sameSite: "lax",
        secure: esHttps(request),
        path: `/${prototipo}`,
        maxAge: COOKIE_MAX_AGE,
      });
      return response;
    }
    return redirigirAAcceso(request, prototipo, true);
  }

  if (esperado && request.cookies.get(cookie)?.value === esperado) {
    return NextResponse.next();
  }

  return redirigirAAcceso(request, prototipo, false);
}

function redirigirAAcceso(request: NextRequest, prototipo: string, error: boolean) {
  const destino = request.nextUrl.clone();
  destino.searchParams.delete("code");

  const acceso = new URL("/acceso", request.url);
  acceso.searchParams.set("p", prototipo);
  acceso.searchParams.set("next", destino.pathname + destino.search);
  if (error) acceso.searchParams.set("error", "1");
  return NextResponse.redirect(acceso);
}

// Detrás de un proxy manda el protocolo que vio el navegador.
function esHttps(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  return proto ? proto === "https" : request.nextUrl.protocol === "https:";
}

export const config = {
  matcher: ["/fund/:path*", "/contratos/:path*", "/desarrollo/:path*"],
};
