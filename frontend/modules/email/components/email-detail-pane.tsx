"use client";

import type { EmailMessageResponse } from "@portal/shared";

import { EmailActionBar } from "./email-action-bar";
import { EmailDetail } from "./email-detail";
import { EmailThreadView } from "./email-thread-view";

export function EmailDetailPane(props: {
  mail: EmailMessageResponse;
  listMessages: EmailMessageResponse[];
  onMailUpdated?: () => void;
  runSummarizeEmail: () => Promise<string>;
  runDraftReply: () => Promise<string>;
  runExtractTasks: () => Promise<string>;
}) {
  const { mail, listMessages, onMailUpdated, runSummarizeEmail, runDraftReply, runExtractTasks } =
    props;

  return (
    <div className="flex min-h-0 flex-col">
      <EmailThreadView messages={listMessages} current={mail} />
      <EmailDetail mail={mail} onMailUpdated={onMailUpdated} />
      <EmailActionBar
        mail={mail}
        runSummarizeEmail={runSummarizeEmail}
        runDraftReply={runDraftReply}
        runExtractTasks={runExtractTasks}
      />
    </div>
  );
}
