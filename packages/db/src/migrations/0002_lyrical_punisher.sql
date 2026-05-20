ALTER TABLE "documents" DROP CONSTRAINT "chk_documents_type";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "chk_documents_engine";--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "chk_documents_type" CHECK ("documents"."document_type" IN ('spreadsheet', 'markdown', 'pdf', 'html'));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "chk_documents_engine" CHECK ("documents"."engine" IN ('univer', 'tiptap', 'pdf-viewer', 'html-viewer'));