import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthPageShell({ eyebrow, title, description, children }: AuthPageShellProps) {
  return (
    <>
      <Header />
      <main className="flex min-h-[80vh] items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted">{eyebrow}</p>
            <h1 className="mt-1 text-xl font-medium uppercase tracking-wider">{title}</h1>
            {description && <p className="mt-3 text-xs leading-relaxed text-muted">{description}</p>}
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
