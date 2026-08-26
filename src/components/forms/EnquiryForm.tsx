"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldRequired } from "@/components/ui/FieldRequired";
import { TextInput } from "@/components/ui/TextInput";
import {
  CONTACT_REASONS,
  SUPPORT_TOPICS,
  contactReasonLabel,
  supportTopicLabel,
  validateEnquiry,
  type EnquiryFieldErrors,
  type EnquiryKind,
} from "@/lib/enquiry";
import { FIELD_LIMITS } from "@/lib/fields";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { CheckboxField, SelectField, TextAreaField } from "./Fields";

type EnquiryFormProps = {
  kind: EnquiryKind;
  deliveryConfigured: boolean;
  defaultReason?: string;
  defaultStationId?: string;
  defaultEmail?: string;
  submitLabel?: string;
  compact?: boolean;
};

const empty = {
  reason: "",
  name: "",
  email: "",
  phone: "",
  message: "",
  organisation: "",
  city: "",
  vehicleOrBays: "",
  stationId: "",
  sessionId: "",
  website: "",
  consent: false,
};

export function EnquiryForm({
  kind,
  deliveryConfigured,
  defaultReason = "",
  defaultStationId = "",
  defaultEmail = "",
  submitLabel = "Send enquiry",
  compact = false,
}: EnquiryFormProps) {
  const [fields, setFields] = useState({
    ...empty,
    reason: defaultReason,
    stationId: defaultStationId,
    email: defaultEmail,
  });
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLead = kind === "fleet" || kind === "workplace" || kind === "host";
  const isSupport = kind === "support";
  const isContact = kind === "contact";

  function payload() {
    return {
      kind,
      reason: fields.reason || undefined,
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      message: fields.message,
      organisation: fields.organisation || undefined,
      city: fields.city || undefined,
      vehicleOrBays: fields.vehicleOrBays || undefined,
      stationId: fields.stationId || undefined,
      sessionId: fields.sessionId || undefined,
      consent: fields.consent,
      website: fields.website,
    };
  }

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as keyof EnquiryFieldErrors];
      return next;
    });
  }

  function blurField(key: keyof EnquiryFieldErrors) {
    const client = validateEnquiry(payload());
    const nextError = client.ok ? undefined : client.errors[key];
    setErrors((current) => {
      const next = { ...current };
      if (nextError) next[key] = nextError;
      else delete next[key];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSuccess(false);
    setFormError(null);

    const client = validateEnquiry(payload());
    if (!client.ok) {
      setErrors(client.errors);
      setFormError(client.formError);
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
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
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: EnquiryFieldErrors;
      };

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.error ?? "The enquiry was not sent.");
        return;
      }

      setSuccess(true);
      setFields({ ...empty, reason: defaultReason, stationId: defaultStationId, email: defaultEmail });
      if (kind === "fleet") track(ANALYTICS_EVENTS.fleet_lead_started);
      else if (kind === "host") track(ANALYTICS_EVENTS.host_lead_started);
      else if (kind === "workplace") track(ANALYTICS_EVENTS.workplace_lead_started);
      else if (kind === "support") track(ANALYTICS_EVENTS.support_opened);
      else track(ANALYTICS_EVENTS.lead_started, { audience: fields.reason });
      track(ANALYTICS_EVENTS.lead_qualified, { kind });
    } catch {
      setFormError("The enquiry was not sent. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="enquiry-form">
      {!deliveryConfigured ? (
        <Alert variant="warning" title="Delivery not configured">
          Enquiries will not be sent until a server-side webhook is set. You can still review the form; submit will fail clearly rather than pretend success.
        </Alert>
      ) : null}

      {success ? (
        <Alert variant="success" title="Enquiry sent">
          We received your message. We’ll use this email or phone to reply. No response time is published yet.
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Not sent">
          {formError}
        </Alert>
      ) : null}

      <div className="honeypot visually-hidden" aria-hidden="true">
        <label htmlFor={`${kind}-website`}>Website</label>
        <input
          id={`${kind}-website`}
          name="website"
          value={fields.website}
          onChange={(event) => set("website", event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {isContact ? (
        <fieldset className="reason-pills">
          <legend className="field-label">
            Reason
            <FieldRequired />
          </legend>
          <div className="reason-pills__list">
            {CONTACT_REASONS.map((reason) => (
              <label key={reason} className={fields.reason === reason ? "is-on" : undefined}>
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  required
                  checked={fields.reason === reason}
                  aria-invalid={errors.reason ? true : undefined}
                  onChange={() => set("reason", reason)}
                  onBlur={() => blurField("reason")}
                />
                {contactReasonLabel(reason)}
              </label>
            ))}
          </div>
          {errors.reason ? <p className="field-error">{errors.reason}</p> : null}
        </fieldset>
      ) : null}

      {isSupport ? (
        <SelectField
          label="Help path"
          name="reason"
          required
          value={fields.reason}
          error={errors.reason}
          onChange={(event) => set("reason", event.target.value)}
          onBlur={() => blurField("reason")}
        >
          <option value="">Select what went wrong</option>
          {SUPPORT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {supportTopicLabel(topic)}
            </option>
          ))}
        </SelectField>
      ) : null}

      {isLead ? (
        <div className="enquiry-form__row">
          <TextInput
            label={kind === "host" ? "Property or organisation" : "Organisation"}
            name="organisation"
            required
            maxLength={FIELD_LIMITS.organisation}
            autoComplete="organization"
            value={fields.organisation}
            error={errors.organisation}
            onChange={(event) => set("organisation", event.target.value)}
            onBlur={() => blurField("organisation")}
          />
          <TextInput
            label="City"
            name="city"
            required
            maxLength={FIELD_LIMITS.city}
            autoComplete="address-level2"
            value={fields.city}
            error={errors.city}
            onChange={(event) => set("city", event.target.value)}
            onBlur={() => blurField("city")}
          />
        </div>
      ) : null}

      <div className="enquiry-form__row">
        <TextInput
          label="Your name"
          name="name"
          required
          maxLength={FIELD_LIMITS.name}
          autoComplete="name"
          autoCapitalize="words"
          value={fields.name}
          error={errors.name}
          onChange={(event) => set("name", event.target.value)}
          onBlur={() => blurField("name")}
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          required
          maxLength={FIELD_LIMITS.email}
          autoComplete="email"
          inputMode="email"
          value={fields.email}
          error={errors.email}
          onChange={(event) => set("email", event.target.value)}
          onBlur={() => blurField("email")}
        />
      </div>
      {kind === "host" ? (
        <div className="enquiry-form__row">
          <TextInput
            label="Mobile"
            name="phone"
            type="tel"
            required
            maxLength={FIELD_LIMITS.phone}
            inputMode="tel"
            autoComplete="tel"
            value={fields.phone}
            error={errors.phone}
            help="10-digit Indian mobile number."
            onChange={(event) => set("phone", event.target.value)}
            onBlur={() => blurField("phone")}
          />
          <TextInput
            label="Approximate bays (optional)"
            name="vehicleOrBays"
            maxLength={FIELD_LIMITS.vehicleOrBays}
            inputMode="numeric"
            value={fields.vehicleOrBays}
            error={errors.vehicleOrBays}
            help="A number or range, for example 8 or 4-12."
            onChange={(event) => set("vehicleOrBays", event.target.value)}
            onBlur={() => blurField("vehicleOrBays")}
          />
        </div>
      ) : (
        <>
          <TextInput
            label="Mobile"
            name="phone"
            type="tel"
            required
            maxLength={FIELD_LIMITS.phone}
            inputMode="tel"
            autoComplete="tel"
            value={fields.phone}
            error={errors.phone}
            help="10-digit Indian mobile number."
            onChange={(event) => set("phone", event.target.value)}
            onBlur={() => blurField("phone")}
          />
          {isLead && !compact ? (
            <TextInput
              label="Vehicle count range (optional)"
              name="vehicleOrBays"
              maxLength={FIELD_LIMITS.vehicleOrBays}
              inputMode="numeric"
              value={fields.vehicleOrBays}
              error={errors.vehicleOrBays}
              help="A number or range, for example 8 or 4-12."
              onChange={(event) => set("vehicleOrBays", event.target.value)}
              onBlur={() => blurField("vehicleOrBays")}
            />
          ) : null}
        </>
      )}

      {isSupport ? (
        <div className="enquiry-form__optional">
          <p className="enquiry-form__optional-title">Station or session</p>
          <p className="enquiry-form__optional-help">
            Optional. Add a reference only if you already have one. Do not invent one. Live sessions are not on this website yet.
          </p>
          <div className="enquiry-form__row">
            <TextInput
              label="Station ID"
              name="stationId"
              maxLength={FIELD_LIMITS.stationRef}
              value={fields.stationId}
              error={errors.stationId}
              className="font-mono"
              help="From a page or sign, if you have it."
              onChange={(event) => set("stationId", event.target.value)}
              onBlur={() => blurField("stationId")}
            />
            <TextInput
              label="Session reference"
              name="sessionId"
              maxLength={FIELD_LIMITS.stationRef}
              value={fields.sessionId}
              error={errors.sessionId}
              help="Only if you have one from another channel."
              onChange={(event) => set("sessionId", event.target.value)}
              onBlur={() => blurField("sessionId")}
            />
          </div>
        </div>
      ) : null}

      <TextAreaField
        label="Message"
        name="message"
        required
        minLength={FIELD_LIMITS.messageMin}
        maxLength={FIELD_LIMITS.messageMax}
        value={fields.message}
        error={errors.message}
        rows={4}
        help={`At least ${FIELD_LIMITS.messageMin} characters. Describe what you need.`}
        onChange={(event) => set("message", event.target.value)}
        onBlur={() => blurField("message")}
      />

      <CheckboxField
        name="consent"
        required
        checked={fields.consent}
        error={errors.consent}
        onChange={(checked) => set("consent", checked)}
        onBlur={() => blurField("consent")}
        label={
          <>
            I agree that Plug and Go may use this name, email, and number to reply to this enquiry. See the{" "}
            <a className="png-link" href="/legal/privacy">
              privacy notice
            </a>{" "}
            (draft).
          </>
        }
      />

      <Button type="submit" loading={loading} disabled={loading} block>
        {submitLabel}
      </Button>
    </form>
  );
}
