"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { parseMobileNumber } from "@/lib/auth/phone";
import { FIELD_LIMITS, validateIndianMobile, validateOtpCode } from "@/lib/fields";

type Step = "phone" | "otp";

type LoginFormProps = {
  nextPath: string;
  loginAvailable: boolean;
  unavailableMessage: string | null;
  devOtpEnabled: boolean;
};

export function LoginForm({
  nextPath,
  loginAvailable,
  unavailableMessage,
  devOtpEnabled,
}: LoginFormProps) {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);

  useEffect(() => {
    if (step === "phone") phoneRef.current?.focus();
    if (step === "otp") otpRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function requestOtp(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    const phoneIssue = validateIndianMobile(phone);
    if (phoneIssue) {
      setFieldError(phoneIssue);
      phoneRef.current?.focus();
      return;
    }
    const parsed = parseMobileNumber(phone);
    if (!parsed.ok) {
      setFieldError(parsed.error);
      phoneRef.current?.focus();
      return;
    }
    setFieldError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: parsed.value.e164 }),
      });
      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            challengeId?: string;
            resendAvailableAt?: string;
            developmentCode?: string;
          }
        | null;
      if (!response.ok || !body?.ok || !body.challengeId) {
        setError(body?.error || "The code could not be sent. Try again.");
        return;
      }
      setChallengeId(body.challengeId);
      const wait = body.resendAvailableAt
        ? Math.max(1, Math.ceil((new Date(body.resendAvailableAt).getTime() - Date.now()) / 1000))
        : 60;
      setResendSeconds(wait);
      setDevelopmentCode(body.developmentCode ?? null);
      setStep("otp");
      setCode("");
      track(ANALYTICS_EVENTS.otp_requested, { method: "sms" });
    } catch {
      setError("The code could not be sent. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const otpIssue = validateOtpCode(code);
    if (otpIssue) {
      setFieldError(otpIssue);
      otpRef.current?.focus();
      return;
    }
    if (!challengeId) {
      setError("Request a new code, then try again.");
      return;
    }
    setFieldError(null);
    setLoading(true);
    try {
      const parsed = parseMobileNumber(phone);
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phone: parsed.ok ? parsed.value.e164 : phone,
          challengeId,
          code,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; isNewAccount?: boolean }
        | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || "That sign-in attempt did not work. Check the code or request a new one.");
        otpRef.current?.focus();
        return;
      }
      track(ANALYTICS_EVENTS.otp_verified, { method: "sms" });
      if (body.isNewAccount) {
        track(ANALYTICS_EVENTS.signup_completed, { method: "sms" });
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("That sign-in attempt did not work. Check the code or request a new one.");
    } finally {
      setLoading(false);
    }
  }

  if (!loginAvailable) {
    return (
      <Alert variant="warning" title="Sign-in is unavailable">
        {unavailableMessage ??
          "Driver sign-in is not configured on this server. SMS delivery has not been set up yet."}
      </Alert>
    );
  }

  return (
    <div className="paper-card" style={{ padding: 24, maxWidth: 480 }}>
      {error ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error" title="Sign-in could not continue">
            {error}
          </Alert>
        </div>
      ) : null}
      {devOtpEnabled ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="warning" title="Development OTP mode">
            SMS is not being sent. AUTH_DEV_OTP is enabled for this non-production environment only.
          </Alert>
        </div>
      ) : null}

      {step === "phone" ? (
        <form onSubmit={requestOtp} noValidate>
          <TextInput
            ref={phoneRef}
            id="login-phone"
            name="phone"
            label="Mobile number"
            required
            maxLength={FIELD_LIMITS.phone}
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            onBlur={() => {
              if (phone.trim()) setFieldError(validateIndianMobile(phone) ?? null);
            }}
            error={fieldError ?? undefined}
            help="India (+91). Enter a 10-digit mobile number. Country codes can be added later."
            leading={<span className="type-small" style={{ paddingLeft: 12, color: "var(--color-text-secondary)" }}>+91</span>}
          />
          <div style={{ marginTop: 20 }}>
            <Button type="submit" loading={loading} block>
              Send code
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp} noValidate>
          <p className="type-small" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
            Enter the 6-digit code sent to your number. Codes expire and can only be used once.
          </p>
          {developmentCode ? (
            <div style={{ marginBottom: 16 }}>
              <Alert variant="info" title="Development code">
                Use {developmentCode}. This value is shown only because AUTH_DEV_OTP is enabled.
              </Alert>
            </div>
          ) : null}
          <TextInput
            ref={otpRef}
            id="login-otp"
            name="otp"
            label="Verification code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={FIELD_LIMITS.otp}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, FIELD_LIMITS.otp));
              if (fieldError) setFieldError(null);
            }}
            onBlur={() => {
              if (code) setFieldError(validateOtpCode(code) ?? null);
            }}
            error={fieldError ?? undefined}
          />
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            <Button type="submit" loading={loading} block>
              Verify and continue
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || resendSeconds > 0}
              onClick={() => requestOtp()}
            >
              {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
            </Button>
            <button
              type="button"
              className="png-link type-small"
              onClick={() => {
                setStep("phone");
                setCode("");
                setChallengeId(null);
                setError(null);
                setFieldError(null);
                setDevelopmentCode(null);
              }}
            >
              Use a different number
            </button>
          </div>
        </form>
      )}

      <p className="type-small" style={{ margin: "24px 0 0", color: "var(--color-text-secondary)" }}>
        By continuing you agree to the{" "}
        <Link className="png-link" href="/legal/terms">
          Terms
        </Link>{" "}
        and{" "}
        <Link className="png-link" href="/legal/privacy">
          Privacy
        </Link>{" "}
        drafts. Plug and Go does not offer social login on this site.
      </p>
    </div>
  );
}
