"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { Badge, Button, Card } from "@brisa/ui";
import type { BookingSummary } from "@/server/api/client";
import {
  updateBookingStatus,
  createReconciliationNoteAction,
  resolveReconciliationNoteAction,
  type UpdateBookingState,
  type CreateReconciliationNoteState,
  type ResolveReconciliationNoteState,
} from "./actions";

const statusOptions = [
  "TODOS",
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
const paymentStatusOptions = [
  "TODOS",
  "PENDING_PAYMENT",
  "PAID",
  "REQUIRES_ACTION",
  "REFUNDED",
  "FAILED",
] as const;

const updateInitialState: UpdateBookingState = { ok: false };
const noteInitialState: CreateReconciliationNoteState = { ok: false };
const resolveInitialState: ResolveReconciliationNoteState = { ok: false };

interface ManageBookingRowProps {
  booking: BookingSummary;
  useFakeData: boolean;
}

interface ManageBookingsProps {
  bookings: BookingSummary[];
  useFakeData: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "COMPLETED" || status === "CONFIRMED" ? "teal" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function paymentTone(paymentStatus?: string) {
  switch (paymentStatus) {
    case "PAID":
      return "teal";
    case "PENDING_PAYMENT":
    case "REQUIRES_ACTION":
      return "sunset";
    case "FAILED":
      return "neutral";
    default:
      return "neutral";
  }
}

function stripeDashboardUrl(booking: BookingSummary) {
  if (booking.stripeCheckoutSessionId) {
    return `https://dashboard.stripe.com/test/checkout/sessions/${booking.stripeCheckoutSessionId}`;
  }
  if (booking.stripePaymentIntentId) {
    return `https://dashboard.stripe.com/test/payments/${booking.stripePaymentIntentId}`;
  }
  return null;
}

function ManageBookingRow({ booking, useFakeData }: ManageBookingRowProps) {
  const [state, formAction] = useFormState(
    updateBookingStatus,
    updateInitialState,
  );
  const [noteState, noteAction] = useFormState(
    createReconciliationNoteAction,
    noteInitialState,
  );
  const [resolveState, resolveAction] = useFormState(
    resolveReconciliationNoteAction,
    resolveInitialState,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const stripeUrl = stripeDashboardUrl(booking);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<
    Array<{
      id: string;
      message: string;
      createdAt: string;
      status: "OPEN" | "RESOLVED";
      resolvedAt?: string | null;
      author?: { name: string | null; email: string };
      resolvedBy?: { name: string | null; email: string } | null;
    }>
  >([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setFeedback("Estado actualizado correctamente.");
    } else if (state.error) {
      setFeedback(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (noteState.ok) {
      setNote("");
    }
  }, [noteState]);

  useEffect(() => {
    if (useFakeData) {
      return;
    }

    async function loadNotes() {
      try {
        setLoadingNotes(true);
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const response = await fetch(
          `${apiBase}/api/reconciliation/booking/${booking.id}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load notes");
        }

        const json = (await response.json()) as Array<{
          id: string;
          message: string;
          createdAt: string;
          status: "OPEN" | "RESOLVED";
          resolvedAt?: string | null;
          author?: { name: string | null; email: string };
          resolvedBy?: { name: string | null; email: string } | null;
        }>;
        setNotes(json);
      } catch (error) {
        console.error("Error fetching reconciliation notes", error);
      } finally {
        setLoadingNotes(false);
      }
    }

    void loadNotes();
  }, [booking.id, noteState.ok, resolveState.ok, useFakeData]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-neutral-200">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="bookingId" value={booking.id} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-white">{booking.serviceName}</p>
            <p className="text-xs text-neutral-400">
              {booking.propertyName} · {booking.propertyAddress}
            </p>
            <p className="text-xs text-neutral-500">
              {new Date(booking.scheduledAt).toLocaleString("es-US")}
            </p>
            {booking.clientEmail ? (
              <p className="text-[11px] text-neutral-500">
                Cliente: {booking.clientName ?? booking.clientEmail} ·{" "}
                {booking.clientEmail}
              </p>
            ) : null}
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-300">
          <span>Pago:</span>
          <Badge tone={paymentTone(booking.paymentStatus)}>
            {booking.paymentStatus ?? "DESCONOCIDO"}
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-neutral-400">
            Nuevo estado
            <select
              name="status"
              defaultValue={booking.status}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {stripeUrl ? (
              <Button
                as="a"
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                intent="ghost"
              >
                Ver en Stripe
              </Button>
            ) : null}
            <Button type="submit" intent="secondary">
              Actualizar
            </Button>
          </div>
        </div>
        {feedback ? (
          <p
            className={`text-xs ${state.ok ? "text-teal-200" : "text-rose-300"}`}
          >
            {feedback}
          </p>
        ) : null}
      </form>

      <form
        action={noteAction}
        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3"
      >
        <input type="hidden" name="bookingId" value={booking.id} />
        <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">
          Registrar nota de conciliación
        </label>
        <textarea
          name="message"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Ej. Cliente confirmó transferencia, esperar 24h"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          {noteState.error ? (
            <span className="text-xs text-rose-300">{noteState.error}</span>
          ) : null}
          {noteState.ok ? (
            <span className="text-xs text-teal-200">Nota guardada.</span>
          ) : null}
          <Button type="submit" intent="ghost">
            Guardar nota
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-neutral-300">
        <span className="uppercase tracking-[0.2em] text-neutral-500">
          Historial de conciliación
        </span>
        {resolveState.error ? (
          <span className="text-rose-300">{resolveState.error}</span>
        ) : null}
        {resolveState.ok ? (
          <span className="text-teal-200">Nota marcada como resuelta.</span>
        ) : null}
        {loadingNotes ? (
          <p className="text-neutral-400">Cargando notas…</p>
        ) : notes.length === 0 ? (
          <p className="text-neutral-500">
            Aún no se registran notas para esta reserva.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((entry) => (
              <li
                key={entry.id}
                className="rounded border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <p className="text-neutral-200">{entry.message}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                  <span>
                    {entry.author?.name ?? entry.author?.email ?? "Desconocido"}{" "}
                    · {new Date(entry.createdAt).toLocaleString("es-US")}
                  </span>
                  <Badge tone={entry.status === "RESOLVED" ? "teal" : "sunset"}>
                    {entry.status}
                  </Badge>
                </div>
                {entry.resolvedBy ? (
                  <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                    Resuelto por:{" "}
                    {entry.resolvedBy.name ?? entry.resolvedBy.email}{" "}
                    {entry.resolvedAt
                      ? `· ${new Date(entry.resolvedAt).toLocaleString("es-US")}`
                      : ""}
                  </p>
                ) : null}
                {entry.status !== "RESOLVED" ? (
                  <form
                    action={resolveAction}
                    className="mt-2 flex items-center justify-end gap-2"
                  >
                    <input type="hidden" name="noteId" value={entry.id} />
                    <Button
                      type="submit"
                      intent="ghost"
                      className="px-3 py-1 text-xs"
                    >
                      Marcar resuelta
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ManageBookings({ bookings, useFakeData }: ManageBookingsProps) {
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusOptions)[number]>("TODOS");
  const [paymentFilter, setPaymentFilter] =
    useState<(typeof paymentStatusOptions)[number]>("TODOS");

  const filtered = bookings.filter((booking) => {
    const matchesStatus =
      statusFilter === "TODOS" ? true : booking.status === statusFilter;
    const matchesPayment =
      paymentFilter === "TODOS"
        ? true
        : (booking.paymentStatus ?? "PENDING_PAYMENT") === paymentFilter;
    return matchesStatus && matchesPayment;
  });

  if (bookings.length === 0) {
    return (
      <Card
        title="Sin reservas asignadas"
        description="Cuando se creen reservas pendientes, aparecerán aquí para que el equipo pueda gestionarlas."
      >
        <p className="text-sm text-neutral-300">
          Coordina con el concierge para generar las primeras reservas o
          consulta el histórico en el panel de datos.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-neutral-400">
          Estado reserva
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as (typeof statusOptions)[number],
              )
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-neutral-400">
          Estado pago
          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value as (typeof paymentStatusOptions)[number],
              )
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
          >
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.map((booking) => (
        <ManageBookingRow
          key={booking.id}
          booking={booking}
          useFakeData={useFakeData}
        />
      ))}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-neutral-300">
          No hay reservas que coincidan con los filtros seleccionados.
        </div>
      ) : null}
    </div>
  );
}
