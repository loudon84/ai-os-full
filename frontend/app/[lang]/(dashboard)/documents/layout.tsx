import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents | AI OS",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

