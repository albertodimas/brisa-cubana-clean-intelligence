import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import BookingForm from "../components/BookingForm";
import type { Service, Property } from "@/types/api";
import { isFakeDataEnabled } from "@/server/utils/fake";

async function getServicesAndProperties(
  accessToken: string,
): Promise<{ services: Service[]; properties: Property[] }> {
  if (isFakeDataEnabled()) {
    const now = new Date().toISOString();
    const services: Service[] = [
      {
        id: "deep-clean-1",
        name: "Limpieza Profunda",
        description: "Limpieza detallada incluyendo áreas difíciles",
        basePrice: "149.99",
        duration: 180,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "vacation-rental-1",
        name: "Turnover Vacation Rental",
        description: "Limpieza express entre huéspedes con reporte fotográfico",
        basePrice: "119.99",
        duration: 90,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const properties: Property[] = [
      {
        id: "prop-residential-1",
        name: "Brickell Luxury Apartment",
        address: "1234 Brickell Ave, Unit 2501",
        city: "Miami",
        state: "FL",
        zipCode: "33131",
        type: "RESIDENTIAL",
        size: 1200,
        bedrooms: 2,
        bathrooms: 2,
        notes: null,
        userId: "client-user",
        createdAt: now,
        updatedAt: now,
        user: {
          id: "client-user",
          email: "client@brisacubanaclean.com",
          name: "Client Demo",
        },
        _count: {
          bookings: 3,
        },
      },
      {
        id: "prop-vacation-1",
        name: "Wynwood Vacation Rental",
        address: "567 NW 2nd Ave",
        city: "Miami",
        state: "FL",
        zipCode: "33127",
        type: "VACATION_RENTAL",
        size: 900,
        bedrooms: 1,
        bathrooms: 1,
        notes: null,
        userId: "client-user",
        createdAt: now,
        updatedAt: now,
        user: {
          id: "client-user",
          email: "client@brisacubanaclean.com",
          name: "Client Demo",
        },
        _count: {
          bookings: 5,
        },
      },
    ];

    return { services, properties };
  }

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
