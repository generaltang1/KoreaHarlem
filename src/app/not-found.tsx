import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <ErrorScreen variant="404" />
      </main>
      <Footer />
    </>
  );
}
