"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@brisa/ui";
import { Calendar, MapPin, Clock, DollarSign } from "lucide-react";
import type { Service, Property } from "@/types/api";

interface BookingFormProps {
  accessToken: string;
  userId: string;
  services: Service[];
  properties: Property[];
}

export default function BookingForm({
  accessToken,
  userId,
  services,
  properties,
}: BookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    serviceId: "",
    propertyId: "",
    scheduledAt: "",
    notes: "",
  });

  const selectedService = services.find((s) => s.id === formData.serviceId);
  const selectedProperty = properties.find((p) => p.id === formData.propertyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const payload = {
        userId,
        serviceId: formData.serviceId,
        propertyId: formData.propertyId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        ...(formData.notes && { notes: formData.notes }),
      };

      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message ?? "Error al crear reserva");
      }

      router.push("/dashboard/bookings?created=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date/time for scheduling (at least 2 hours from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Service Selection */}
          <div>
            <label
              htmlFor="serviceId"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Servicio *
            </label>
            <select
              id="serviceId"
              required
              value={formData.serviceId}
              onChange={(e) =>
                setFormData({ ...formData, serviceId: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Selecciona un servicio</option>
              {services
                .filter((s) => s.active)
                .map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${Number(service.basePrice).toFixed(2)} (
                    {service.duration} min)
                  </option>
                ))}
            </select>

            {selectedService && (
              <div className="mt-3 p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">
                      {selectedService.name}
                    </h4>
                    {selectedService.description && (
                      <p className="mt-1 text-sm text-neutral-400">
                        {selectedService.description}
                      </p>
                    )}
                  </div>
                  <Badge tone="teal">
                    ${Number(selectedService.basePrice).toFixed(2)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedService.duration} minutos
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Property Selection */}
          <div>
            <label
              htmlFor="propertyId"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Propiedad *
            </label>
            <select
              id="propertyId"
              required
              value={formData.propertyId}
              onChange={(e) =>
                setFormData({ ...formData, propertyId: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Selecciona una propiedad</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.address}
                </option>
              ))}
            </select>

            {selectedProperty && (
              <div className="mt-3 p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                <h4 className="font-semibold text-white">
                  {selectedProperty.name}
                </h4>
                <p className="mt-1 text-sm text-neutral-400 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedProperty.address}, {selectedProperty.city},{" "}
                  {selectedProperty.state} {selectedProperty.zipCode}
                </p>
              </div>
            )}
          </div>

          {/* Scheduled Date/Time */}
          <div>
            <label
              htmlFor="scheduledAt"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Fecha y Hora *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                id="scheduledAt"
                type="datetime-local"
                required
                min={getMinDateTime()}
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledAt: e.target.value })
                }
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Las reservas deben agendarse con al menos 2 horas de anticipación
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Notas adicionales
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Instrucciones especiales, códigos de acceso, etc..."
            />
          </div>

          {/* Summary */}
          {selectedService && selectedProperty && formData.scheduledAt && (
            <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/50">
              <h4 className="font-semibold text-teal-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumen de la Reserva
              </h4>
              <div className="mt-3 space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Servicio:</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Propiedad:</span>
                  <span className="font-medium">{selectedProperty.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span className="font-medium">
                    {new Date(formData.scheduledAt).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-teal-500/30">
                  <span className="font-semibold">Precio Base:</span>
                  <span className="font-semibold text-teal-300">
                    ${Number(selectedService.basePrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" intent="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Confirmar Reserva"}
          </Button>
          <Button
            type="button"
            intent="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
