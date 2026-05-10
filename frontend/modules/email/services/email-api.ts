import { api } from "@/config/axios.config";
import { tokenManager } from "@/modules/auth/lib/token-manager";
import type {
  BatchEmailActionRequest,
  BatchEmailActionResponse,
  CreateEmailAccountRequest,
  EmailAccountResponse,
  EmailFolderResponse,
  EmailListParams,
  EmailListResponse,
  EmailMessageResponse,
  EmailSyncResponse,
  EmailSyncStatusResponse,
  SendEmailRequest,
  SendEmailResponse,
  TestConnectionRequest,
  TestConnectionResult,
  UpdateEmailAccountRequest,
  UpdateEmailMessageRequest,
} from "@portal/shared";

import { normalizeEmailApiError, wrapEmailRequest } from "../lib/email-errors";
import type { EmailResult } from "../types/email-result";
import type { EmailContactView } from "../types/email-view";

export async function fetchEmailAccount(): Promise<EmailResult<EmailAccountResponse | null>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.get<EmailAccountResponse | null>("/email/account");
    return data;
  });
}

export async function createEmailAccount(
  body: CreateEmailAccountRequest,
): Promise<EmailResult<EmailAccountResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.post<EmailAccountResponse>("/email/account", body);
    return data;
  });
}

export async function updateEmailAccount(
  body: UpdateEmailAccountRequest,
): Promise<EmailResult<EmailAccountResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.patch<EmailAccountResponse>("/email/account", body);
    return data;
  });
}

export async function deleteEmailAccount(): Promise<EmailResult<{ ok: true }>> {
  return wrapEmailRequest(async () => {
    await api.delete("/email/account");
    return { ok: true as const };
  });
}

export async function testEmailConnection(
  body: TestConnectionRequest,
): Promise<EmailResult<TestConnectionResult>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.post<TestConnectionResult>("/email/account/test", body);
    return data;
  });
}

export async function listEmailFolders(): Promise<EmailResult<EmailFolderResponse[]>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.get<EmailFolderResponse[]>("/email/folders");
    return data;
  });
}

export async function listEmailMessages(
  params: EmailListParams,
): Promise<EmailResult<EmailListResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.get<EmailListResponse>("/email/messages", { params });
    return data;
  });
}

export async function getEmailMessage(id: string): Promise<EmailResult<EmailMessageResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.get<EmailMessageResponse>(`/email/messages/${id}`);
    return data;
  });
}

export async function sendEmailMessage(
  body: SendEmailRequest,
): Promise<EmailResult<SendEmailResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.post<SendEmailResponse>("/email/messages/send", body);
    return data;
  });
}

export async function updateEmailMessage(
  id: string,
  body: UpdateEmailMessageRequest,
): Promise<EmailResult<EmailMessageResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.patch<EmailMessageResponse>(`/email/messages/${id}`, body);
    return data;
  });
}

export async function deleteEmailMessage(
  id: string,
  permanent?: boolean,
): Promise<EmailResult<{ ok: true }>> {
  return wrapEmailRequest(async () => {
    await api.delete(`/email/messages/${id}`, {
      params: permanent ? { permanent: "true" } : undefined,
    });
    return { ok: true as const };
  });
}

export async function batchEmailMessageActions(
  body: BatchEmailActionRequest,
): Promise<EmailResult<BatchEmailActionResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.post<BatchEmailActionResponse>("/email/messages/actions", body);
    return data;
  });
}

export async function triggerEmailSync(): Promise<EmailResult<EmailSyncResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.post<EmailSyncResponse>("/email/sync");
    return data;
  });
}

export async function fetchEmailSyncStatus(): Promise<EmailResult<EmailSyncStatusResponse>> {
  return wrapEmailRequest(async () => {
    const { data } = await api.get<EmailSyncStatusResponse>("/email/sync/status");
    return data;
  });
}

export function emailAttachmentDownloadUrl(attachmentId: string): string {
  return `/api/email/attachments/${attachmentId}`;
}

/** 携带 Bearer 下载附件（<a href> 无法附带 Authorization） */
export async function downloadEmailAttachment(
  attachmentId: string,
  filename: string,
): Promise<EmailResult<undefined>> {
  try {
    const token = tokenManager.getAccessToken();
    const res = await fetch(emailAttachmentDownloadUrl(attachmentId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        success: false,
        error: {
          status: res.status,
          message: errBody?.message ?? (res.status === 404 ? "附件不存在" : "下载失败"),
        },
      };
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "attachment";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: normalizeEmailApiError(error) };
  }
}

export async function getEmailDemoContacts(): Promise<{ contacts: EmailContactView[] }> {
  try {
    const response = await api.get<{ contacts: EmailContactView[] }>("/chat");
    return response.data;
  } catch {
    return { contacts: [] };
  }
}
