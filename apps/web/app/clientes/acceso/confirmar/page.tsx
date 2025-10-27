import type { Metadata } from "next";
import { PortalAccessVerifyScreen } from "./access-verify-screen";

export const metadata: Metadata = {
  title: "Validar enlace · Portal Cliente Brisa Cubana",
  description:
    "Verifica tu token de acceso al portal cliente y entra directamente a tus reservas con Brisa Cubana Clean Intelligence.",
};

export default function PortalAccessVerifyPage() {
  return <PortalAccessVerifyScreen />;
}
