export interface ApiError extends Error {
  status?: number;
  body?: any;
}

export class ApiErrorHandler {
  static handle(error: unknown): string {
    let message = 'An unexpected error occurred. Please try again later.';

    if (error && typeof error === 'object') {
      const err = error as ApiError;

      switch (err.status) {
        case 400:
          message = 'Invalid request parameters. Please check your input.';
          break;
        case 401:
          message = 'Authentication required. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource could not be found.';
          break;
        case 422:
          message = 'Validation failed. Please correct the highlighted fields.';
          break;
        case 500:
          message = 'A server error occurred. Please try again later.';
          break;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    return message;
  }
}
