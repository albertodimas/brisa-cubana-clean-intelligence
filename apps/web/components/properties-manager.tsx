"use client";

import { useState, useTransition } from "react";
import type { Property, Customer, PaginationInfo } from "@/lib/api";
import { Button } from "./ui/button";
import { Pagination } from "./ui/pagination";
import { Skeleton } from "./ui/skeleton";

type ActionResult = {
  success?: string;
  error?: string;
};

type PropertiesManagerProps = {
  properties: Property[];
  customers: Customer[];
  createProperty: (formData: FormData) => Promise<ActionResult>;
  updateProperty: (
    propertyId: string,
    formData: FormData,
  ) => Promise<ActionResult>;
  onToast: (message: string, type: "success" | "error") => void;
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
};

export function PropertiesManager({
  properties,
  customers,
  createProperty,
  updateProperty,
  onToast,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRefresh,
}: PropertiesManagerProps) {
  const [propertyUpdatingId, setPropertyUpdatingId] = useState<string | null>(
    null,
  );
  const [isPropertyPending, startPropertyAction] = useTransition();

  async function handlePropertyUpdate(propertyId: string, formData: FormData) {
    setPropertyUpdatingId(propertyId);
    const result = await updateProperty(propertyId, formData);
    setPropertyUpdatingId(null);
    if (result.error) {
      onToast(result.error, "error");
    } else if (result.success) {
      onToast(result.success, "success");
      await onRefresh();
    }
  }

  return (
    <>
      {/* Create Property Form */}
      <form
        className="ui-panel-surface ui-panel-surface--muted grid gap-4"
        action={(formData) =>
          startPropertyAction(async () => {
            const result = await createProperty(formData);
            if (result.error) {
              onToast(result.error, "error");
            } else if (result.success) {
              onToast(result.success, "success");
              await onRefresh();
            }
          })
        }
      >
        <h3 className="ui-section-title">Registrar propiedad</h3>
        <label className="ui-field">
          <span className="ui-field__label">Nombre interno</span>
          <input
            name="propertyLabel"
            required
            placeholder="Ej. Brickell Loft"
            className="ui-input"
          />
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Dirección</span>
          <input
            name="propertyAddress"
            required
            placeholder="Calle, número"
            className="ui-input"
          />
        </label>
        <div className="ui-grid-responsive-sm">
          <label className="ui-field">
            <span className="ui-field__label">Ciudad</span>
            <input name="propertyCity" required className="ui-input" />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Estado</span>
            <input
              name="propertyState"
              required
              maxLength={2}
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">ZIP</span>
            <input name="propertyZip" required className="ui-input" />
          </label>
        </div>
        <label className="ui-field">
          <span className="ui-field__label">Tipo</span>
          <select name="propertyType" className="ui-input">
            <option value="RESIDENTIAL">Residencial</option>
            <option value="VACATION_RENTAL">Vacation Rental</option>
            <option value="OFFICE">Oficina</option>
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Propietario</span>
          <select name="propertyOwner" required className="ui-input">
            <option value="">Selecciona cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName ?? customer.email}
              </option>
            ))}
          </select>
        </label>
        <div className="ui-grid-responsive-sm">
          <label className="ui-field">
            <span className="ui-field__label">Habitaciones</span>
            <input
              name="propertyBedrooms"
              type="number"
              min="0"
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Baños</span>
            <input
              name="propertyBathrooms"
              type="number"
              min="0"
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Metros cuadrados</span>
            <input
              name="propertySqft"
              type="number"
              min="0"
              className="ui-input"
            />
          </label>
        </div>
        <label className="ui-field">
          <span className="ui-field__label">Notas</span>
          <textarea
            name="propertyNotes"
            rows={3}
            placeholder="Notas operativas"
            className="ui-input ui-input--textarea"
          />
        </label>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="max-w-fit"
          isLoading={isPropertyPending}
        >
          {isPropertyPending ? "Registrando..." : "Guardar propiedad"}
        </Button>
      </form>

      {/* Manage Properties List */}
      <section className="ui-stack">
        <h3 className="ui-section-title">Inventario de propiedades</h3>
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="ui-panel-surface">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <p className="ui-helper-text">
            Aún no tienes propiedades registradas.
          </p>
        ) : (
          <div className="ui-stack">
            {properties.map((property) => (
              <form
                key={property.id}
                className="ui-panel-surface ui-panel-surface--muted grid gap-4"
                action={async (formData) => {
                  await handlePropertyUpdate(property.id, formData);
                }}
              >
                <div className="ui-flex-between">
                  <div className="flex flex-col gap-1">
                    <strong>{property.label}</strong>
                    <span className="ui-caption">
                      {property.addressLine}, {property.city}, {property.state}{" "}
                      {property.zipCode}
                    </span>
                  </div>
                  <span className="ui-caption text-brisa-300">
                    Propietario:{" "}
                    {property.owner?.fullName ?? property.owner?.email ?? "N/A"}
                  </span>
                </div>
                <div className="ui-grid-responsive">
                  <label className="ui-field">
                    <span className="ui-field__label">Nombre interno</span>
                    <input
                      name="propertyLabel"
                      defaultValue={property.label}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Dirección</span>
                    <input
                      name="propertyAddress"
                      defaultValue={property.addressLine}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Ciudad</span>
                    <input
                      name="propertyCity"
                      defaultValue={property.city}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Estado</span>
                    <input
                      name="propertyState"
                      defaultValue={property.state}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">ZIP</span>
                    <input
                      name="propertyZip"
                      defaultValue={property.zipCode}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Tipo</span>
                    <select
                      name="propertyType"
                      defaultValue={property.type}
                      className="ui-input"
                    >
                      <option value="RESIDENTIAL">Residencial</option>
                      <option value="VACATION_RENTAL">Vacation Rental</option>
                      <option value="OFFICE">Oficina</option>
                    </select>
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Habitaciones</span>
                    <input
                      name="propertyBedrooms"
                      type="number"
                      min="0"
                      defaultValue={property.bedrooms ?? ""}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Baños</span>
                    <input
                      name="propertyBathrooms"
                      type="number"
                      min="0"
                      defaultValue={property.bathrooms ?? ""}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Metros cuadrados</span>
                    <input
                      name="propertySqft"
                      type="number"
                      min="0"
                      defaultValue={property.sqft ?? ""}
                      className="ui-input"
                    />
                  </label>
                </div>
                <label className="ui-field">
                  <span className="ui-field__label">Notas</span>
                  <textarea
                    name="propertyNotes"
                    rows={2}
                    defaultValue={property.notes ?? ""}
                    className="ui-input ui-input--textarea"
                  />
                </label>
                <label className="ui-field">
                  <span className="ui-field__label">Propietario</span>
                  <select
                    name="propertyOwner"
                    defaultValue={property.ownerId}
                    className="ui-input"
                  >
                    <option value="">Mantener actual</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName ?? customer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="max-w-fit"
                  isLoading={propertyUpdatingId === property.id}
                >
                  {propertyUpdatingId === property.id
                    ? "Guardando..."
                    : "Actualizar propiedad"}
                </Button>
              </form>
            ))}
            <Pagination
              count={properties.length}
              hasMore={pageInfo.hasMore}
              isLoading={isLoadingMore}
              onLoadMore={onLoadMore}
              label="propiedades"
            />
          </div>
        )}
      </section>
    </>
  );
}
