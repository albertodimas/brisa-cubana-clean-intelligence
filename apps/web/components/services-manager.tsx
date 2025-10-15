"use client";

import { useFormStatus } from "react-dom";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import type { Service, PaginationInfo } from "@/lib/api";
import { Button } from "./ui/button";
import { FilterChips, type FilterChip } from "./ui/filter-chips";
import { Pagination } from "./ui/pagination";
import { SearchBar } from "./ui/search-bar";
import { Skeleton } from "./ui/skeleton";

type ActionResult = {
  success?: string;
  error?: string;
};

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando..." : children}
    </Button>
  );
}

type ServicesManagerProps = {
  services: Service[];
  createService: (formData: FormData) => Promise<ActionResult>;
  updateService: (
    serviceId: string,
    formData: FormData,
  ) => Promise<ActionResult>;
  toggleService: (serviceId: string, active: boolean) => Promise<ActionResult>;
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

export function ServicesManager({
  services,
  createService,
  updateService,
  toggleService,
  onToast,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onRefresh,
  currentQuery,
  setQuery,
  resetQuery,
}: ServicesManagerProps) {
  const [serviceUpdatingId, setServiceUpdatingId] = useState<string | null>(
    null,
  );
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(
    null,
  );
  const [isToggling, startToggle] = useTransition();
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">(
    currentQuery.active === true
      ? "true"
      : currentQuery.active === false
        ? "false"
        : "all",
  );

  useEffect(() => {
    const nextSearch =
      typeof currentQuery.search === "string"
        ? String(currentQuery.search)
        : "";
    setSearchTerm((prev) => (prev === nextSearch ? prev : nextSearch));
    const nextActive =
      currentQuery.active === true
        ? "true"
        : currentQuery.active === false
          ? "false"
          : "all";
    setActiveFilter((prev) => (prev === nextActive ? prev : nextActive));
  }, [currentQuery]);

  useEffect(() => {
    const nextQuery: QueryParams = {};
    if (searchTerm.trim()) {
      nextQuery.search = searchTerm.trim();
    }
    if (activeFilter === "true") {
      nextQuery.active = true;
    } else if (activeFilter === "false") {
      nextQuery.active = false;
    }
    void setQuery(nextQuery);
  }, [activeFilter, searchTerm, setQuery]);

  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (searchTerm.trim()) {
      chips.push({
        key: "search",
        label: "Búsqueda",
        value: searchTerm.trim(),
      });
    }
    if (activeFilter === "true" || activeFilter === "false") {
      chips.push({
        key: "active",
        label: "Estado",
        value: activeFilter === "true" ? "Activo" : "Inactivo",
      });
    }
    return chips;
  }, [activeFilter, searchTerm]);

  const handleRemoveFilter = (key: string) => {
    if (key === "search") {
      setSearchTerm("");
    }
    if (key === "active") {
      setActiveFilter("all");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveFilter("all");
    void resetQuery();
  };

  async function handleServiceUpdate(serviceId: string, formData: FormData) {
    setServiceUpdatingId(serviceId);
    const result = await updateService(serviceId, formData);
    setServiceUpdatingId(null);
    if (result.error) {
      onToast(result.error, "error");
    } else if (result.success) {
      onToast(result.success, "success");
      await onRefresh();
    }
  }

  return (
    <>
      {/* Create Service Form */}
      <section className="ui-panel-surface ui-panel-surface--muted grid gap-4">
        <h3 className="ui-section-title">Crear servicio</h3>
        <p className="ui-helper-text">
          Define nuevas ofertas con precio base y duración estandarizada.
        </p>
        <form
          data-testid="service-create-form"
          action={async (formData) => {
            const result = await createService(formData);
            if (result.error) {
              onToast(result.error, "error");
            } else if (result.success) {
              onToast(result.success, "success");
              await onRefresh();
            }
          }}
          className="ui-stack"
        >
          <label className="ui-field">
            <span className="ui-field__label">Nombre</span>
            <input
              name="name"
              required
              placeholder="Ej. Turnover rápido"
              className="ui-input"
            />
          </label>
          <label className="ui-field">
            <span className="ui-field__label">Descripción</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Opcional"
              className="ui-input ui-input--textarea"
            />
          </label>
          <div className="ui-grid-responsive">
            <label className="ui-field">
              <span className="ui-field__label">Precio base (USD)</span>
              <input
                name="basePrice"
                type="number"
                required
                min="0"
                step="0.01"
                className="ui-input"
              />
            </label>
            <label className="ui-field">
              <span className="ui-field__label">Duración (min)</span>
              <input
                name="durationMin"
                type="number"
                required
                min="30"
                step="15"
                className="ui-input"
              />
            </label>
          </div>
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </section>

      {/* Manage Services List */}
      <section className="ui-stack">
        <h3 className="ui-section-title">Gestionar servicios</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar servicios..."
              isLoading={isLoading}
            />
          </div>
          <label className="ui-field w-full sm:w-48">
            <span className="ui-field__label">Estado</span>
            <select
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(event.target.value as "all" | "true" | "false")
              }
              className="ui-input"
            >
              <option value="all">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
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
                <Skeleton className="h-5 w-40 mb-2" />
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32 mt-3" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="ui-helper-text">
            {filterChips.length > 0
              ? "No se encontraron servicios para los filtros seleccionados."
              : "No hay servicios configurados todavía."}
          </p>
        ) : (
          <div className="ui-stack">
            {services.map((service) => (
              <form
                key={service.id}
                className="ui-panel-surface ui-panel-surface--muted grid gap-4"
                action={async (formData) => {
                  await handleServiceUpdate(service.id, formData);
                }}
              >
                <div className="ui-flex-between">
                  <div className="flex flex-col gap-1">
                    <strong>{service.name}</strong>
                    <span className="ui-caption text-brisa-300">
                      Última actualización:{" "}
                      {new Date(service.updatedAt).toLocaleString("es-US")}
                    </span>
                  </div>
                  <span
                    className={`ui-caption font-semibold ${service.active ? "text-brisa-300" : "text-red-300"}`}
                  >
                    {service.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="ui-grid-responsive">
                  <label className="ui-field">
                    <span className="ui-field__label">Nombre</span>
                    <input
                      name="serviceName"
                      defaultValue={service.name}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Precio base (USD)</span>
                    <input
                      name="serviceBasePrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={service.basePrice}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Duración (min)</span>
                    <input
                      name="serviceDuration"
                      type="number"
                      min="30"
                      step="15"
                      defaultValue={service.durationMin}
                      className="ui-input"
                    />
                  </label>
                  <label className="ui-field">
                    <span className="ui-field__label">Estado</span>
                    <select
                      name="serviceActive"
                      defaultValue={service.active ? "true" : "false"}
                      className="ui-input"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </label>
                </div>
                <label className="ui-field">
                  <span className="ui-field__label">Descripción</span>
                  <textarea
                    name="serviceDescription"
                    rows={2}
                    defaultValue={service.description ?? ""}
                    className="ui-input ui-input--textarea"
                  />
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="max-w-fit"
                    isLoading={serviceUpdatingId === service.id}
                  >
                    {serviceUpdatingId === service.id
                      ? "Guardando..."
                      : "Actualizar servicio"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="max-w-fit"
                    isLoading={togglingServiceId === service.id && isToggling}
                    disabled={
                      togglingServiceId !== null &&
                      togglingServiceId !== service.id
                    }
                    onClick={() => {
                      startToggle(async () => {
                        setTogglingServiceId(service.id);
                        try {
                          const result = await toggleService(
                            service.id,
                            !service.active,
                          );
                          if (result.error) {
                            onToast(result.error, "error");
                          } else if (result.success) {
                            onToast(result.success, "success");
                            await onRefresh();
                          }
                        } finally {
                          setTogglingServiceId(null);
                        }
                      });
                    }}
                  >
                    {service.active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </form>
            ))}
            <Pagination
              count={services.length}
              hasMore={pageInfo.hasMore}
              isLoading={isLoadingMore}
              onLoadMore={onLoadMore}
              label="servicios"
            />
          </div>
        )}
      </section>
    </>
  );
}
