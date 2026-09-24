import { ContratosShell } from "@/components/contratos/ContratosShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ContratosShell>{children}</ContratosShell>;
}
