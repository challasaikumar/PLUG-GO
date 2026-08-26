import { Footer } from "./Footer";
import { Header } from "./Header";
import { SkipLink } from "./SkipLink";
import { ToastProvider } from "@/components/ui/Toast";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { getOptionalDriver } from "@/lib/auth/driver";
import { getPublicFlagSnapshot } from "@/lib/release/public-snapshot";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [driver, flags] = await Promise.all([getOptionalDriver(), getPublicFlagSnapshot()]);
  return (
    <ToastProvider>
      <SkipLink />
      <Header signedIn={Boolean(driver)} finderEnabled={flags.publicStationFinder} loginEnabled={flags.driverOtpLogin} />
      <PwaProvider installPromptEnabled={flags.pwaInstallPrompt} />
      <main id="main-content" className="site-main">
        {children}
      </main>
      <Footer />
    </ToastProvider>
  );
}
