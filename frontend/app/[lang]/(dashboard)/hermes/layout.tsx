import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hermes | AI OS",
};

export default function HermesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
