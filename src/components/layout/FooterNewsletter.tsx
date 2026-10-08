"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FIELD_LIMITS, normalizeEmail, validateEmail } from "@/lib/fields";
import { FieldRequired } from "@/components/ui/FieldRequired";

export function FooterNewsletter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateEmail(email);
    if (issue) {
      setError(issue);
      event.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    setError(undefined);
    router.push(`/contact?email=${encodeURIComponent(normalizeEmail(email))}`);
  }

  return (
    <form className="footer-news" onSubmit={onSubmit} noValidate>
      <p className="footer-news__lead">Join our newsletter for hub updates and offers.</p>
      <label htmlFor="footer-email" className="footer-news__label">
        Email
        <FieldRequired />
      </label>
      <div className="footer-news__row">
        <input
          id="footer-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email"
          required
          maxLength={FIELD_LIMITS.email}
          value={email}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "footer-email-error" : "footer-email-help"}
          className={error ? "is-error" : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(undefined);
          }}
          onBlur={() => {
            if (email.trim()) setError(validateEmail(email));
          }}
        />
        <button type="submit">Submit</button>
      </div>
      {error ? (
        <p className="field-error" id="footer-email-error" role="alert">
          {error}
        </p>
      ) : (
        <p id="footer-email-help" className="footer-news__help">
          By subscribing, you agree to our{" "}
          <a className="png-link" href="/legal/privacy">
            Privacy Policy
          </a>{" "}
          and consent to receive updates from PLUG & GO.
        </p>
      )}
    </form>
  );
}
