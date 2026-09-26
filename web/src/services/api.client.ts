import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "@/constants/app";
import { isValidationError, type ApiErrorResponse } from "@/types/api";

/**
 * Normalised error surfaced to the UI. Every service rejection is one of these,
 * so components never have to inspect an Axios error directly.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly fieldErrors: Record<string, string[]>;

  constructor(params: {
    message: string;
    status: number;
    endpoint: string;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.endpoint = params.endpoint;
    this.fieldErrors = params.fieldErrors ?? {};
  }

  /** True when the request never reached the server. */
  get isNetworkError() {
    return this.status === 0;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidationError() {
    return this.status === 400;
  }

  /** Flattened, user-presentable field messages. */
  get fieldMessages(): string[] {
    return Object.values(this.fieldErrors).flat();
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "content-type": "application/json" },
});

/* -------------------------------------------------------------------------- */
/* Interceptors                                                                */
/* -------------------------------------------------------------------------- */

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    config.headers.set("x-lucis-client", "web");
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 0;
    const endpoint = error.config?.url ?? "unknown";

    let message = "Unable to reach the Lucis service.";
    let fieldErrors: Record<string, string[]> = {};

    if (error.code === "ECONNABORTED") {
      message = "The request timed out. Check that the API is running.";
    } else if (error.response) {
      const body = error.response.data;

      if (isValidationError(body)) {
        message = body.error;
        fieldErrors = body.details.fieldErrors;
      } else if (body && typeof body.error === "string") {
        message = body.error;
      } else {
        message =
          status >= 500
            ? "The Lucis service reported an internal error."
            : `Request failed with status ${status}.`;
      }
    } else if (typeof navigator !== "undefined" && !navigator.onLine) {
      message = "You are offline. Showing the last known data.";
    }

    return Promise.reject(
      new ApiError({ message, status, endpoint, fieldErrors }),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Verb helpers                                                                */
/* -------------------------------------------------------------------------- */

async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const response = await promise;
  return response.data;
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(http.get<T>(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.post<T>(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    unwrap<T>(http.patch<T>(url, body, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    unwrap<T>(http.delete<T>(url, config)),
};

/**
 * Build a query string from a flat object, dropping `undefined`, `null` and
 * empty values. Accepts any object of primitives so callers can spread a
 * `Coordinates` value directly.
 */
export function toQuery(params: object): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
