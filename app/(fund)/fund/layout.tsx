import { FundShell } from "@/components/fund/FundShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <FundShell>{children}</FundShell>;
}
