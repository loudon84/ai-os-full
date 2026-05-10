/** 与 PRD / 后端审计动作对齐的权限码（RBAC 接入后由角色授予；未下发权限时前端宽松放行，由后端强校验） */
export const EMAIL_PERMISSION = {
  ACCOUNT_MANAGE: "email.account.manage",
  ACCOUNT_TEST: "email.account.test",
  MESSAGE_READ: "email.message.read",
  MESSAGE_SEND: "email.message.send",
  MESSAGE_MUTATE: "email.message.mutate",
  SYNC_RUN: "email.sync.run",
} as const;
