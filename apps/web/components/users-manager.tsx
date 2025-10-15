"use client";

import { useEffect, useMemo, useState } from "react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import type { PaginationInfo, User } from "@/lib/api";
import { FilterChips } from "./ui/filter-chips";
import { Pagination } from "./ui/pagination";
import { SearchBar } from "./ui/search-bar";
import { Chip } from "./ui/chip";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";

const USER_ROLES = ["ADMIN", "COORDINATOR", "STAFF", "CLIENT"] as const;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type ActionResult = {
  success?: string;
  error?: string;
};

type UsersManagerProps = {
  users: User[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  currentQuery: QueryParams;
  setQuery: (query: QueryParams) => Promise<void>;
  resetQuery: () => Promise<void>;
  refresh: () => Promise<void>;
  onUpdate: (userId: string, formData: FormData) => Promise<ActionResult>;
  onToggleActive: (userId: string, active: boolean) => Promise<ActionResult>;
  currentUserId?: string | null;
  onToast: (message: string, type: "success" | "error") => void;
};

export function UsersManager({
  users,
  pageInfo,
  isLoading,
  isLoadingMore,
  onLoadMore,
  currentQuery,
  setQuery,
  resetQuery,
  refresh,
  onUpdate,
  onToggleActive,
  currentUserId = null,
  onToast,
}: UsersManagerProps) {
  const [searchTerm, setSearchTerm] = useState<string>(
    typeof currentQuery.search === "string" ? String(currentQuery.search) : "",
  );
  const [roleFilter, setRoleFilter] = useState<string>(
    typeof currentQuery.role === "string" ? String(currentQuery.role) : "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    typeof currentQuery.isActive === "boolean"
      ? currentQuery.isActive
        ? "ACTIVE"
        : "INACTIVE"
      : "ALL",
  );
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    const nextSearch =
      typeof currentQuery.search === "string"
        ? String(currentQuery.search)
        : "";
    if (nextSearch !== searchTerm) {
      setSearchTerm(nextSearch);
    }
  }, [currentQuery.search]);

  useEffect(() => {
    const nextRole =
      typeof currentQuery.role === "string" && currentQuery.role.length > 0
        ? String(currentQuery.role)
        : "ALL";
    if (nextRole !== roleFilter) {
      setRoleFilter(nextRole);
    }
  }, [currentQuery.role]);

  useEffect(() => {
    const nextStatus: StatusFilter =
      typeof currentQuery.isActive === "boolean"
        ? currentQuery.isActive
          ? "ACTIVE"
          : "INACTIVE"
        : "ALL";
    if (nextStatus !== statusFilter) {
      setStatusFilter(nextStatus);
    }
  }, [currentQuery.isActive]);

  useEffect(() => {
    const query: QueryParams = {};
    if (searchTerm.trim()) {
      query.search = searchTerm.trim();
    }
    if (roleFilter !== "ALL") {
      query.role = roleFilter;
    }
    if (statusFilter === "ACTIVE") {
      query.isActive = true;
    } else if (statusFilter === "INACTIVE") {
      query.isActive = false;
    }
    void setQuery(query);
  }, [roleFilter, searchTerm, setQuery, statusFilter]);

  const filters = useMemo(() => {
    const activeFilters: { key: string; label: string; value: string }[] = [];
    if (searchTerm.trim()) {
      activeFilters.push({
        key: "search",
        label: "Búsqueda",
        value: searchTerm.trim(),
      });
    }
    if (roleFilter !== "ALL") {
      activeFilters.push({
        key: "role",
        label: "Rol",
        value: roleFilter,
      });
    }
    if (statusFilter === "ACTIVE" || statusFilter === "INACTIVE") {
      activeFilters.push({
        key: "status",
        label: "Estado",
        value: statusFilter === "ACTIVE" ? "Activo" : "Inactivo",
      });
    }
    return activeFilters;
  }, [roleFilter, searchTerm, statusFilter]);

  const hasUsers = users.length > 0;

  return (
    <section className="ui-stack">
      <h3 className="ui-section-title">Gestión de usuarios</h3>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <div className="w-full">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar usuarios..."
            isLoading={isLoading}
          />
        </div>
        <label className="ui-field">
          <span className="ui-field__label">Filtrar por rol</span>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="ui-input"
            aria-label="Filtrar por rol"
          >
            <option value="ALL">Todos los roles</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="ui-field">
          <span className="ui-field__label">Estado</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="ui-input"
            aria-label="Filtrar por estado"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </label>
      </div>

      <FilterChips
        filters={filters}
        onRemove={(key) => {
          if (key === "search") {
            setSearchTerm("");
          } else if (key === "role") {
            setRoleFilter("ALL");
          } else if (key === "status") {
            setStatusFilter("ALL");
          }
        }}
        onClearAll={
          filters.length > 0
            ? () => {
                setSearchTerm("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
                void resetQuery();
              }
            : undefined
        }
      />

      {isLoading ? (
        <div className="ui-panel-surface ui-panel-surface--muted">
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : !hasUsers ? (
        <p className="ui-helper-text">
          {filters.length > 0
            ? "No se encontraron usuarios con los filtros aplicados."
            : "No hay usuarios registrados."}
        </p>
      ) : (
        <div className="ui-stack">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Usuario</TableHeader>
                <TableHeader>Nombre</TableHeader>
                <TableHeader>Rol</TableHeader>
                <TableHeader>Estado</TableHeader>
                <TableHeader>Última actualización</TableHeader>
                <TableHeader align="right">Acciones</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName ?? "Sin nombre"}</TableCell>
                  <TableCell>
                    <Chip>{user.role}</Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className={
                        user.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(user.updatedAt).toLocaleString("es-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <form
                      action={async (formData) => {
                        setPendingUserId(user.id);
                        const result = await onUpdate(user.id, formData);
                        setPendingUserId(null);
                        if (result.error) {
                          onToast(
                            result.error ?? "No se pudo actualizar el usuario",
                            "error",
                          );
                          return;
                        }
                        onToast(
                          result.success ?? "Usuario actualizado correctamente",
                          "success",
                        );
                        await refresh();
                      }}
                      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 items-center"
                    >
                      <select
                        name="userRole"
                        defaultValue={user.role}
                        className="ui-input"
                        aria-label={`Rol de ${user.email}`}
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <input
                        name="userFullName"
                        type="text"
                        defaultValue={user.fullName ?? ""}
                        placeholder="Nombre completo"
                        className="ui-input"
                      />
                      <input
                        name="userPassword"
                        type="password"
                        placeholder="Nueva contraseña (opcional)"
                        className="ui-input"
                      />
                      <label
                        className={`flex items-center gap-2 rounded-lg border border-brisa-600/20 bg-brisa-800/40 px-3 py-2 ${
                          user.id === currentUserId
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={user.isActive}
                          onChange={async (event) => {
                            if (user.id === currentUserId) {
                              event.preventDefault();
                              onToast(
                                "No puedes desactivar tu propia cuenta",
                                "error",
                              );
                              return;
                            }
                            setPendingUserId(user.id);
                            const target = event.currentTarget;
                            const nextActive = target.checked;
                            const result = await onToggleActive(
                              user.id,
                              nextActive,
                            );
                            setPendingUserId(null);
                            if (result.error) {
                              onToast(
                                result.error ??
                                  "No se pudo actualizar el estado",
                                "error",
                              );
                              target.checked = user.isActive;
                              return;
                            }
                            onToast(
                              result.success ?? "Estado actualizado",
                              "success",
                            );
                            await refresh();
                          }}
                          disabled={
                            user.id === currentUserId ||
                            pendingUserId === user.id
                          }
                        />
                        <span className="ui-field__label">Activo</span>
                      </label>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="max-w-fit"
                        isLoading={pendingUserId === user.id}
                      >
                        {pendingUserId === user.id
                          ? "Guardando..."
                          : "Actualizar"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            count={users.length}
            hasMore={pageInfo.hasMore}
            isLoading={isLoadingMore}
            onLoadMore={onLoadMore}
            label="usuarios"
          />
        </div>
      )}
    </section>
  );
}
