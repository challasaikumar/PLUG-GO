"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { SelectField } from "@/components/forms/Fields";
import { CONNECTOR_TYPES } from "@/lib/catalogue/validation";
import { connectorTypeLabel } from "@/lib/catalogue/labels";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import {
  parseVehicleInput,
  VEHICLE_MAKE_MAX,
  VEHICLE_MODEL_MAX,
  VEHICLE_NICKNAME_MAX,
} from "@/lib/account/vehicle-input";

export type VehicleRow = {
  id: string;
  make: string;
  model: string;
  connectorType: string;
  batteryKwh: number | null;
  nickname: string | null;
};

type VehiclesManagerProps = {
  initialVehicles: VehicleRow[];
};

const empty = {
  make: "",
  model: "",
  connectorType: "ccs2",
  batteryKwh: "",
  nickname: "",
};

export function VehiclesManager({ initialVehicles }: VehiclesManagerProps) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (editingId ? "Edit vehicle" : "Add a vehicle"), [editingId]);

  function payload() {
    return {
      make: form.make,
      model: form.model,
      connectorType: form.connectorType,
      batteryKwh: form.batteryKwh === "" ? null : Number.parseInt(form.batteryKwh, 10),
      nickname: form.nickname || null,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseVehicleInput(payload());
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setMessage("Please correct the highlighted fields.");
      return;
    }
    setLoading(true);
    setErrors({});
    setMessage(null);
    try {
      const response = await fetch(editingId ? `/api/account/vehicles/${editingId}` : "/api/account/vehicles", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload()),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; errors?: Record<string, string>; vehicle?: VehicleRow }
        | null;
      if (!response.ok || !body?.ok || !body.vehicle) {
        setErrors(body?.errors ?? {});
        setMessage(body?.error || "The vehicle could not be saved.");
        return;
      }
      if (editingId) {
        setVehicles((current) => current.map((row) => (row.id === editingId ? body.vehicle! : row)));
      } else {
        setVehicles((current) => [...current, body.vehicle!]);
        track(ANALYTICS_EVENTS.vehicle_added, { connector_type: body.vehicle.connectorType });
      }
      setForm(empty);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/account/vehicles/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setMessage("That vehicle could not be removed.");
        return;
      }
      setVehicles((current) => current.filter((row) => row.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(empty);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {message ? <Alert variant="error">{message}</Alert> : null}
      <Alert variant="info" title="Compatibility is advisory">
        Connector preference helps you filter later. It does not silently hide stations, and it is not a verified
        compatibility guarantee unless the station data says it was verified.
      </Alert>
      {vehicles.length === 0 ? (
        <p className="type-body" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          No vehicles saved yet. Add one to remember connector preference.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="paper-card" style={{ padding: 16 }}>
              <p className="type-h3" style={{ margin: "0 0 4px" }}>
                {vehicle.nickname || `${vehicle.make} ${vehicle.model}`}
              </p>
              <p className="type-small" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                {vehicle.make} {vehicle.model} · {connectorTypeLabel(vehicle.connectorType)}
                {vehicle.batteryKwh ? ` · ${vehicle.batteryKwh} kWh` : ""}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(vehicle.id);
                    setForm({
                      make: vehicle.make,
                      model: vehicle.model,
                      connectorType: vehicle.connectorType,
                      batteryKwh: vehicle.batteryKwh ? String(vehicle.batteryKwh) : "",
                      nickname: vehicle.nickname ?? "",
                    });
                  }}
                >
                  Edit
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => remove(vehicle.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="paper-card" style={{ padding: 20, display: "grid", gap: 16 }} onSubmit={submit}>
        <h2 className="type-h3" style={{ margin: 0 }}>
          {title}
        </h2>
        <TextInput
          id="vehicle-make"
          label="Make"
          required
          maxLength={VEHICLE_MAKE_MAX}
          value={form.make}
          onChange={(event) => {
            setForm((current) => ({ ...current, make: event.target.value }));
            setErrors((current) => ({ ...current, make: "" }));
          }}
          error={errors.make}
          autoComplete="off"
        />
        <TextInput
          id="vehicle-model"
          label="Model"
          required
          maxLength={VEHICLE_MODEL_MAX}
          value={form.model}
          onChange={(event) => {
            setForm((current) => ({ ...current, model: event.target.value }));
            setErrors((current) => ({ ...current, model: "" }));
          }}
          error={errors.model}
          autoComplete="off"
        />
        <SelectField
          id="vehicle-connector"
          label="Connector type"
          required
          value={form.connectorType}
          onChange={(event) => setForm((current) => ({ ...current, connectorType: event.target.value }))}
          error={errors.connectorType}
        >
          {CONNECTOR_TYPES.filter((type) => type !== "unknown").map((type) => (
            <option key={type} value={type}>
              {connectorTypeLabel(type)}
            </option>
          ))}
        </SelectField>
        <TextInput
          id="vehicle-battery"
          label="Battery capacity (kWh, optional)"
          inputMode="numeric"
          maxLength={3}
          value={form.batteryKwh}
          onChange={(event) => {
            setForm((current) => ({ ...current, batteryKwh: event.target.value }));
            setErrors((current) => ({ ...current, batteryKwh: "" }));
          }}
          error={errors.batteryKwh}
          help="Whole number from 1 to 300, or leave blank."
        />
        <TextInput
          id="vehicle-nickname"
          label="Nickname (optional)"
          maxLength={VEHICLE_NICKNAME_MAX}
          value={form.nickname}
          onChange={(event) => {
            setForm((current) => ({ ...current, nickname: event.target.value }));
            setErrors((current) => ({ ...current, nickname: "" }));
          }}
          error={errors.nickname}
          help="A private label such as “family car”. Do not store a registration number unless you need it."
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button type="submit" loading={loading}>
            {editingId ? "Save changes" : "Add vehicle"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(empty);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
