import { AxiosError } from 'axios';
export function handleError(error: unknown, context?: string): string {
  let userMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';

  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> };

    if (data) {
      if (data.errors) {
        const firstErrorKey = Object.keys(data.errors)[0];
        const firstErrorMessage = data.errors[firstErrorKey]?.[0];
        if (firstErrorMessage) {
          userMessage = firstErrorMessage;
        }
      }
      else if (data.message) {
        userMessage = data.message;
      }
    }
  }
  else if (error instanceof Error) {
    userMessage = error.message;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.groupCollapsed(`[ErrorHandler] Context: ${context || 'General'}`);
    console.error(error);
    console.groupEnd();
  }

  return userMessage;
}