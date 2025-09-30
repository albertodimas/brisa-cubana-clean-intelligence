import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import PropertyForm from "../components/PropertyForm";

export default async function NewPropertyPage() {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Nueva Propiedad
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Registrar Propiedad
        </h1>
        <p className="text-sm text-neutral-400">
          Completa los datos de la propiedad para agendar servicios de limpieza
        </p>
      </div>

      <PropertyForm accessToken={session.user.accessToken} />
    </section>
  );
}
