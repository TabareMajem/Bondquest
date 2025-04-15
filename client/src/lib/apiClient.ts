// This file provides a simplified API client for making requests to the backend

/**
 * Makes an API request to the specified endpoint.
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param endpoint API endpoint (e.g., "/api/users")
 * @param data Optional data to send with the request
 * @returns Promise with the response
 */
export async function apiRequest<T = any>(
  method: string,
  endpoint: string,
  data?: any
): Promise<T> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
    }

    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get request shorthand
 */
export function get<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>("GET", endpoint);
}

/**
 * Post request shorthand
 */
export function post<T = any>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>("POST", endpoint, data);
}

/**
 * Put request shorthand
 */
export function put<T = any>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>("PUT", endpoint, data);
}

/**
 * Patch request shorthand
 */
export function patch<T = any>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>("PATCH", endpoint, data);
}

/**
 * Delete request shorthand
 */
export function del<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>("DELETE", endpoint);
}
