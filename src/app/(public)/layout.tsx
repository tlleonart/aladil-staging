import { QueryProvider } from "@/modules/core/orpc";
import { Footer, Header } from "@/modules/public-site/components";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <QueryProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </QueryProvider>
  );
}
