import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { StaffWorkspace } from "./staff-workspace";

export const metadata = {
  title: "App Staff - Brisa Cubana",
  description: "App móvil para gestión de servicios en campo",
};

export default async function StaffPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.accessToken) {
    redirect("/auth/signin");
  }

  // Only STAFF can access this app
  if (session.user.role !== "STAFF") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-black">
      <StaffWorkspace
        accessToken={session.user.accessToken}
        userName={session.user.name ?? session.user.email}
      />
    </div>
  );
}
