"use client";

import DocumentDetailPage from "./DocumentDetailPage";

/** 独立 workbook 路由：与详情页共用编辑与 AI 面板，突出「AI 工作台」上下文与导航。 */
export default function DocumentWorkbookPage(props: { documentId: string }) {
  return <DocumentDetailPage documentId={props.documentId} variant="workbook" />;
}
