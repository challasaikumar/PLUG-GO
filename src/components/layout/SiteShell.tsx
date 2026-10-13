import { Footer } from "./Footer";
import { Header } from "./Header";
import { SkipLink } from "./SkipLink";
import { ToastProvider } from "@/components/ui/Toast";
import { PwaProvider } from "@/components/pwa/PwaProvider";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SkipLink />
      <Header signedIn={false} finderEnabled loginEnabled={false} />
      <PwaProvider installPromptEnabled={false} />
      <main id="main-content" className="site-main">
        {children}
      </main>
      <Footer />
    </ToastProvider>
  );
}
