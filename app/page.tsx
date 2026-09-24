import Link from "next/link";

// Índice interno: no se comparte con el cliente.
const prototipos = [
  {
    href: "/fund",
    titulo: "01 · Fund",
    descripcion: "Caja chica hotelera. Recepción, Supervisor y Tesorería.",
  },
  {
    href: "/contratos",
    titulo: "02 · Contratos",
    descripcion: "Gestión de contratos con IA. Solicitante, Abogado, Directivo y Admin legal.",
  },
  {
    href: "/desarrollo",
    titulo: "03 · Desarrollo hotelero",
    descripcion: "Asistente de proyecto ejecutivo y auditoría. Dirección, Revisor y Proyectista.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Prototipos Norte 19</h1>
        <p className="text-muted-foreground">Índice interno. No compartir con el cliente.</p>
      </header>
      <ul className="flex flex-col gap-3">
        {prototipos.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="flex flex-col gap-1 border p-4 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{p.titulo}</span>
              <span className="text-sm text-muted-foreground">{p.descripcion}</span>
              <span className="text-xs text-muted-foreground">{p.href}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
