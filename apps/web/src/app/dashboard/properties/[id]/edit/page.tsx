import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import PropertyForm from "../../components/PropertyForm";
import type { Property } from "@/types/api";

async function getProperty(id: string): Promise<Property> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch property");
  }

  return response.json();
}

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const property = await getProperty(id);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Editar Propiedad
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          {property.name}
        </h1>
        <p className="text-sm text-neutral-400">
          Actualiza la información de esta propiedad
        </p>
      </div>

      <PropertyForm property={property} />
    </section>
  );
}
