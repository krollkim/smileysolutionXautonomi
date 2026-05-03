import { Sidebar } from "@/components/layout/Sidebar";
import { TRPCProvider } from "@/lib/trpc/provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </TRPCProvider>
  );
}
