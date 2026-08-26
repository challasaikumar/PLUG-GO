import { LoginForm } from "@/components/account/LoginForm";
import { driverLoginAvailable, isDevOtpEnabled, loginUnavailableMessage } from "@/lib/auth/config";
import { getOptionalDriver } from "@/lib/auth/driver";
import { isFeatureEnabled } from "@/lib/release/overrides";
import { safeReturnPath } from "@/lib/auth/return-path";
import { pageMeta } from "@/lib/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata = pageMeta({
  title: "Sign in",
  description: "Sign in to Plug and Go with a mobile number and one-time code.",
  path: "/login",
  index: false,
});

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextPath = safeReturnPath(params.next);
  const driver = await getOptionalDriver();
  if (driver) {
    redirect(nextPath);
  }
  const available = driverLoginAvailable();
  const flagOn = await isFeatureEnabled("driverOtpLogin");
  const loginAvailable = flagOn && available.ok;
  const unavailableMessage = !flagOn
    ? "Driver sign-in is disabled until FLAG_DRIVER_OTP is true and SMS delivery is configured."
    : available.ok
      ? null
      : loginUnavailableMessage(available.reason);
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 640 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Sign in
      </h1>
      <p className="type-body-lg" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        Use your Indian mobile number. Search still works without an account. Website booking appears only at stations
        where Plug and Go can honour a reservation. This login never starts a charging session.
      </p>
      <LoginForm
        nextPath={nextPath}
        loginAvailable={loginAvailable}
        unavailableMessage={unavailableMessage}
        devOtpEnabled={isDevOtpEnabled()}
      />
    </div>
  );
}
