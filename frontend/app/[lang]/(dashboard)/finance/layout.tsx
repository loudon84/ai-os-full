import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance | AI OS",
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
