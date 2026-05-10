export class HttpError extends Error {
  public readonly code?: string;
  public readonly extra?: Record<string, unknown>;

  constructor(
    public readonly status: number,
    message: string,
    options?: { code?: string; extra?: Record<string, unknown> },
  ) {
    super(message);
    this.name = "HttpError";
    this.code = options?.code;
    this.extra = options?.extra;
  }
}

export function badRequest(message: string, code = "bad_request"): never {
  throw new HttpError(400, message, { code });
}
export function unauthorized(message = "Unauthorized"): never {
  throw new HttpError(401, message, { code: "unauthorized" });
}
export function forbidden(message = "Forbidden"): never {
  throw new HttpError(403, message, { code: "forbidden" });
}
export function notFound(message = "Not found"): never {
  throw new HttpError(404, message, { code: "not_found" });
}
export function conflict(message: string, code = "conflict"): never {
  throw new HttpError(409, message, { code });
}
export function validationError(message: string): never {
  throw new HttpError(422, message, { code: "validation_error" });
}
