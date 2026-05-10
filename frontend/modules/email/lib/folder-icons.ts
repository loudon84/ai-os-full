import type { EmailFolderType } from "@portal/shared";

export function folderTypeIcon(type: EmailFolderType): string {
  switch (type) {
    case "inbox":
      return "heroicons:envelope";
    case "sent":
      return "heroicons:paper-airplane";
    case "drafts":
      return "heroicons:pencil-square";
    case "trash":
      return "heroicons:trash";
    case "spam":
      return "heroicons:exclamation-circle";
    case "starred":
      return "heroicons:star";
    case "archive":
      return "heroicons:archive-box-arrow-down";
    case "custom":
    default:
      return "heroicons:folder";
  }
}
