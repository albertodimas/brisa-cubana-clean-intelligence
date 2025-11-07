"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import type { Property, Customer, PaginationInfo } from "@/lib/api";
import { Button } from "./ui/button";
import { ExportButton } from "./ui/export-button";
import { FilterChips, type FilterChip } from "./ui/filter-chips";
import { Pagination } from "./ui/pagination";
import { SearchBar } from "./ui/search-bar";
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
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residencial",
  VACATION_RENTAL: "Alquiler vacacional",
  OFFICE: "Oficina",
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
  currentQuery,
  setQuery,
  resetQuery,
}: PropertiesManagerProps) {
  const [propertyUpdatingId, setPropertyUpdatingId] = useState<string | null>(
    null,
  );
  const [isPropertyPending, startPropertyAction] = useTransition();
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );
  const [cityFilter, setCityFilter] = useState<string>(
    typeof currentQuery.city === "string" ? String(currentQuery.city) : "",
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    typeof currentQuery.type === "string" ? String(currentQuery.type) : "",
  );

  useEffect(() => {
    const nextSearch =
      typeof currentQuery.search === "string"
        ? String(currentQuery.search)
        : "";
    setSearchTerm((prev) => (prev === nextSearch ? prev : nextSearch));

    const nextCity =
      typeof currentQuery.city === "string" ? String(currentQuery.city) : "";
    setCityFilter((prev) => (prev === nextCity ? prev : nextCity));

    const nextType =
      typeof currentQuery.type === "string" ? String(currentQuery.type) : "";
    setTypeFilter((prev) => (prev === nextType ? prev : nextType));
  }, [currentQuery]);

  useEffect(() => {
    const query: QueryParams = {};
    if (searchTerm.trim()) {
      query.search = searchTerm.trim();
    }
    if (cityFilter) {
      query.city = cityFilter;
    }
    if (typeFilter) {
      query.type = typeFilter;
    }
    void setQuery(query);
  }, [cityFilter, searchTerm, setQuery, typeFilter]);

  const cityOptions = useMemo(() => {
    const unique = new Set<string>();
    properties.forEach((property) => {
      if (property.city) {
        unique.add(property.city);
      }
    });
    if (cityFilter && !unique.has(cityFilter)) {
      unique.add(cityFilter);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [properties, cityFilter]);

  const typeOptions = useMemo(() => {
    const baseTypes = ["RESIDENTIAL", "VACATION_RENTAL", "OFFICE"];
    const unique = new Set<string>(baseTypes);
    properties.forEach((property) => {
      if (property.type) {
        unique.add(property.type);
      }
    });
    if (typeFilter && !unique.has(typeFilter)) {
      unique.add(typeFilter);
    }
    return Array.from(unique);
  }, [properties, typeFilter]);

  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (searchTerm.trim()) {
      chips.push({
        key: "search",
        label: "Búsqueda",
        value: searchTerm.trim(),
      });
    }
    if (cityFilter) {
      chips.push({ key: "city", label: "Ciudad", value: cityFilter });
    }
    if (typeFilter) {
      chips.push({
        key: "type",
        label: "Tipo",
        value: PROPERTY_TYPE_LABELS[typeFilter] ?? typeFilter,
      });
    }
    return chips;
  }, [cityFilter, searchTerm, typeFilter]);

  const handleRemoveFilter = (key: string) => {
    if (key === "search") {
      setSearchTerm("");
    }
    if (key === "city") {
      setCityFilter("");
    }
    if (key === "type") {
      setTypeFilter("");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCityFilter("");
    setTypeFilter("");
    void resetQuery();
  };

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
    <section className="ui-stack" data-testid="panel-section-properties">
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
            placeholder="Ej. Skyline Loft Brickell"
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="ui-section-title">Inventario de propiedades</h3>
          <ExportButton
            data={properties}
            filename={`propiedades-${new Date().toISOString().split("T")[0]}`}
            resourceType="properties"
            testId="export-properties-csv"
            columns={[
              { key: "id", label: "ID" },
              { key: "label", label: "Nombre" },
              {
                key: "type",
                label: "Tipo",
                transform: (p) => PROPERTY_TYPE_LABELS[p.type] ?? p.type,
              },
              { key: "city", label: "Ciudad" },
              {
                key: "owner",
                label: "Propietario",
                transform: (p) =>
                  p.owner?.fullName ?? p.owner?.email ?? "Sin propietario",
              },
              {
                key: "bedrooms",
                label: "Habitaciones",
                transform: (p) => String(p.bedrooms ?? ""),
              },
              {
                key: "bathrooms",
                label: "Baños",
                transform: (p) => String(p.bathrooms ?? ""),
              },
              {
                key: "sqft",
                label: "M²",
                transform: (p) => String(p.sqft ?? ""),
              },
              { key: "notes", label: "Notas", transform: (p) => p.notes ?? "" },
            ]}
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar propiedades..."
              isLoading={isLoading}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="ui-field w-full sm:w-48">
              <span className="ui-field__label">Filtrar por ciudad</span>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="ui-input"
              >
                <option value="">Todas</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="ui-field w-full sm:w-56">
              <span className="ui-field__label">Filtrar por tipo</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="ui-input"
              >
                <option value="">Todos los tipos</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {PROPERTY_TYPE_LABELS[type] ?? type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <FilterChips
          filters={filterChips}
          onRemove={handleRemoveFilter}
          onClearAll={filterChips.length > 1 ? handleClearFilters : undefined}
        />
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
            {filterChips.length > 0
              ? "No se encontraron propiedades para los filtros seleccionados."
              : "Aún no tienes propiedades registradas."}
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
                    <Link
                      href={{
                        pathname: "/panel/properties/[id]",
                        query: { id: property.id },
                      }}
                      className="hover:underline"
                    >
                      <strong>{property.label}</strong>
                    </Link>
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
    </section>
  );
}
