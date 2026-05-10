export interface FormSpecValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    keyword?: string;
  }>;
}

export interface FormDataValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    keyword?: string;
  }>;
}

