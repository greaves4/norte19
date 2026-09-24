import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NOMBRE_PROTOTIPO, esPrototipo } from "@/lib/acceso";

export const metadata: Metadata = { title: "Acceso · Norte 19" };

type Props = {
  searchParams: Promise<{ p?: string; next?: string; error?: string }>;
};

export default async function AccesoPage({ searchParams }: Props) {
  const { p, next, error } = await searchParams;

  if (!esPrototipo(p)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Enlace incompleto. Solicita la liga del prototipo.</p>
      </main>
    );
  }

  // Solo se regresa a rutas del mismo prototipo.
  const destino = next?.startsWith(`/${p}`) ? next.split("?")[0] : `/${p}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{NOMBRE_PROTOTIPO[p]}</CardTitle>
          <CardDescription>Escribe el código de acceso que te compartimos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={destino} method="get" className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Código de acceso</Label>
              <Input
                id="code"
                name="code"
                required
                autoFocus
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "code-error" : undefined}
              />
              {error && (
                <p id="code-error" className="text-sm text-destructive">
                  El código no es válido. Revísalo e intenta de nuevo.
                </p>
              )}
            </div>
            <Button type="submit">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
