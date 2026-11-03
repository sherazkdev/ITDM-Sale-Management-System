import { AuthenticatedAppShell } from "@/components/shell/AuthenticatedAppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
