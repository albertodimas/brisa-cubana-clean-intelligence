import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import BookingForm from "../components/BookingForm";
import type { Service, Property } from "@/types/api";

async function getServicesAndProperties(
  accessToken: string,
): Promise<{ services: Service[]; properties: Property[] }> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const [servicesRes, propertiesRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/services`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }),
    fetch(`${API_BASE_URL}/api/properties`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }),
  ]);

  if (!servicesRes.ok || !propertiesRes.ok) {
    throw new Error("Failed to fetch data");
  }

  const [services, properties] = await Promise.all([
    servicesRes.json(),
    propertiesRes.json(),
  ]);

  return { services, properties };
}

export default async function NewBookingPage() {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  const { services, properties } = await getServicesAndProperties(
    session.user.accessToken,
  );

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Nueva Reserva
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Agendar Servicio
        </h1>
        <p className="text-sm text-neutral-400">
          Selecciona el servicio, propiedad y fecha para tu reserva
        </p>
      </div>

      <BookingForm
        accessToken={session.user.accessToken}
        userId={session.user.id}
        services={services}
        properties={properties}
      />
    </section>
  );
}
