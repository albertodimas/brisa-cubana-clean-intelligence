"use client";

import { useState, useEffect, useCallback } from "react";

type CalendarFiltersProps = {
  onFiltersChange: (filters: {
    status?: string;
    propertyId?: string;
    serviceId?: string;
    assignedStaffId?: string;
  }) => void;
  properties?: Array<{ id: string; label: string }>;
  services?: Array<{ id: string; name: string }>;
  staff?: Array<{ id: string; fullName: string | null; email: string }>;
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function CalendarFilters({
  onFiltersChange,
  properties = [],
  services = [],
  staff = [],
}: CalendarFiltersProps) {
  const [status, setStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize filter change handler to prevent unnecessary re-renders
  const handleFiltersChange = useCallback(() => {
    onFiltersChange({
      status: status || undefined,
      propertyId: propertyId || undefined,
      serviceId: serviceId || undefined,
      assignedStaffId: assignedStaffId || undefined,
    });
  }, [status, propertyId, serviceId, assignedStaffId, onFiltersChange]);

  useEffect(() => {
    handleFiltersChange();
  }, [handleFiltersChange]);

  const handleClearFilters = () => {
    setStatus("");
    setPropertyId("");
    setServiceId("");
    setAssignedStaffId("");
  };

  const hasActiveFilters = status || propertyId || serviceId || assignedStaffId;

  return (
    <div
      id="calendar-filters"
      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-brisa-700 dark:bg-brisa-900"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filtros
        </h3>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900 dark:text-brisa-300 dark:hover:text-white"
            aria-label={isExpanded ? "Ocultar filtros" : "Mostrar filtros"}
          >
            <svg
              className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-brisa-200"
            >
              Estado
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-brisa-600 dark:bg-brisa-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Property Filter */}
          <div>
            <label
              htmlFor="property-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-brisa-200"
            >
              Propiedad
            </label>
            <select
              id="property-filter"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-brisa-600 dark:bg-brisa-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
            >
              <option value="">Todas las propiedades</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label
              htmlFor="service-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-brisa-200"
            >
              Servicio
            </label>
            <select
              id="service-filter"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-brisa-600 dark:bg-brisa-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
            >
              <option value="">Todos los servicios</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Filter */}
          <div>
            <label
              htmlFor="staff-filter"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-brisa-200"
            >
              Personal Asignado
            </label>
            <select
              id="staff-filter"
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-brisa-600 dark:bg-brisa-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
            >
              <option value="">Todo el personal</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName || member.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {hasActiveFilters && !isExpanded && (
        <div className="mt-2 flex flex-wrap gap-2">
          {status && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {STATUS_OPTIONS.find((opt) => opt.value === status)?.label}
              <button
                onClick={() => setStatus("")}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          )}
          {propertyId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              {properties.find((p) => p.id === propertyId)?.label}
              <button
                onClick={() => setPropertyId("")}
                className="hover:text-green-900 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          )}
          {serviceId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {services.find((s) => s.id === serviceId)?.name}
              <button
                onClick={() => setServiceId("")}
                className="hover:text-purple-900 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          )}
          {assignedStaffId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {staff.find((s) => s.id === assignedStaffId)?.fullName ||
                staff.find((s) => s.id === assignedStaffId)?.email}
              <button
                onClick={() => setAssignedStaffId("")}
                className="hover:text-orange-900 dark:hover:text-orange-100"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
