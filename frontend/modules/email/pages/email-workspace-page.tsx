import { cookies } from "next/headers";

import { EmailWorkspace } from "../components/email-workspace";

export async function EmailWorkspacePage() {
  const layout = cookies().get("react-resizable-panels:layout");
  const collapsed = cookies().get("react-resizable-panels:collapsed");
  const defaultLayout = layout ? (JSON.parse(layout.value) as number[]) : undefined;
  const defaultCollapsed = collapsed ? (JSON.parse(collapsed.value) as boolean) : undefined;

  return (
    <EmailWorkspace
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
      navCollapsedSize={4}
    />
  );
}
