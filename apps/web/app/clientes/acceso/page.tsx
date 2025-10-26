import type { Metadata } from "next";
import { PortalAccessRequestScreen } from "./access-request-screen";

export const metadata: Metadata = {
  title: "Solicitar acceso · Portal Cliente Brisa Cubana",
  description:
    "Genera un enlace mágico temporal para ingresar al portal cliente y revisar tus reservas con Brisa Cubana Clean Intelligence.",
};

export default function PortalAccessRequestPage() {
  return <PortalAccessRequestScreen />;
}
