"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@brisa/ui";
import type { Property, PropertyType } from "@/types/api";

interface PropertyFormProps {
  accessToken: string;
  property?: Property;
}

export default function PropertyForm({
  accessToken,
  property,
}: PropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: property?.name ?? "",
    address: property?.address ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    zipCode: property?.zipCode ?? "",
    type: property?.type ?? ("RESIDENTIAL" as PropertyType),
    size: property?.size?.toString() ?? "",
    bedrooms: property?.bedrooms?.toString() ?? "",
    bathrooms: property?.bathrooms?.toString() ?? "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const payload = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        type: formData.type,
        ...(formData.size && { size: parseInt(formData.size, 10) }),
        ...(formData.bedrooms && { bedrooms: parseInt(formData.bedrooms, 10) }),
        ...(formData.bathrooms && {
          bathrooms: parseInt(formData.bathrooms, 10),
        }),
        ...(formData.notes && { notes: formData.notes }),
      };

      const url = property
        ? `${API_BASE_URL}/api/properties/${property.id}`
        : `${API_BASE_URL}/api/properties`;

      const response = await fetch(url, {
        method: property ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message ?? "Error al guardar");
      }

      router.push("/dashboard/properties");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-300"
            >
              Nombre de la propiedad *
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={255}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ej: Casa en Miami Beach"
            />
          </div>

          {/* Tipo */}
          <div className="md:col-span-2">
            <label
              htmlFor="type"
              className="block text-sm font-medium text-neutral-300"
            >
              Tipo de propiedad *
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as PropertyType,
                })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="RESIDENTIAL">Residencial</option>
              <option value="VACATION_RENTAL">Renta Vacacional</option>
              <option value="OFFICE">Oficina</option>
              <option value="HOSPITALITY">Hospitalidad</option>
            </select>
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-neutral-300"
            >
              Dirección *
            </label>
            <input
              id="address"
              type="text"
              required
              maxLength={500}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ej: 123 Ocean Drive"
            />
          </div>

          {/* Ciudad */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-neutral-300"
            >
              Ciudad *
            </label>
            <input
              id="city"
              type="text"
              required
              maxLength={100}
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Miami"
            />
          </div>

          {/* Estado */}
          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-neutral-300"
            >
              Estado *
            </label>
            <input
              id="state"
              type="text"
              required
              maxLength={100}
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="FL"
            />
          </div>

          {/* Código Postal */}
          <div>
            <label
              htmlFor="zipCode"
              className="block text-sm font-medium text-neutral-300"
            >
              Código Postal *
            </label>
            <input
              id="zipCode"
              type="text"
              required
              maxLength={20}
              value={formData.zipCode}
              onChange={(e) =>
                setFormData({ ...formData, zipCode: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="33139"
            />
          </div>

          {/* Tamaño */}
          <div>
            <label
              htmlFor="size"
              className="block text-sm font-medium text-neutral-300"
            >
              Tamaño (ft²)
            </label>
            <input
              id="size"
              type="number"
              min="1"
              value={formData.size}
              onChange={(e) =>
                setFormData({ ...formData, size: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="1500"
            />
          </div>

          {/* Habitaciones */}
          <div>
            <label
              htmlFor="bedrooms"
              className="block text-sm font-medium text-neutral-300"
            >
              Habitaciones
            </label>
            <input
              id="bedrooms"
              type="number"
              min="0"
              value={formData.bedrooms}
              onChange={(e) =>
                setFormData({ ...formData, bedrooms: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="3"
            />
          </div>

          {/* Baños */}
          <div>
            <label
              htmlFor="bathrooms"
              className="block text-sm font-medium text-neutral-300"
            >
              Baños
            </label>
            <input
              id="bathrooms"
              type="number"
              min="0"
              value={formData.bathrooms}
              onChange={(e) =>
                setFormData({ ...formData, bathrooms: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="2"
            />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-neutral-300"
            >
              Notas adicionales
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={1000}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Información adicional sobre la propiedad..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" intent="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : property
                ? "Actualizar Propiedad"
                : "Crear Propiedad"}
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
