import type { DocumentListResponse, DocumentMeta, SnapshotEnvelope } from "../types/document.types";

const now = () => new Date().toISOString();

const mockDocuments: DocumentMeta[] = [
  {
    id: "doc-demo-1",
    title: "客户报价测算表",
    document_type: "spreadsheet",
    engine: "univer",
    status: "active",
    provider: "local",
    current_version_no: 1,
    owner_id: "user-demo",
    current_user_permission: "owner",
    created_at: now(),
    updated_at: now(),
  },
  {
    id: "doc-demo-2",
    title: "月度成本拆解",
    document_type: "spreadsheet",
    engine: "univer",
    status: "active",
    provider: "local",
    current_version_no: 3,
    owner_id: "user-demo",
    current_user_permission: "edit",
    created_at: now(),
    updated_at: now(),
  },
];

export async function mockListDocuments(params?: { keyword?: string; page?: number; pageSize?: number }): Promise<DocumentListResponse> {
  const keyword = params?.keyword?.trim();
  const items = keyword ? mockDocuments.filter((d) => d.title.includes(keyword)) : mockDocuments;
  return {
    items,
    page: params?.page ?? 1,
    page_size: params?.pageSize ?? 20,
    total: items.length,
  };
}

export async function mockCreateDocument(input: { title: string }): Promise<DocumentMeta> {
  const doc: DocumentMeta = {
    id: `doc-${Date.now()}`,
    title: input.title,
    document_type: "spreadsheet",
    engine: "univer",
    status: "active",
    provider: "local",
    current_version_no: 1,
    owner_id: "user-demo",
    current_user_permission: "owner",
    created_at: now(),
    updated_at: now(),
  };
  mockDocuments.unshift(doc);
  return doc;
}

export async function mockGetDocument(documentId: string): Promise<DocumentMeta> {
  const doc = mockDocuments.find((d) => d.id === documentId);
  if (!doc) throw new Error("document_not_found");
  return doc;
}

export async function mockGetSnapshot(documentId: string): Promise<SnapshotEnvelope> {
  const doc = await mockGetDocument(documentId);
  return {
    document_id: doc.id,
    document_type: "spreadsheet",
    engine: "univer",
    engine_version: "0.x",
    schema_version: 1,
    version_no: doc.current_version_no,
    saved_at: now(),
    saved_by: "user-demo",
    snapshot: {},
  };
}

