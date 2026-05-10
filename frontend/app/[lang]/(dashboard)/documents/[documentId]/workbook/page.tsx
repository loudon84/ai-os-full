import DocumentWorkbookPage from "@/modules/documents/pages/DocumentWorkbookPage";

export default function DocumentWorkbookRoutePage({ params }: { params: { documentId: string } }) {
  return <DocumentWorkbookPage documentId={params.documentId} />;
}
