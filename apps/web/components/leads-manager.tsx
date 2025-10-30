"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Lead, PaginationInfo } from "@/lib/api";
import type { ActionResult } from "@/lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";

const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  CONVERTED: "Ganado",
  LOST: "Perdido",
};

const STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABEL).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-900",
  CONTACTED: "bg-amber-100 text-amber-900",
  QUALIFIED: "bg-purple-100 text-purple-900",
  CONVERTED: "bg-emerald-100 text-emerald-900",
  LOST: "bg-rose-100 text-rose-900",
};

type LeadsManagerProps = {
  leads: Lead[];
  pageInfo: PaginationInfo;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  refresh: () => Promise<void>;
  onUpdateLead: (leadId: string, formData: FormData) => Promise<ActionResult>;
  onToast: (message: string, type: "success" | "error") => void;
};

type LeadRowProps = {
  lead: Lead;
  onSave: (payload: {
    status?: string;
    notes?: string | null;
  }) => Promise<ActionResult>;
};

function LeadRow({ lead, onSave }: LeadRowProps) {
  const [status, setStatus] = useState<string>(lead.status);
  const [notes, setNotes] = useState<string>(lead.notes ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(lead.status);
  }, [lead.status]);

  useEffect(() => {
    setNotes(lead.notes ?? "");
  }, [lead.notes]);

  const hasChanges =
    status !== lead.status || (notes ?? "") !== (lead.notes ?? "");

  const statusBadgeClass =
    STATUS_COLOR[lead.status] ?? "bg-gray-100 text-gray-900";

  return (
    <Card key={lead.id} className="bg-white/70 dark:bg-brisa-900/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-lg font-semibold text-brisa-950 dark:text-white">
            {lead.name}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-brisa-300">
            <span>{lead.email}</span>
            {lead.phone && <span>· {lead.phone}</span>}
            <span>
              {new Date(lead.createdAt).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <Badge className={statusBadgeClass}>
          {LEAD_STATUS_LABEL[lead.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 text-sm text-gray-600 dark:text-brisa-300">
            <p>
              <span className="font-medium text-gray-900 dark:text-brisa-100">
                Servicio:
              </span>{" "}
              {lead.serviceInterest ?? "—"}
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-brisa-100">
                Plan:
              </span>{" "}
              {lead.planCode ?? "—"}
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-brisa-100">
                Unidades:
              </span>{" "}
              {lead.propertyCount ?? "—"}
            </p>
            {lead.utmCampaign && (
              <p>
                <span className="font-medium text-gray-900 dark:text-brisa-100">
                  Campaña:
                </span>{" "}
                {lead.utmCampaign}
              </p>
            )}
          </div>
          <div className="grid gap-3">
            <Select
              label="Estado"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={STATUS_OPTIONS}
              selectSize="sm"
            />
            <Textarea
              label="Notas internas"
              placeholder="Resumen del contacto, próximos pasos..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            disabled={!hasChanges || isPending}
            onClick={() => {
              setStatus(lead.status);
              setNotes(lead.notes ?? "");
            }}
          >
            Descartar
          </Button>
          <Button
            disabled={!hasChanges || isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await onSave({
                  status,
                  notes,
                });
                if (result.error) {
                  return;
                }
                setStatus(status);
                setNotes(notes ?? "");
              });
            }}
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeadsManager({
  leads,
  isLoading,
  isLoadingMore,
  onLoadMore,
  pageInfo,
  refresh,
  onUpdateLead,
  onToast,
}: LeadsManagerProps) {
  const sortedLeads = useMemo(
    () =>
      [...leads].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [leads],
  );

  if (isLoading) {
    return (
      <section className="ui-stack">
        <h3 className="ui-section-title">Leads comerciales</h3>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`lead-skeleton-${index}`}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ui-stack">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="ui-section-title">Leads comerciales</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh().catch(() => undefined)}
          disabled={isLoading}
        >
          Refrescar
        </Button>
      </div>
      {sortedLeads.length === 0 ? (
        <p className="ui-helper-text">
          Aún no se registran leads. Cuando llegue un lead desde la landing o
          campañas, aparecerá aquí para seguimiento.
        </p>
      ) : (
        <div className="grid gap-4">
          {sortedLeads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onSave={async ({ status, notes }) => {
                const formData = new FormData();
                if (status && status !== lead.status) {
                  formData.set("leadStatus", status);
                }
                if (notes !== undefined && notes !== lead.notes) {
                  formData.set("leadNotes", notes ?? "");
                }

                const result = await onUpdateLead(lead.id, formData);
                if (result.error) {
                  onToast(result.error, "error");
                } else if (result.success) {
                  onToast(result.success, "success");
                  await refresh().catch(() => undefined);
                }
                return result;
              }}
            />
          ))}
          {pageInfo.hasMore && (
            <Button
              variant="outline"
              disabled={isLoadingMore}
              onClick={() => onLoadMore()}
            >
              {isLoadingMore ? "Cargando..." : "Cargar más"}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
