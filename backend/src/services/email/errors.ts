import { HttpError } from "../../errors.js";

export class EmailAccountNotFoundError extends HttpError {
  constructor(message = "No email account bound") {
    super(404, message, { code: "email_account_not_found" });
    this.name = "EmailAccountNotFoundError";
  }
}

export class EmailAccountExistsError extends HttpError {
  constructor(message = "User already has an email account") {
    super(409, message, { code: "email_account_exists" });
    this.name = "EmailAccountExistsError";
  }
}

export class EmailMessageNotFoundError extends HttpError {
  constructor(message = "Email message not found") {
    super(404, message, { code: "email_message_not_found" });
    this.name = "EmailMessageNotFoundError";
  }
}

export class EmailInvalidConfigError extends HttpError {
  constructor(message = "Email configuration is invalid") {
    super(400, message, { code: "email_invalid_config" });
    this.name = "EmailInvalidConfigError";
  }
}

export class EmailConnectionFailedError extends HttpError {
  constructor(message = "Email connection failed") {
    super(422, message, { code: "email_connection_failed" });
    this.name = "EmailConnectionFailedError";
  }
}

export class EmailSendFailedError extends HttpError {
  constructor(message = "Email send failed") {
    super(400, message, { code: "email_send_failed" });
    this.name = "EmailSendFailedError";
  }
}

export class EmailSyncInProgressError extends HttpError {
  constructor(message = "Email sync is already in progress") {
    super(429, message, { code: "email_sync_in_progress" });
    this.name = "EmailSyncInProgressError";
  }
}
