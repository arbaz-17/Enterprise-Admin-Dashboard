
import axios from "axios";

import type { ApiErrorResponse } from "@/features/auth/auth.types";

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const backendMessage = error.response?.data?.error?.message;

    if (backendMessage) {
      return backendMessage;
    }

    if (!error.response) {
      return "Unable to connect to the server. Please try again.";
    }

    return "Request failed. Please try again.";
  }

  return "An unexpected error occurred.";
}
