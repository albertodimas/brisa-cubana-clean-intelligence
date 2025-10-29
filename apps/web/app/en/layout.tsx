import type { ReactNode } from "react";
import { BaseLayout } from "../layout";

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <BaseLayout lang="en">{children}</BaseLayout>;
}
