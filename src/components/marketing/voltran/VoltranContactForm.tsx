"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TextAreaField } from "@/components/forms/Fields";
import { validateEnquiry, type EnquiryFieldErrors } from "@/lib/enquiry";
import { FIELD_LIMITS } from "@/lib/fields";

export function VoltranContactForm({
  deliveryConfigured: _deliveryConfigured,
  defaultEmail = "",
}: {
  deliveryConfigured: boolean;
  defaultEmail?: string;
}) {
  const [fields, setFields] = useState({
    name: "",
    email: defaultEmail,
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function payload() {
    return {
      kind: "contact" as const,
      reason: "general_enquiry",
      name: fields.name,
      email: fields.email,
      phone: "",
      message: fields.message,
      consent: true,
      website: fields.website,
    };
  }

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    setFormError(null);
    const client = validateEnquiry(payload());
    if (!client.ok) {
      setErrors(client.errors);
      setFormError(client.formError);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; errors?: EnquiryFieldErrors };
      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.error ?? "The enquiry was not sent.");
        return;
      }
      setSuccess(true);
      setFields({ name: "", email: defaultEmail, message: "", website: "" });
    } catch {
      setFormError("The enquiry was not sent. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="vt-contact-form">
      {success ? (
        <Alert variant="success" title="Message sent">
          We received your message. We’ll use this email to reply.
        </Alert>
      ) : null}
      {formError ? (
        <Alert variant="error" title="Not sent">
          {formError}
        </Alert>
      ) : null}

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          value={fields.website}
          onChange={(event) => set("website", event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="vt-contact-form__pair">
        <TextInput
          label="Name"
          name="name"
          required
          maxLength={FIELD_LIMITS.name}
          autoComplete="name"
          placeholder="Enter your name"
          value={fields.name}
          error={errors.name}
          onChange={(event) => set("name", event.target.value)}
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          required
          maxLength={FIELD_LIMITS.email}
          autoComplete="email"
          placeholder="Enter your email"
          value={fields.email}
          error={errors.email}
          onChange={(event) => set("email", event.target.value)}
        />
      </div>
      <TextAreaField
        label="Message"
        name="message"
        required
        minLength={FIELD_LIMITS.messageMin}
        maxLength={FIELD_LIMITS.messageMax}
        rows={4}
        placeholder="Enter your message"
        value={fields.message}
        error={errors.message}
        onChange={(event) => set("message", event.target.value)}
      />
      <Button type="submit" loading={loading} disabled={loading} className="png-btn--pill vt-contact-form__submit">
        Submit Message
      </Button>
    </form>
  );
}
