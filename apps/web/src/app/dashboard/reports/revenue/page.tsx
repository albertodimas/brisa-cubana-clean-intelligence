import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

interface RevenueData {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalRevenue: string;
    bookingsCount: number;
    averageBookingValue: string;
  };
  byService: Array<{
    serviceName: string;
    count: number;
    totalRevenue: string;
    averagePrice: string;
  }>;
  byPaymentStatus: Array<{
    status: string;
    count: number;
    totalRevenue: string;
  }>;
  recentBookings: Array<{
    id: string;
    scheduledAt: string;
    totalPrice: string;
    serviceName: string;
    clientName: string;
    clientEmail: string;
    paymentStatus: string;
  }>;
}

async function getRevenueData(
  accessToken: string,
  from?: string,
  to?: string,
): Promise<RevenueData> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const url = `${API_BASE_URL}/api/reports/revenue${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch revenue data");
  }

  return response.json();
}

const paymentStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pago Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

const paymentStatusTones: Record<
  string,
  "teal" | "neutral" | "orange" | "rose"
> = {
  PENDING_PAYMENT: "orange",
  PAID: "teal",
  FAILED: "rose",
  REFUNDED: "neutral",
};

interface RevenuePageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function RevenuePage({ searchParams }: RevenuePageProps) {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { from, to } = await searchParams;
  const revenueData = await getRevenueData(session.user.accessToken, from, to);

  const currencyFormatter = new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Analytics
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Reporte de Ingresos
        </h1>
        <p className="text-sm text-neutral-400">
          Análisis detallado de ingresos y servicios completados
        </p>
      </div>

      <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Calendar className="h-4 w-4" />
          <span>
            Período:{" "}
            {new Date(revenueData.period.from).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date(revenueData.period.to).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-teal-500/30 bg-teal-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">
                Ingresos Totales
              </p>
              <p className="mt-2 text-3xl font-bold text-teal-300">
                {currencyFormatter.format(
                  Number(revenueData.summary.totalRevenue),
                )}
              </p>
            </div>
            <div className="rounded-lg bg-teal-500/20 p-2">
              <DollarSign className="h-6 w-6 text-teal-300" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">
                Servicios Completados
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {revenueData.summary.bookingsCount}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-800 p-2">
              <TrendingUp className="h-6 w-6 text-neutral-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400">
                Valor Promedio
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {currencyFormatter.format(
                  Number(revenueData.summary.averageBookingValue),
                )}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-800 p-2">
              <CreditCard className="h-6 w-6 text-neutral-400" />
            </div>
          </div>
        </Card>
      </div>

      <Section
        title="Ingresos por Servicio"
        description="Desglose de ingresos por tipo de servicio"
      >
        <div className="grid gap-4">
          {revenueData.byService.map((service, index) => (
            <Card
              key={index}
              className="group transition hover:border-teal-500/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">
                    {service.serviceName}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    {service.count}{" "}
                    {service.count === 1 ? "servicio" : "servicios"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-teal-300">
                    {currencyFormatter.format(Number(service.totalRevenue))}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Promedio:{" "}
                    {currencyFormatter.format(Number(service.averagePrice))}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Estado de Pagos"
        description="Distribución de ingresos por estado de pago"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {revenueData.byPaymentStatus.map((payment, index) => (
            <Card key={index}>
              <Badge tone={paymentStatusTones[payment.status] ?? "neutral"}>
                {paymentStatusLabels[payment.status] ?? payment.status}
              </Badge>
              <p className="mt-3 text-2xl font-bold text-white">
                {currencyFormatter.format(Number(payment.totalRevenue))}
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {payment.count} {payment.count === 1 ? "reserva" : "reservas"}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="Servicios Recientes"
        description="Últimos 10 servicios completados"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-sm text-neutral-400">
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Servicio</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Estado de Pago</th>
                <th className="pb-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {revenueData.recentBookings.map((booking) => (
                <tr key={booking.id} className="text-sm">
                  <td className="py-3 text-neutral-300">
                    {new Date(booking.scheduledAt).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-white">{booking.serviceName}</td>
                  <td className="py-3 text-neutral-300">
                    <div>
                      <p className="text-white">{booking.clientName}</p>
                      <p className="text-xs text-neutral-500">
                        {booking.clientEmail}
                      </p>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge
                      tone={
                        paymentStatusTones[booking.paymentStatus] ?? "neutral"
                      }
                    >
                      {paymentStatusLabels[booking.paymentStatus] ??
                        booking.paymentStatus}
                    </Badge>
                  </td>
                  <td className="py-3 text-right font-medium text-teal-300">
                    {currencyFormatter.format(Number(booking.totalPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="flex justify-center">
        <Button intent="ghost" as="a" href="/dashboard">
          ← Volver al Dashboard
        </Button>
      </div>
    </section>
  );
}
