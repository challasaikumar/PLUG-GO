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
      <label htmlFor="footer-email">
        Signup Our Newsletter
        <FieldRequired />
      </label>
      <div className="footer-news__row">
        <input
          id="footer-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
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
        <button type="submit">Send</button>
      </div>
      {error ? (
        <p className="field-error" id="footer-email-error" role="alert">
          {error}
        </p>
      ) : (
        <p id="footer-email-help">Opens the contact form. A mailing list is not configured yet.</p>
      )}
    </form>
  );
}
