import DocumentDetailPage from "@/modules/documents/pages/DocumentDetailPage";

export default function DocumentPage({ params }: { params: { documentId: string } }) {
  return <DocumentDetailPage documentId={params.documentId} />;
}

