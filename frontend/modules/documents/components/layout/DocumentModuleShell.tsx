"use client";

import { useParams } from "next/navigation";

import { BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";

export function DocumentModuleShell(props: { title: string; children: React.ReactNode; breadcrumb?: React.ReactNode }) {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  const homeHref = lang ? `/${lang}` : "/";
  const documentsHref = lang ? `/${lang}/documents` : "/documents";

  return (
    <div className="space-y-6">
      {props.children}
    </div>
  );  
}

