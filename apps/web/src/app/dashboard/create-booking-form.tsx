"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Card } from "@brisa/ui";
import type { PropertySummary, ServiceSummary } from "@/server/api/client";
import type { CreateBookingState } from "./actions";
import { createBooking } from "./actions";

interface CreateBookingFormProps {
  services: ServiceSummary[];
  properties: PropertySummary[];
}

const initialState: CreateBookingState = { ok: false, checkoutUrl: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" intent="primary" disabled={pending}>
      {pending ? "Creando…" : "Crear reserva"}
    </Button>
  );
}

export function CreateBookingForm({
  services,
  properties,
}: CreateBookingFormProps) {
  const [state, action] = useFormState(createBooking, initialState);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok && state.checkoutUrl) {
      window.location.assign(state.checkoutUrl);
      return;
    }

    if (state.ok) {
      setFeedback("Reserva creada exitosamente.");
    } else if (state.error) {
      setFeedback(state.error);
    }
  }, [state]);

  return (
    <Card
      title="Crear nueva reserva"
      description="Agenda un servicio para tus propiedades registradas."
    >
      <form action={action} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-200">
          <span>Propiedad</span>
          <select
            name="propertyId"
            defaultValue=""
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
            required
          >
            <option value="" disabled>
              Selecciona propiedad
            </option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.city
                  ? `${property.name} · ${property.city}`
                  : property.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-200">
          <span>Servicio</span>
          <select
            name="serviceId"
            defaultValue=""
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
            required
          >
            <option value="" disabled>
              Selecciona servicio
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {`${service.name} · ${service.basePrice.toFixed(2)} USD`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-200">
          <span>Fecha y hora</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-200">
          <span>Notas (opcional)</span>
          <textarea
            name="notes"
            rows={3}
            placeholder="Instrucciones específicas, acceso, materiales…"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          />
        </label>

        {feedback ? (
          <p
            className={`text-sm ${state.ok ? "text-teal-200" : "text-rose-300"}`}
            role={state.ok ? "status" : "alert"}
          >
            {feedback}
          </p>
        ) : null}

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </Card>
  );
}
